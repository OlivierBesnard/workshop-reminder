import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || 'postgres',
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  database: process.env.VITE_DB_NAME || 'fulfiller',
});

export const db = {
  query: async (text: string, params?: any[]) => {
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  },
  getClient: async () => {
    return await pool.connect();
  },
};

export default db;
