import { query, withTransaction } from "@/lib/db";

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

// ── 회원 본인이 하는 것 ────────────────────────────────────────
//
// 개인정보 보호법 §35~37 은 정보주체에게 열람·정정·삭제·처리정지 요구권을 준다.
// 지금까지 이 저장소에는 열람만 있었다(/mypage 읽기 전용). 정정·탈퇴 함수가 아예 없어
// 종무소가 SSH 로 들어가 손으로 고치는 수밖에 없었는데, 비전문가가 종무소에서
// 운영한다는 전제와 정면으로 충돌한다.

// 현재 비밀번호 확인용. getMemberById 는 해시를 주지 않는다(줄 이유가 없다).
export async function getMemberPasswordHash(id) {
  const { rows } = await query("SELECT password_hash FROM members WHERE id = $1", [id]);
  return rows[0]?.password_hash ?? null;
}

// 닉네임은 게시판에 보이는 이름이다. 지난 글의 표시명까지 함께 바꾼다 —
// 바꾼 뒤에도 옛 글에 옛 이름이 남으면 같은 사람이 둘로 보인다.
export async function updateMemberNickname(id, nickname) {
  await withTransaction(async (q) => {
    await q("UPDATE members SET nickname = $2 WHERE id = $1", [id, nickname]);
    await q(
      "UPDATE posts SET author_name = $2 WHERE author_member_id = $1",
      [id, nickname]
    );
  });
}

// 휴대폰은 비밀번호 재설정의 본인확인 근거다(member-login/reset).
// 그래서 호출부가 현재 비밀번호를 먼저 확인한 뒤에만 부른다.
export async function updateMemberPhone(id, phone) {
  await query(
    "UPDATE members SET phone = $2, phone_verified = false WHERE id = $1",
    [id, phone]
  );
}

// 탈퇴 — 행을 지우지 않고 개인정보만 지운다(익명화).
//
// DELETE 를 쓰지 않는 이유가 두 가지다.
//  1) posts.author_member_id 가 ON DELETE SET NULL 이라 회원 행을 지워도 글은 남는데,
//     author_name 에 표시명이 그대로 박혀 있다. 즉 지우면 오히려 개인정보가 남고
//     그것을 지울 연결고리(회원 id)만 사라진다.
//  2) 남은 행이 '탈퇴한 회원' 이라는 사실 자체를 들고 있어야 옛 글의 작성자를
//     그렇게 표시할 수 있다.
//
// 지우는 값: 아이디·비밀번호·성명·닉네임·생년월일·성별·휴대폰.
// 남기는 값: 가입 시각과 동의 시각(개인을 지목하지 못하는 이력).
// 아이디를 withdrawn_<id> 로 바꾸면 원래 아이디가 다시 쓸 수 있게 풀린다. 아이디
// 자체가 실명인 경우가 있어 남겨 두는 편이 더 위험하다고 보고 푸는 쪽을 골랐다.
export async function withdrawMember(id, unusableHash) {
  await withTransaction(async (q) => {
    await q(
      `UPDATE members
          SET login_id       = 'withdrawn_' || id,
              password_hash  = $2,
              name           = '탈퇴한 회원',
              nickname       = NULL,
              birth_date     = NULL,
              gender         = NULL,
              phone          = NULL,
              phone_verified = false,
              must_reset_password = false,
              status         = 'withdrawn'
        WHERE id = $1`,
      [id, unusableHash]
    );
    await q(
      "UPDATE posts SET author_name = '탈퇴한 회원' WHERE author_member_id = $1",
      [id]
    );
  });
}
