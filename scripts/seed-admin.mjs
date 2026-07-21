// 운영자 계정 시드/갱신.
// 실행: npm run db:seed -- <login_id> <password> <name>
//   (내부: node --env-file=.env scripts/seed-admin.mjs ...)
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const [loginId, password, name] = process.argv.slice(2);

if (!loginId || !password || !name) {
  console.error("사용법: npm run db:seed -- <login_id> <password> <name>");
  process.exit(1);
}
// bcrypt 는 72바이트에서 절단 → 로그인 검증(max 72)과 일치시켜 초과 비밀번호 차단.
if (Buffer.byteLength(password, "utf8") > 72) {
  console.error("비밀번호는 72바이트를 넘을 수 없습니다.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL 환경변수가 없습니다. (.env 확인)");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO admin_users (login_id, password_hash, name, role)
     VALUES ($1, $2, $3, 'operator')
     ON CONFLICT (login_id)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
     RETURNING id, login_id, name, role`,
    [loginId, passwordHash, name]
  );
  console.log("운영자 계정 저장 완료:", rows[0]);
} catch (err) {
  console.error("시드 실패:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
