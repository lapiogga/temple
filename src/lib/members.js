import { query } from "@/lib/db";

// 신도 회원 데이터 접근. 파라미터화 쿼리만 사용.

export async function getMemberByLoginId(loginId) {
  const { rows } = await query(
    `SELECT id, login_id, password_hash, name, status, must_reset_password
       FROM members WHERE login_id = $1`,
    [loginId]
  );
  return rows[0] ?? null;
}

// 관리자 '비밀번호 초기화'. 표시만 세우는 게 아니라 기존 해시도 못 쓰게 만든다.
// 표시만 세우면 예전 비밀번호를 아는 사람이 초기화 이후에도 그대로 들어올 수 있다.
// randomHash 는 어떤 입력과도 맞지 않는 값이어야 하므로 호출부에서 난수를 해시해 넘긴다.
export async function flagPasswordReset(id, unusableHash) {
  await query(
    "UPDATE members SET password_hash = $2, must_reset_password = true WHERE id = $1",
    [id, unusableHash]
  );
}

// 재설정 화면의 본인 확인용. 초기화된 계정만 이 경로를 쓸 수 있다.
export async function getMemberForReset(loginId) {
  const { rows } = await query(
    `SELECT id, login_id, status, must_reset_password, phone,
            to_char(birth_date, 'YYYY-MM-DD') AS birth_date
       FROM members WHERE login_id = $1`,
    [loginId]
  );
  return rows[0] ?? null;
}

// 새 비밀번호 저장 + 초기화 표시 해제.
export async function setMemberPassword(id, passwordHash) {
  await query(
    "UPDATE members SET password_hash = $2, must_reset_password = false WHERE id = $1",
    [id, passwordHash]
  );
}

export async function getMemberById(id) {
  const { rows } = await query(
    // must_reset_password 가 빠져 있어서, 호출부가 검사하고 싶어도 할 수 없었다.
    `SELECT id, login_id, name, nickname, birth_date, gender, phone, status,
            must_reset_password, created_at, approved_at, last_login_at
       FROM members WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function loginIdExists(loginId) {
  const { rows } = await query("SELECT 1 FROM members WHERE login_id = $1", [loginId]);
  return rows.length > 0;
}

export async function createMember(d) {
  const { loginId, passwordHash, name, nickname, birthDate, gender, phone } = d;
  const { rows } = await query(
    `INSERT INTO members
       (login_id, password_hash, name, nickname, birth_date, gender, phone,
        phone_verified, status, agreed_terms, agreed_privacy, agreed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, true, 'pending', true, true, now())
     RETURNING id`,
    [loginId, passwordHash, name, nickname, birthDate, gender, phone]
  );
  return rows[0];
}

export async function listMembers({ status } = {}) {
  if (status) {
    const { rows } = await query(
      `SELECT id, login_id, name, nickname, phone, gender, birth_date, status, must_reset_password, created_at, approved_at
         FROM members WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT id, login_id, name, nickname, phone, gender, birth_date, status, must_reset_password, created_at, approved_at
       FROM members ORDER BY created_at DESC`
  );
  return rows;
}

export async function setMemberStatus(id, status) {
  await query(
    `UPDATE members
        SET status = $2,
            approved_at = CASE WHEN $2 = 'approved' THEN now() ELSE approved_at END
      WHERE id = $1`,
    [id, status]
  );
}

export async function touchMemberLogin(id) {
  await query("UPDATE members SET last_login_at = now() WHERE id = $1", [id]);
}
