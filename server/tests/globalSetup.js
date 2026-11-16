import { execSync } from 'node:child_process';
import pg from 'pg';
import { testDatabaseUrl } from './testDatabaseUrl.js';

// Exécuté une fois avant tous les tests : crée la base de test si besoin et y applique les migrations
export default async function setup() {
  const url = new URL(testDatabaseUrl());
  const databaseName = url.pathname.slice(1);

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  if (rowCount === 0) await client.query(`CREATE DATABASE "${databaseName.replaceAll('"', '')}"`);
  await client.end();

  if (!process.env.SKIP_MIGRATIONS) {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: url.toString() },
      stdio: 'inherit',
    });
  }
}
