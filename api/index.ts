import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import XLSX from 'xlsx';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  dest: '/tmp/uploads',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) cb(null, true);
    else cb(new Error('Only .xlsx, .xls, .csv files allowed'));
  },
});

function getSupabase() {
  const url = process.env.SUPABASE_URL || 'https://ixzbppbwwtdfxsztjrhu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(url, key);
}

function getSecret() {
  return process.env.JWT_SECRET || 'secret';
}

function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(header.replace('Bearer ', ''), getSecret()) as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Health
app.get('/api/v1/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/v1/auth/login', async (req: any, res: any) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, data.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    if (!data.active) return res.status(403).json({ error: 'Account disabled' });
    const token = jwt.sign({ id: data.id, username: data.username, role: data.role }, getSecret(), { expiresIn: '24h' });
    res.json({ token, user: { id: data.id, username: data.username, name: data.name, role: data.role } });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

app.get('/api/v1/auth/me', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('id,username,name,role,phone').eq('id', req.user.id).single();
    if (error || !data) return res.status(401).json({ error: 'User not found' });
    res.json(data);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Dashboard
app.get('/api/v1/dashboard/summary', authMiddleware, async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const [totalLoans, activeLoans, stages, categories] = await Promise.all([
      supabase.from('loans').select('*', { count: 'exact', head: true }),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('followup_stages').select('current_stage'),
      supabase.from('loans').select('loan_category, total_due, disburse_amount'),
    ]);
    const overdueRows = await supabase.from('loans').select('total_due').gt('due_count', 0);
    const portfolioRows = await supabase.from('loans').select('disburse_amount');
    const totalOverdue = overdueRows.data?.reduce((s: number, r: any) => s + Number(r.total_due || 0), 0) || 0;
    const totalPortfolio = portfolioRows.data?.reduce((s: number, r: any) => s + Number(r.disburse_amount || 0), 0) || 0;
    const stageMap: Record<string, number> = {};
    stages.data?.forEach((s: any) => { stageMap[s.current_stage] = (stageMap[s.current_stage] || 0) + 1; });
    const catMap: Record<string, any> = {};
    categories.data?.forEach((c: any) => {
      if (!catMap[c.loan_category]) catMap[c.loan_category] = { count: 0, totalDue: 0, totalDisbursed: 0 };
      catMap[c.loan_category].count++;
      catMap[c.loan_category].totalDue += Number(c.total_due || 0);
      catMap[c.loan_category].totalDisbursed += Number(c.disburse_amount || 0);
    });
    res.json({
      totalLoans: totalLoans.count || 0,
      activeLoans: activeLoans.count || 0,
      overdueLoans: totalOverdue,
      totalPortfolio,
      stageCounts: Object.entries(stageMap).map(([stage, count]) => ({ stage, count })),
      categoryBreakdown: Object.entries(catMap).map(([category, v]: [string, any]) => ({ category, ...v })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/dashboard/aging', authMiddleware, async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from('loans').select('due_count, total_due, disburse_amount').order('due_count');
    const buckets: Record<number, any> = {};
    data?.forEach((r: any) => {
      const k = r.due_count || 0;
      if (!buckets[k]) buckets[k] = { dueCount: k, count: 0, totalDue: 0, totalDisbursed: 0 };
      buckets[k].count++;
      buckets[k].totalDue += Number(r.total_due || 0);
      buckets[k].totalDisbursed += Number(r.disburse_amount || 0);
    });
    res.json(Object.values(buckets));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Loans
app.get('/api/v1/loans', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { search, category, status, stage, page = '1', limit = '20' } = req.query;
    const pg = parseInt(page);
    const lim = parseInt(limit);
    const from = (pg - 1) * lim;
    const to = from + lim - 1;
    let query = supabase.from('loans').select('*, followup_stages(*)', { count: 'exact' });
    if (category) query = query.eq('loan_category', category);
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('member_name', `%${search}%`);
    if (stage) query = query.eq('followup_stages.current_stage', stage);
    const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ loans: data || [], total: count || 0, page: pg, limit: lim });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/loans/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data: loan, error } = await supabase.from('loans').select('*').eq('id', req.params.id).single();
    if (error || !loan) return res.status(404).json({ error: 'Loan not found' });
    const [stageRes, visitsRes, remindersRes, activityRes] = await Promise.all([
      supabase.from('followup_stages').select('*, stage_history(*)').eq('loan_id', req.params.id).single(),
      supabase.from('field_visits').select('*').eq('loan_id', req.params.id).order('visit_date', { ascending: false }),
      supabase.from('reminders').select('*').eq('loan_id', req.params.id).order('due_date'),
      supabase.from('activity_log').select('*').eq('loan_id', req.params.id).order('created_at', { ascending: false }).range(0, 19),
    ]);
    res.json({ ...loan, followupStage: stageRes.data || null, fieldVisits: visitsRes.data || [], reminders: remindersRes.data || [], activityLogs: activityRes.data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/v1/loans/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('loans').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    await supabase.from('activity_log').insert({
      id: crypto.randomUUID(), loan_id: req.params.id, action: 'loan_updated', description: 'Loan details updated',
      created_by: req.user.id, metadata: { changes: Object.keys(req.body) },
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stages
const VALID_TRANSITIONS: Record<string, string[]> = {
  import: ['soft_call', 'notice'],
  soft_call: ['field_visit', 'promise_paid', 'escalate'],
  notice: ['field_visit', 'promise_paid', 'legal'],
  field_visit: ['promise_paid', 'escalate', 'resolved'],
  promise_paid: ['field_visit', 'resolved', 'soft_call'],
  escalate: ['field_visit', 'legal', 'manager_review'],
  legal: ['escalate', 'written_off', 'resolved'],
  manager_review: ['escalate', 'field_visit', 'resolved'],
  written_off: ['resolved'],
  resolved: [],
};

app.get('/api/v1/stages/board', authMiddleware, async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from('followup_stages').select('*, loans(id, account_no, member_name, loan_category, total_due, due_count)');
    const board: Record<string, any[]> = {};
    data?.forEach((s: any) => {
      if (!board[s.current_stage]) board[s.current_stage] = [];
      board[s.current_stage].push(s);
    });
    res.json(board);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/stages/:loanId', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('followup_stages').select('*, stage_history(*)').eq('loan_id', req.params.loanId).single();
    if (error || !data) return res.status(404).json({ error: 'Stage not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/stages/:loanId/transition', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { toStage, note } = req.body;
    const { data: stage, error } = await supabase.from('followup_stages').select('*').eq('loan_id', req.params.loanId).single();
    if (error || !stage) return res.status(404).json({ error: 'Stage not found' });
    const allowed = VALID_TRANSITIONS[stage.current_stage] || [];
    if (!allowed.includes(toStage)) return res.status(400).json({ error: `Cannot transition from '${stage.current_stage}' to '${toStage}'` });
    const { data: updated } = await supabase.from('followup_stages').update({ current_stage: toStage, stage_entered_at: new Date().toISOString(), notes: note || undefined }).eq('loan_id', req.params.loanId).select().single();
    await supabase.from('stage_history').insert({
      id: crypto.randomUUID(), stage_id: stage.id, from_stage: stage.current_stage, to_stage: toStage,
      transitioned_by: req.user.id, note: note || null,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Visits
app.get('/api/v1/visits', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { loanId, status, page = '1', limit = '20' } = req.query;
    const pg = parseInt(page);
    const lim = parseInt(limit);
    let query = supabase.from('field_visits').select('*, loans(account_no, member_name)', { count: 'exact' });
    if (loanId) query = query.eq('loan_id', loanId);
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query.range((pg - 1) * lim, pg * lim - 1).order('visit_date', { ascending: false });
    if (error) throw error;
    res.json({ visits: data || [], total: count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/visits', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('field_visits').insert({ id: crypto.randomUUID(), ...req.body, created_by: req.user.id }).select().single();
    if (error) throw error;
    await supabase.from('activity_log').insert({
      id: crypto.randomUUID(), loan_id: data.loan_id, action: 'field_visit_created', description: `Field visit logged: ${data.status}`, created_by: req.user.id,
    });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/visits/sync', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const visits = req.body.visits || [];
    let synced = 0;
    for (const v of visits) {
      const { error } = await supabase.from('field_visits').insert({ id: v.id || crypto.randomUUID(), ...v, synced: true, synced_at: new Date().toISOString(), created_by: req.user.id });
      if (!error) synced++;
    }
    res.status(201).json({ synced });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reminders
app.get('/api/v1/reminders', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { completed, page = '1', limit = '20' } = req.query;
    let query = supabase.from('reminders').select('*, loans(account_no, member_name)', { count: 'exact' });
    if (completed !== undefined) query = query.eq('completed', completed === 'true');
    const pg = parseInt(page);
    const lim = parseInt(limit);
    const { data, count, error } = await query.range((pg - 1) * lim, pg * lim - 1).order('due_date');
    if (error) throw error;
    res.json({ reminders: data || [], total: count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/reminders', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('reminders').insert({ id: crypto.randomUUID(), ...req.body, created_by: req.user.id }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/v1/reminders/:id/complete', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('reminders').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Activity
app.get('/api/v1/activity', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { loanId, page = '1', limit = '20' } = req.query;
    let query = supabase.from('activity_log').select('*', { count: 'exact' });
    if (loanId) query = query.eq('loan_id', loanId);
    const pg = parseInt(page);
    const lim = parseInt(limit);
    const { data, count, error } = await query.range((pg - 1) * lim, pg * lim - 1).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ activities: data || [], total: count || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

function parseRowValue(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/^["']|["']$/g, '').trim();
  return s;
}

function parseNumeric(v: any): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/[$,]/g, '').replace(/^["']|["']$/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseDate(v: any): string | null {
  const s = parseRowValue(v);
  if (!s) return null;
  const cleaned = s.replace(/\./g, '/');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const y = parts[0].padStart(4, '0');
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    return iso;
  }
  return null;
}

interface LoanRow {
  account_no: string;
  member_name: string;
  member_code: string;
  loan_category: string;
  loan_type_code: number;
  disburse_amount: number;
  principal_due: number;
  due_count: number;
  interest_total: number;
  loan_limit: number;
  outstanding_amount: number;
  total_due: number;
  mobile_no: string;
  guarantor_info: string;
  loan_expiry_date: string | null;
}

function parseMemberName(raw: string): { name: string; code: string } {
  const m = raw.match(/^(.+?)\s*\((\d+)\)\s*$/);
  if (m) return { name: m[1].trim(), code: m[2] };
  return { name: raw.trim(), code: '' };
}

// Import
app.post('/api/v1/import', authMiddleware, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const supabase = getSupabase();

    const jobId = crypto.randomUUID();
    const { error: jobErr } = await supabase.from('import_jobs').insert({
      id: jobId, filename: req.file.originalname, file_path: req.file.path,
      status: 'processing', total_rows: 0, success_rows: 0, error_rows: 0,
      created_by: req.user.id,
    });
    if (jobErr) throw jobErr;

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let currentCategory = '';
    let currentTypeCode = 0;
    const errors: string[] = [];
    let totalRows = 0;
    let successRows = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const col1 = parseRowValue(row[0]);
      const col2 = parseRowValue(row[1]);

      // Detect section header (e.g., "Agriculture Loan (40)")
      if (!col2 && col1 && !/^[0-9]/.test(col1) && !col1.startsWith('No.')) {
        const catMatch = col1.match(/^(.+?)\s*\((\d+)\)\s*$/);
        if (catMatch) {
          currentCategory = catMatch[1].trim();
          currentTypeCode = parseInt(catMatch[2]) || 0;
        } else {
          currentCategory = col1;
          currentTypeCode = 0;
        }
        continue;
      }

      // Skip summary rows
      if (col1.startsWith('No.') || col1.startsWith('no.')) continue;

      // Must have account_no and member_name at minimum
      if (!col1 || !col2) continue;

      const parsedName = parseMemberName(col2);
      const loan: LoanRow = {
        account_no: col1,
        member_name: parsedName.name,
        member_code: parsedName.code,
        loan_category: currentCategory,
        loan_type_code: currentTypeCode,
        disburse_amount: parseNumeric(row[3]),
        principal_due: parseNumeric(row[4]),
        due_count: parseInt(parseRowValue(row[5]).replace(/[$,]/g, '')) || 0,
        interest_total: parseNumeric(row[6]),
        loan_limit: parseNumeric(row[7]),
        outstanding_amount: parseNumeric(row[8]),
        total_due: parseNumeric(row[9]),
        mobile_no: parseRowValue(row[10]),
        guarantor_info: parseRowValue(row[11]),
        loan_expiry_date: parseDate(row[2]),
      };
      totalRows++;

      try {
        const loanId = crypto.randomUUID();
        const { error: insErr } = await supabase.from('loans').insert({
          id: loanId,
          account_no: loan.account_no,
          member_name: loan.member_name,
          member_code: loan.member_code,
          loan_category: loan.loan_category,
          loan_type_code: loan.loan_type_code || null,
          disburse_amount: loan.disburse_amount,
          principal_due: loan.principal_due,
          due_count: loan.due_count,
          interest_total: loan.interest_total,
          loan_limit: loan.loan_limit,
          outstanding_amount: loan.outstanding_amount,
          total_due: loan.total_due || null,
          mobile_no: loan.mobile_no || null,
          guarantor_info: loan.guarantor_info || null,
          loan_expiry_date: loan.loan_expiry_date,
          status: 'active',
          created_by: req.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (insErr) {
          errors.push(`Row ${i + 1} (${loan.account_no}): ${insErr.message}`);
          continue;
        }

        await supabase.from('followup_stages').insert({
          id: crypto.randomUUID(),
          loan_id: loanId,
          current_stage: 'import',
          stage_entered_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        await supabase.from('activity_log').insert({
          id: crypto.randomUUID(),
          loan_id: loanId,
          action: 'loan_imported',
          description: `Loan imported from ${req.file.originalname}`,
          created_by: req.user.id,
          metadata: { source: 'excel_import', filename: req.file.originalname },
        });

        successRows++;
      } catch (rowErr: any) {
        errors.push(`Row ${i + 1} (${loan.account_no}): ${rowErr.message}`);
      }
    }

    await supabase.from('import_jobs').update({
      status: successRows > 0 ? 'completed' : 'failed',
      total_rows: totalRows,
      success_rows: successRows,
      error_rows: errors.length,
      errors_json: errors.length > 0 ? errors : null,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

    res.status(201).json({
      jobId,
      status: successRows > 0 ? 'completed' : 'failed',
      totalRows,
      successRows,
      errorRows: errors.length,
      message: `Imported ${successRows} of ${totalRows} loans`,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/import', authMiddleware, async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('import_jobs').select('*').order('created_at', { ascending: false }).range(0, 19);
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/import/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('import_jobs').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Import job not found' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Seed
app.post('/api/v1/seed', async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (count && count > 0) return res.json({ status: 'skipped', reason: 'Users already exist', count });
    const { error } = await supabase.from('users').insert({
      id: crypto.randomUUID(), username: 'admin',
      password_hash: '$2b$10$WyPGxyEUFociEtKwThwB2egpQgSpN1cOSQ9B74HkpVuW9cFhW0zO6',
      name: 'System Admin', role: 'admin', active: true,
    });
    if (error) throw error;
    res.json({ status: 'success', message: 'Admin user created (username: admin, password: admin123)' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Migrate (check)
app.post('/api/v1/migrate', async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'skipped', reason: 'Tables already exist', userCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
