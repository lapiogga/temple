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

// 여러 문장이 전부 되거나 전부 안 되어야 할 때.
//
// pool.query 는 문장마다 풀에서 아무 커넥션이나 빌려 쓰므로 BEGIN 과 COMMIT 이 서로
// 다른 커넥션으로 갈 수 있다. 그러면 트랜잭션이 성립하지 않는다. 한 커넥션을 잡아 두고
// 그 위에서만 돌려야 한다.
//
// 쓰는 쪽: await withTransaction(async (q) => { await q(...); await q(...); })
// 콜백이 던지면 ROLLBACK 하고 그 예외를 그대로 올린다.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn((text, params) => client.query(text, params));
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      // 롤백 실패는 원래 예외를 덮지 않는다 — 원인을 잃으면 진단이 불가능해진다.
      console.error("ROLLBACK 실패:", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

// 사용 예 (서버 컴포넌트/route handler):
//   import { query } from "@/lib/db";
//   const { rows } = await query(
//     "SELECT id, title, published_at FROM notices WHERE published = true ORDER BY published_at DESC LIMIT 3"
//   );
