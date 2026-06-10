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
    const { error, count } = await supabase.from('users').select('*', { count: 'exact', head: true });
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
    const { error } = await supabase.from('users').insert({
      id: crypto.randomUUID(),
      username: 'admin',
      password_hash: '$2b$10$WyPGxyEUFociEtKwThwB2egpQgSpN1cOSQ9B74HkpVuW9cFhW0zO6',
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

app.post('/auth/login', async (req: any, res: any) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    const bcrypt = require('bcryptjs');
    const valid = bcrypt.compareSync(password, data.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    if (!data.active) return res.status(403).json({ error: 'Account disabled' });
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: data.id, username: data.username, role: data.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: data.id, username: data.username, name: data.name, role: data.role } });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

app.get('/auth/me', async (req: any, res: any) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('id,username,name,role,phone').eq('id', decoded.id).single();
    if (error || !data) return res.status(401).json({ error: 'User not found' });
    res.json(data);
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default app;
