import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
});
app.use('/api/', limiter);

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: 'connected',
  });
});

app.post('/api/v1/migrate', async (_req, res) => {
  // Use raw pg to avoid Prisma engine EROFS on serverless
  try {
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
    await client.connect();
    const result = await client.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'users'`);
    if (result.rows.length > 0) {
      await client.end();
      return res.json({ status: 'skipped', reason: 'Tables already exist' });
    }
    const paths = [
      join(__dirname, '..', '..', 'prisma', 'migrations', '0001_init', 'migration.sql'),
      join(__dirname, '..', '..', '..', 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
      join('/var/task', 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql'),
    ];
    let sql = '';
    for (const p of paths) {
      if (existsSync(p)) { sql = readFileSync(p, 'utf-8'); break; }
    }
    if (!sql) {
      await client.end();
      return res.status(500).json({ status: 'error', reason: 'Migration SQL not found', searched: paths });
    }
    await client.query(sql);
    await client.end();
    res.json({ status: 'success', message: 'All tables created' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
});

import authRoutes from './routes/auth';
import loanRoutes from './routes/loans';
import stageRoutes from './routes/stages';
import visitRoutes from './routes/visits';
import reminderRoutes from './routes/reminders';
import dashboardRoutes from './routes/dashboard';
import importRoutes from './routes/import';
import activityRoutes from './routes/activity';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/stages', stageRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/activity', activityRoutes);

export { app };
