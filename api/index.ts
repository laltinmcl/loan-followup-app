import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/v1/migrate', async (_req: any, res: any) => {
  let client: any = null;
  try {
    client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
    await client.connect();
    const dbResult = await client.query(`SELECT version()`);
    const tableCheck = await client.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'users'`
    );
    if (tableCheck.rows.length > 0) {
      await client.end();
      return res.json({ status: 'skipped', reason: 'Tables already exist', version: dbResult.rows[0].version });
    }
    const paths = [
      join(__dirname, '..', 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
      join(process.cwd(), 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
      join('/var/task', 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
    ];
    let sql = '';
    for (const p of paths) {
      if (existsSync(p)) { sql = readFileSync(p, 'utf-8'); break; }
    }
    if (!sql) {
      await client.end();
      return res.status(500).json({ status: 'error', reason: 'Migration SQL not found', searched: paths, cwd: process.cwd(), dirname: __dirname });
    }
    await client.query(sql);
    await client.end();
    res.json({ status: 'success', message: 'All tables created' });
  } catch (err: any) {
    try { await client.end(); } catch {}
    res.status(500).json({ status: 'error', message: err.message, code: err.code, stack: err.stack?.split('\n')?.slice(0, 3) });
  }
});

export default app;
