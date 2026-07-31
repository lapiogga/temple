import { query, pool } from "@/lib/db";

// 게시판 카테고리. posts.board 가 slug 를 문자열로 참조한다(FK 없음).
// 파라미터화 쿼리만 사용.

const COLS =
  "id, slug, label, sort_order, is_hidden, write_role, layout, show_in_board, created_at";

// 관리자용 — 숨김 포함 전부.
export async function listCategories() {
  const { rows } = await query(
    `SELECT ${COLS} FROM board_categories ORDER BY sort_order, id`
  );
  return rows;
}

// 공개 화면용 — 숨김을 뺀 전부. 글쓰기 선택지가 여기서 나온다.
export async function listVisibleCategories() {
  const { rows } = await query(
    `SELECT ${COLS} FROM board_categories WHERE is_hidden = false ORDER BY sort_order, id`
  );
  return rows;
}

// /board 탭용 — 소개 메뉴에 자기 주소가 따로 있는 것(show_in_board=false)은 뺀다.
export async function listBoardTabCategories() {
  const { rows } = await query(
    `SELECT ${COLS} FROM board_categories
      WHERE is_hidden = false AND show_in_board = true
      ORDER BY sort_order, id`
  );
  return rows;
}

// 이 카테고리에 글을 쓸 수 있는가. write_role 이 'admin' 이면 운영자만.
export function canWrite(category, { isAdmin, isApprovedMember }) {
  if (!category || category.is_hidden) return false;
  if (category.write_role === "admin") return !!isAdmin;
  return !!isAdmin || !!isApprovedMember;
}

export async function getCategoryById(id) {
  const { rows } = await query(`SELECT ${COLS} FROM board_categories WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getCategoryBySlug(slug) {
  const { rows } = await query(`SELECT ${COLS} FROM board_categories WHERE slug = $1`, [slug]);
  return rows[0] ?? null;
}

// 글에 붙일 이름표. 숨긴 카테고리의 글도 이름이 보여야 하므로 숨김을 포함한다.
export async function getLabelMap() {
  const { rows } = await query("SELECT slug, label FROM board_categories");
  return Object.fromEntries(rows.map((r) => [r.slug, r.label]));
}

export async function countPostsBySlug(slug) {
  const { rows } = await query("SELECT count(*)::int AS n FROM posts WHERE board = $1", [slug]);
  return rows[0].n;
}

export async function createCategory({ slug, label, sortOrder, writeRole, layout, showInBoard }) {
  const { rows } = await query(
    `INSERT INTO board_categories (slug, label, sort_order, write_role, layout, show_in_board)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLS}`,
    [slug, label, sortOrder, writeRole, layout, showInBoard]
  );
  return rows[0];
}

// slug 를 바꾸면 그 카테고리에 속한 글이 전부 미아가 된다(FK 가 없어 DB 가 막아주지
// 않는다). 그래서 카테고리와 posts.board 를 한 트랜잭션에서 함께 옮긴다.
export async function updateCategory(id, { slug, label, sortOrder, writeRole, layout, showInBoard }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: cur } = await client.query(
      "SELECT slug FROM board_categories WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (!cur[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    const oldSlug = cur[0].slug;
    const { rows } = await client.query(
      `UPDATE board_categories
          SET slug = $2, label = $3, sort_order = $4,
              write_role = $5, layout = $6, show_in_board = $7
        WHERE id = $1 RETURNING ${COLS}`,
      [id, slug, label, sortOrder, writeRole, layout, showInBoard]
    );
    let moved = 0;
    if (oldSlug !== slug) {
      const r = await client.query("UPDATE posts SET board = $2 WHERE board = $1", [oldSlug, slug]);
      moved = r.rowCount;
    }
    await client.query("COMMIT");
    return { ...rows[0], movedPosts: moved };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function setCategoryHidden(id, hidden) {
  await query("UPDATE board_categories SET is_hidden = $2 WHERE id = $1", [id, hidden]);
}

// 글이 남아 있으면 지우지 않는다. 카테고리를 지운다고 글까지 사라지면
// 되돌릴 방법이 없다(백업은 일단위 덤프뿐). 대신 숨김을 쓰게 한다.
export async function deleteCategory(id) {
  const cat = await getCategoryById(id);
  if (!cat) return { ok: false, reason: "not_found" };
  const n = await countPostsBySlug(cat.slug);
  if (n > 0) return { ok: false, reason: "has_posts", count: n, label: cat.label };
  await query("DELETE FROM board_categories WHERE id = $1", [id]);
  return { ok: true, label: cat.label };
}
