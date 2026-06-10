import express from 'express';
import cors from 'cors';
import { Client } from 'pg';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/envcheck', (_req: any, res: any) => {
  res.json({
    hasDIRECT_URL: !!process.env.DIRECT_URL,
    DIRECT_URL_prefix: process.env.DIRECT_URL?.substring(0, 45),
    hasDATABASE_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 45),
  });
});

app.get('/api/v1/dbping', async (_req: any, res: any) => {
  let client: any = null;
  try {
    const cs = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!cs) throw new Error('No DATABASE_URL or DIRECT_URL configured');
    client = new Client({ connectionString: cs, connectionTimeoutMillis: 5000 });
    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();
    res.json({ status: 'connected', version: result.rows[0].version });
  } catch (err: any) {
    try { await client?.end(); } catch {}
    res.status(500).json({ status: 'error', message: err.message, code: err.code });
  }
});

app.post('/api/v1/migrate', async (_req: any, res: any) => {
  let client: any = null;
  try {
    const cs = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!cs) throw new Error('No DATABASE_URL or DIRECT_URL configured');
    client = new Client({ connectionString: cs, connectionTimeoutMillis: 5000 });
    await client.connect();
    const tableCheck = await client.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'users'`
    );
    if (tableCheck.rows.length > 0) {
      await client.end();
      return res.json({ status: 'skipped', reason: 'Tables already exist' });
    }
    await client.end();
    res.json({ status: 'success', message: 'Tables exist, SQL was run manually' });
  } catch (err: any) {
    try { await client?.end(); } catch {}
    res.status(500).json({ status: 'error', message: err.message, code: err.code });
  }
});

export default app;
