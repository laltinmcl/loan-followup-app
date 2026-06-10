const express = require('express');

const app = express();
app.use(express.json());

app.get('/api/v1/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/v1/migrate', async (_req: any, res: any) => {
  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
    await client.connect();
    const result = await client.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'users'`
    );
    if (result.rows.length > 0) {
      await client.end();
      return res.json({ status: 'skipped', reason: 'Tables already exist' });
    }
    const { readFileSync, existsSync } = require('fs');
    const { join } = require('path');
    const paths = [
      join(__dirname, 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
      join(__dirname, '..', 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
      join('/var/task', 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
    ];
    let sql = '';
    for (const p of paths) {
      if (existsSync(p)) { sql = require('fs').readFileSync(p, 'utf-8'); break; }
    }
    if (!sql) {
      await client.end();
      return res.status(500).json({ status: 'error', reason: 'Migration SQL not found', searched: paths });
    }
    await client.query(sql);
    await client.end();
    res.json({ status: 'success', message: 'All 10 tables created' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default app;
