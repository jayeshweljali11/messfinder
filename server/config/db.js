let pg;
try {
  pg = require('pg');
} catch (e) {
  pg = null;
}

let pool = null;
let isConnected = false;

const initTables = async (client) => {
  const schemaSql = `
    -- Messes Table
    CREATE TABLE IF NOT EXISTS messes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      owner_name VARCHAR(100) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      whatsapp VARCHAR(30),
      email VARCHAR(100),
      username VARCHAR(100),
      password VARCHAR(255),
      address TEXT NOT NULL,
      area VARCHAR(100) NOT NULL,
      city VARCHAR(50) DEFAULT 'Pune',
      pincode VARCHAR(20),
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      food_type VARCHAR(20) NOT NULL,
      monthly_price NUMERIC NOT NULL,
      trial_price NUMERIC DEFAULT 100,
      meals JSONB DEFAULT '{}'::jsonb,
      menu JSONB DEFAULT '{}'::jsonb,
      facilities JSONB DEFAULT '[]'::jsonb,
      description TEXT,
      images JSONB DEFAULT '[]'::jsonb,
      rating NUMERIC DEFAULT 4.5,
      review_count INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Reviews Table
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      mess_id INTEGER REFERENCES messes(id) ON DELETE CASCADE,
      user_id INTEGER,
      user_name VARCHAR(100) NOT NULL,
      user_college VARCHAR(150),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      images JSONB DEFAULT '[]'::jsonb,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      phone VARCHAR(30),
      password VARCHAR(255) NOT NULL,
      college VARCHAR(150),
      role VARCHAR(30) DEFAULT 'student',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_messes_coords ON messes (latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_messes_food_type ON messes (food_type);
    CREATE INDEX IF NOT EXISTS idx_messes_price ON messes (monthly_price);
    CREATE INDEX IF NOT EXISTS idx_reviews_mess_id ON reviews (mess_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
  `;

  await client.query(schemaSql);
  console.log('✅ PostgreSQL Schema & Tables verified/initialized.');
};

const connectDB = async () => {
  if (!pg) {
    console.warn('⚠️ PostgreSQL driver "pg" is not yet installed. Run "npm install" to enable PostgreSQL.');
    console.log('ℹ️ Running in resilient fallback file-store mode.');
    isConnected = false;
    return null;
  }

  const { Pool } = pg;
  const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'messfinder'
      };

  try {
    pool = new Pool({
      ...connectionConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 4000
    });

    // Test connection
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`✅ PostgreSQL Connected successfully to database: "${res.rows[0].db_name}"`);
    
    // Auto-initialize tables
    await initTables(client);
    client.release();

    isConnected = true;
    return pool;
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ PostgreSQL connection note: ${error.message}`);
    console.log(`ℹ️ Mess Finder is running with active storage fallback. Ensure PostgreSQL service is running and credentials in .env are correct.`);
    return null;
  }
};

const getDbStatus = () => isConnected;

const query = async (text, params) => {
  if (!isConnected || !pool) {
    throw new Error('PostgreSQL is not connected');
  }
  return pool.query(text, params);
};

module.exports = {
  connectDB,
  getDbStatus,
  query,
  getPool: () => pool
};
