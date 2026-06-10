import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

function getSupabase() {
  const url = process.env.SUPABASE_URL || 'https://ixzbppbwwtdfxsztjrhu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(url, key);
}

app.get('/api/v1/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/dbping', async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { data, error, count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'connected', userCount: count ?? 0 });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message, code: err.code });
  }
});

app.post('/api/v1/migrate', async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'skipped', reason: 'Tables already exist', userCount: count });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message, code: err.code });
  }
});

app.post('/api/v1/seed', async (_req: any, res: any) => {
  try {
    const supabase = getSupabase();
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      return res.json({ status: 'skipped', reason: 'Users already exist', count });
    }
    const password_hash = crypto.createHash('sha256').update('admin123').digest('hex');
    const { error } = await supabase.from('users').insert({
      id: crypto.randomUUID(),
      username: 'admin',
      password_hash,
      name: 'System Admin',
      role: 'admin',
      active: true,
    });
    if (error) throw error;
    res.json({ status: 'success', message: 'Admin user created (username: admin, password: admin123)' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message, code: err.code });
  }
});

export default app;
