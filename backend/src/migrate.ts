import { readFileSync } from 'fs';
import { join } from 'path';

// Standalone migration script that runs on serverless cold start
export default async function migrate() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'users'`
    );

    if (tables.length > 0) {
      console.log('Tables already exist');
      return { migrated: false, reason: 'already_exists' };
    }

    const sqlPath = join(__dirname, '..', 'backend', 'prisma', 'migrations', '0001_init', 'migration.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    const statements = sql.split(';').filter((s: string) => s.trim().length > 0);

    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt + ';');
    }

    console.log('Migration completed successfully');
    return { migrated: true, tables: statements.length };

  } catch (err) {
    console.error('Migration failed:', (err as Error).message);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}
