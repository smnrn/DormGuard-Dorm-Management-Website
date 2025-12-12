const { Pool } = require('pg');

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_DB_HOST',
  'SUPABASE_DB_USER',
  'SUPABASE_DB_PASSWORD',
  'SUPABASE_DB_NAME'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('[ERROR] Missing required environment variables:', missingVars.join(', '));
  console.error('[ERROR] Please check your .env file in the backend directory');
  process.exit(1);
}

// Determine SSL configuration based on environment
const sslConfig = process.env.SUPABASE_DB_SSL === 'false' 
  ? false 
  : process.env.SUPABASE_DB_SSL === 'require'
  ? { rejectUnauthorized: true }
  : { rejectUnauthorized: false }; // Default for Supabase compatibility

// Create PostgreSQL connection pool for Supabase
const pool = new Pool({
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT) || 5432,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
  ssl: sslConfig,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout for direct connections
});

// Log connection configuration (without password)
console.log('\n[DATABASE] Connection Configuration:');
console.log(`[DATABASE] Host: ${process.env.SUPABASE_DB_HOST}`);
console.log(`[DATABASE] Port: ${process.env.SUPABASE_DB_PORT || 5432}`);
console.log(`[DATABASE] Database: ${process.env.SUPABASE_DB_NAME}`);
console.log(`[DATABASE] User: ${process.env.SUPABASE_DB_USER}`);
console.log(`[DATABASE] SSL: ${process.env.SUPABASE_DB_SSL}\n`);

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('[ERROR] Supabase database connection error:', err.message);
    console.error('[ERROR] Connection details:', {
      host: process.env.SUPABASE_DB_HOST,
      port: process.env.SUPABASE_DB_PORT,
      database: process.env.SUPABASE_DB_NAME
    });
    return;
  }
  console.log('[SUCCESS] ✓ Supabase database connected successfully');
  console.log(`[SUCCESS] ✓ Connected to: ${process.env.SUPABASE_DB_HOST}:${process.env.SUPABASE_DB_PORT}\n`);
  release();
});

// Helper function to convert MySQL-style queries to PostgreSQL
const query = async (text, params) => {
  // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
  let pgText = text;
  let paramIndex = 1;
  pgText = pgText.replace(/\?/g, () => `$${paramIndex++}`);
  
  const result = await pool.query(pgText, params);
  return result;
};

module.exports = {
  query,
  pool
};