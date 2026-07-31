// 신도 회원 비밀번호 재설정.
// 실행: npm run member:passwd -- <login_id> <새 비밀번호>
//   (내부: node --env-file=.env scripts/reset-member-password.mjs ...)
//
// 관리자용 seed-admin.mjs 와 달리 계정을 새로 만들지 않는다. 회원은 성명·닉네임·
// 생년월일·휴대폰·약관동의가 필수라, 없는 아이디에 upsert 하면 그 값들이 빠진
// 반쪽 계정이 생긴다. 없으면 오류로 끝낸다.
//
// 이 스크립트는 임시 대응이다. 앱에 회원 자기 비밀번호 변경도, 관리자 재설정
// 화면도 없어서 지금은 SSH 로만 복구할 수 있다 (docs/10_잔여작업_로드맵.md §3-C 8).
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const [loginId, password] = process.argv.slice(2);

if (!loginId || !password) {
  console.error("사용법: npm run member:passwd -- <login_id> <새 비밀번호>");
  process.exit(1);
}
// 로그인 검증(join/member-login 모두 72 상한)과 맞춘다.
// bcrypt 는 72바이트에서 조용히 절단하므로, 넘으면 설정한 비밀번호와 로그인되는
// 비밀번호가 달라져 혼란스러워진다.
if (Buffer.byteLength(password, "utf8") > 72) {
  console.error("비밀번호는 72바이트를 넘을 수 없습니다. (한글은 글자당 3바이트)");
  process.exit(1);
}
if (password.length < 8) {
  console.error("비밀번호는 8자 이상이어야 합니다. (가입 폼과 동일 기준)");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL 환경변수가 없습니다. (.env 확인)");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  // 어느 DB 를 건드리는지 먼저 밝힌다 — dev 에서 돌린다는 것이 prod 와 갈리는 지점이다.
  const { rows: dbRows } = await pool.query("SELECT current_database() AS db");
  console.log("대상 DB:", dbRows[0].db);

  const { rows } = await pool.query(
    `UPDATE members SET password_hash = $2
      WHERE login_id = $1
      RETURNING id, login_id, name, nickname, status`,
    [loginId.trim(), await bcrypt.hash(password, 12)]
  );

  if (rows.length === 0) {
    console.error(`'${loginId}' 아이디의 회원이 없습니다. 아이디를 확인하세요.`);
    console.error("(운영자 계정은 members 가 아니라 admin_users 에 있습니다 → npm run db:seed)");
    process.exitCode = 1;
  } else {
    const m = rows[0];
    console.log("비밀번호 재설정 완료:", {
      id: m.id, login_id: m.login_id, name: m.name, nickname: m.nickname, status: m.status,
    });
    if (m.status !== "approved") {
      console.warn(
        `주의: 이 계정의 상태가 '${m.status}' 라 비밀번호가 맞아도 로그인되지 않습니다.` +
          " 관리자 화면(/admin/members)에서 승인이 필요합니다."
      );
    }
  }
} catch (err) {
  console.error("재설정 실패:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
