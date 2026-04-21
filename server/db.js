require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

/**
 * Remote Postgres (Neon, Supabase, RDS, Render, etc.) requires TLS even when
 * NODE_ENV is development. Local URLs should stay non-TLS unless sslmode says otherwise.
 */
function databaseUrlWantsSsl(connectionString) {
  if (!connectionString) return process.env.NODE_ENV === 'production';
  const lower = connectionString.toLowerCase();
  if (lower.includes('sslmode=disable')) return false;
  if (
    lower.includes('sslmode=require') ||
    lower.includes('sslmode=verify-full') ||
    lower.includes('sslmode=no-verify') ||
    lower.includes('sslmode=prefer')
  ) {
    return true;
  }
  if (process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1') return true;
  if (process.env.NODE_ENV === 'production') return true;
  // Typical managed hosts that reject non-SSL connections
  if (
    /\.(neon\.tech|supabase\.co|railway\.app|pooler\.supabase\.com|amazonaws\.com|render\.com)\b/i.test(
      connectionString,
    )
  ) {
    return true;
  }
  return false;
}

let poolConfig;

if (process.env.DATABASE_URL) {
  const useSsl = databaseUrlWantsSsl(process.env.DATABASE_URL);
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl
      ? {
          // Default false matches prior production config; set DATABASE_SSL_REJECT_UNAUTHORIZED=true for strict verify
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
        }
      : false,
    max: 20,
    min: 4,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 60000,
  };
} else {
  // Local or legacy configuration
  const dbPassword = process.env.DB_PASSWORD;
  if (!dbPassword) {
    console.error('[SECURITY] DB_PASSWORD environment variable is not set — refusing to connect');
    process.exit(1);
  }

  poolConfig = {
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'cortexbuild',
    user:     process.env.DB_USER     || 'cortexbuild',
    password: dbPassword,
    max:      20,
    min:      4,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 60000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err);
});

module.exports = pool;
