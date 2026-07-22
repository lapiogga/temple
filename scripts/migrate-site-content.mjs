import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query(
  `CREATE TABLE IF NOT EXISTS site_content (
     key TEXT PRIMARY KEY,
     value JSONB NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`
);
const { rows } = await pool.query("SELECT count(*)::int AS n FROM site_content");
console.log("site_content ready · rows =", rows[0].n);
await pool.end();
