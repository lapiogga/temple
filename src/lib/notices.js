import { query } from "@/lib/db";

// 소식(notices) 데이터 접근 레이어. 모든 쿼리는 파라미터화($1..)로만.
// 정렬은 고정(고정 SQL) — 동적 컬럼/방향 없음.
const SELECT_COLS =
  "id, category, title, body, cover_url, is_pinned, published, published_at";

// 목록. 관리 화면은 미공개 포함(includeUnpublished), 공개 화면은 published=true 만.
export async function listNotices({ includeUnpublished = false } = {}) {
  const where = includeUnpublished ? "" : "WHERE published = true";
  const { rows } = await query(
    `SELECT ${SELECT_COLS} FROM notices ${where}
     ORDER BY is_pinned DESC, published_at DESC`
  );
  return rows;
}

export async function getNotice(id) {
  const { rows } = await query(
    `SELECT ${SELECT_COLS} FROM notices WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function createNotice(data) {
  const { category, title, body, coverUrl, isPinned, published } = data;
  const { rows } = await query(
    `INSERT INTO notices (category, title, body, cover_url, is_pinned, published)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [category, title, body, coverUrl, isPinned, published]
  );
  return rows[0];
}

export async function updateNotice(id, data) {
  const { category, title, body, coverUrl, isPinned, published } = data;
  await query(
    `UPDATE notices
       SET category = $2, title = $3, body = $4, cover_url = $5,
           is_pinned = $6, published = $7, updated_at = now()
     WHERE id = $1`,
    [id, category, title, body, coverUrl, isPinned, published]
  );
}

export async function removeNotice(id) {
  await query("DELETE FROM notices WHERE id = $1", [id]);
}

export async function setPublished(id, published) {
  await query(
    "UPDATE notices SET published = $2, updated_at = now() WHERE id = $1",
    [id, published]
  );
}
