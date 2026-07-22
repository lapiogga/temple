import { query } from "@/lib/db";

// 묻고답하기(questions) 데이터 접근. 파라미터화 쿼리만.

// 공개 목록(본문 제외, 비밀글은 잠금 표시)
export async function listQuestions() {
  const { rows } = await query(
    `SELECT id, title, author_name, is_secret, (answer IS NOT NULL) AS answered, created_at
       FROM questions ORDER BY created_at DESC`
  );
  return rows;
}

export async function getQuestion(id) {
  const { rows } = await query(
    `SELECT id, title, body, author_name, phone, is_secret, secret_hash,
            answer, answered_at, created_at
       FROM questions WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createQuestion(d) {
  const { title, body, authorName, phone, isSecret, secretHash } = d;
  const { rows } = await query(
    `INSERT INTO questions (title, body, author_name, phone, is_secret, secret_hash)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [title, body, authorName, phone, isSecret, secretHash]
  );
  return rows[0];
}

// 관리자용 전체(본문 포함)
export async function listAllQuestions() {
  const { rows } = await query(
    `SELECT id, title, body, author_name, phone, is_secret, answer, answered_at, created_at
       FROM questions ORDER BY created_at DESC`
  );
  return rows;
}

export async function answerQuestion(id, answer) {
  await query("UPDATE questions SET answer = $2, answered_at = now() WHERE id = $1", [id, answer]);
}

export async function removeQuestion(id) {
  await query("DELETE FROM questions WHERE id = $1", [id]);
}
