/**
 * IntelliDecision AI – Production Database Migration Runner
 * Applies SQL migration scripts from /supabase/migrations to Supabase Cloud PostgreSQL.
 *
 * Usage:
 *   node scripts/migrate.js           # Apply pending migrations
 *   node scripts/migrate.js --status  # Inspect migration status without applying
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from root and server .env
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(rootDir, 'server', '.env') });

const { Pool } = pg;
const isStatusMode = process.argv.includes('--status');

function getDatabaseConfig() {
  const directUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (directUrl) {
    return {
      connectionString: directUrl,
      ssl: process.env.SUPABASE_DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    };
  }

  const host = process.env.SUPABASE_DB_HOST;
  const port = parseInt(process.env.SUPABASE_DB_PORT || '5432', 10);
  const database = process.env.SUPABASE_DB_NAME || 'postgres';
  const user = process.env.SUPABASE_DB_USER || 'postgres';
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ssl = process.env.SUPABASE_DB_SSL === 'false' ? false : { rejectUnauthorized: false };

  if (!host || !password) {
    return null;
  }

  return {
    host,
    port,
    database,
    user,
    password,
    ssl
  };
}

function calculateChecksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function ensureMigrationTables(client) {
  // Tracking table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  // Distributed lock table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migration_locks (
      id INT PRIMARY KEY,
      is_locked BOOLEAN NOT NULL DEFAULT FALSE,
      locked_at TIMESTAMPTZ,
      locked_by TEXT
    );
  `);

  // Ensure singleton lock row
  await client.query(`
    INSERT INTO public.schema_migration_locks (id, is_locked)
    VALUES (1, FALSE)
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function acquireLock(client, runnerId) {
  const res = await client.query(`
    UPDATE public.schema_migration_locks
    SET is_locked = TRUE, locked_at = NOW(), locked_by = $1
    WHERE id = 1 AND is_locked = FALSE
    RETURNING id;
  `, [runnerId]);

  if (res.rowCount === 0) {
    const lockInfo = await client.query(`SELECT * FROM public.schema_migration_locks WHERE id = 1;`);
    throw new Error(`Migration lock active! Locked by ${lockInfo.rows[0]?.locked_by} at ${lockInfo.rows[0]?.locked_at}`);
  }
}

async function releaseLock(client) {
  await client.query(`
    UPDATE public.schema_migration_locks
    SET is_locked = FALSE, locked_at = NULL, locked_by = NULL
    WHERE id = 1;
  `);
}

async function getAppliedMigrations(client) {
  const res = await client.query(`SELECT version, name, checksum, applied_at FROM public.schema_migrations ORDER BY version ASC;`);
  return res.rows;
}

function getMigrationFiles() {
  const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at: ${migrationsDir}`);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const versionMatch = file.match(/^(\d+)_/);
    const version = versionMatch ? versionMatch[1] : file;

    return {
      version,
      filename: file,
      filePath,
      content,
      checksum: calculateChecksum(content)
    };
  });
}

async function run() {
  console.log('====================================================');
  console.log('  INTELLIDECISION AI – SUPABASE MIGRATION RUNNER');
  console.log('====================================================');

  const dbConfig = getDatabaseConfig();

  if (!dbConfig) {
    console.warn('\n[!] Supabase PostgreSQL connection credentials are not configured.');
    console.warn('    To connect directly to Supabase Cloud PostgreSQL, set:');
    console.warn('    - SUPABASE_DB_HOST (e.g. db.your-project.supabase.co)');
    console.warn('    - SUPABASE_DB_PASSWORD (your database password)');
    console.warn('    - SUPABASE_DB_USER (default: postgres)');
    console.warn('    - SUPABASE_DB_PORT (default: 5432)');
    console.warn('    - SUPABASE_DB_NAME (default: postgres)');
    console.warn('    OR:');
    console.warn('    - DATABASE_URL / SUPABASE_DB_URL\n');
    console.warn('    Migration files found in /supabase/migrations:');
    const available = getMigrationFiles();
    available.forEach(m => console.warn(`      -> ${m.filename} (Checksum: ${m.checksum.substring(0, 10)}...)`));
    console.warn('\n    Status: Execution paused until credentials are provided in .env');
    console.log('====================================================\n');
    return;
  }

  const pool = new Pool(dbConfig);
  let client;

  try {
    console.log('[*] Connecting to Supabase Cloud PostgreSQL...');
    client = await pool.connect();
    console.log('[+] Connected successfully to PostgreSQL database.\n');

    await ensureMigrationTables(client);

    const applied = await getAppliedMigrations(client);
    const appliedMap = new Map(applied.map(a => [a.version, a]));
    const availableMigrations = getMigrationFiles();

    console.log(`[*] Discovered ${availableMigrations.length} migration file(s) in repository.`);
    console.log(`[*] Database records ${applied.length} previously applied migration(s).\n`);

    if (isStatusMode) {
      console.log('--- MIGRATION STATUS REPORT ---');
      for (const m of availableMigrations) {
        const isApplied = appliedMap.has(m.version);
        const statusStr = isApplied ? '[APPLIED]' : '[PENDING]';
        const dateStr = isApplied ? `applied at ${appliedMap.get(m.version).applied_at}` : 'awaiting execution';
        console.log(`  ${statusStr} ${m.filename} - ${dateStr}`);
      }
      console.log('-------------------------------\n');
      return;
    }

    // Identify pending
    const pending = availableMigrations.filter(m => !appliedMap.has(m.version));

    if (pending.length === 0) {
      console.log('[+] All migrations are up-to-date. No pending migrations.');
      return;
    }

    console.log(`[*] Found ${pending.length} pending migration(s) to execute.`);

    const runnerId = `runner-${process.pid}-${Date.now()}`;
    await acquireLock(client, runnerId);

    try {
      for (const migration of pending) {
        console.log(`\n[*] Applying migration: ${migration.filename}...`);
        const startTime = Date.now();

        await client.query('BEGIN');
        try {
          await client.query(migration.content);

          await client.query(`
            INSERT INTO public.schema_migrations (version, name, checksum, applied_at)
            VALUES ($1, $2, $3, NOW());
          `, [migration.version, migration.filename, migration.checksum]);

          await client.query('COMMIT');
          const elapsed = Date.now() - startTime;
          console.log(`[+] SUCCESS: Applied ${migration.filename} in ${elapsed}ms.`);
        } catch (migErr) {
          await client.query('ROLLBACK');
          console.error(`\n[-] FAILED: Migration ${migration.filename} encountered an error:`);
          console.error(`    ${migErr.message}`);
          throw migErr;
        }
      }
    } finally {
      await releaseLock(client);
    }

    console.log('\n[+] All pending migrations executed successfully!\n');
  } catch (err) {
    console.error('\n[-] Migration Runner Error:', err.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
    console.log('====================================================\n');
  }
}

run();
