import { Pool } from "pg";

// 자체 PostgreSQL (localhost) 연결 풀.
// DATABASE_URL 은 .env 에 정의 (예: postgresql://temple:pw@localhost:5432/temple)
const globalForPg = globalThis;

export const pool =
  globalForPg._pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") globalForPg._pgPool = pool;

export function query(text, params) {
  return pool.query(text, params);
}

// 사용 예 (서버 컴포넌트/route handler):
//   import { query } from "@/lib/db";
//   const { rows } = await query(
//     "SELECT id, title, published_at FROM notices WHERE published = true ORDER BY published_at DESC LIMIT 3"
//   );
