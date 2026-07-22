import { query } from "@/lib/db";

// 신도 회원 데이터 접근. 파라미터화 쿼리만 사용.

export async function getMemberByLoginId(loginId) {
  const { rows } = await query(
    "SELECT id, login_id, password_hash, name, status FROM members WHERE login_id = $1",
    [loginId]
  );
  return rows[0] ?? null;
}

export async function getMemberById(id) {
  const { rows } = await query(
    `SELECT id, login_id, name, birth_date, gender, phone, status,
            created_at, approved_at, last_login_at
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
  const { loginId, passwordHash, name, birthDate, gender, phone } = d;
  const { rows } = await query(
    `INSERT INTO members
       (login_id, password_hash, name, birth_date, gender, phone,
        phone_verified, status, agreed_terms, agreed_privacy, agreed_at)
     VALUES ($1,$2,$3,$4,$5,$6, true, 'pending', true, true, now())
     RETURNING id`,
    [loginId, passwordHash, name, birthDate, gender, phone]
  );
  return rows[0];
}

export async function listMembers({ status } = {}) {
  if (status) {
    const { rows } = await query(
      `SELECT id, login_id, name, phone, gender, birth_date, status, created_at, approved_at
         FROM members WHERE status = $1 ORDER BY created_at DESC`,
      [status]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT id, login_id, name, phone, gender, birth_date, status, created_at, approved_at
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
