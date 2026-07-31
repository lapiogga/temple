import { query } from "@/lib/db";

// 게시판(posts) 데이터 접근. 파라미터화 쿼리만.
const COLS =
  "id, board, title, body, author_member_id, author_name, published, created_at";

// 카테고리 이름은 board_categories 테이블이 갖는다(운영자가 관리 화면에서 바꾼다).
// 예전에는 여기에 { free:"자유게시판", story:"신행수기" } 가 하드코딩돼 있었고
// 같은 목록이 board/page.js · BoardWriteForm.js 에도 복사돼 있었다.
// 이름표가 필요하면 lib/board-categories.js 의 getLabelMap() 을 쓴다.

export async function listPosts({ board } = {}) {
  if (board) {
    const { rows } = await query(
      `SELECT ${COLS} FROM posts WHERE published = true AND board = $1 ORDER BY created_at DESC`,
      [board]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT ${COLS} FROM posts WHERE published = true ORDER BY created_at DESC`
  );
  return rows;
}

export async function listAllPosts() {
  const { rows } = await query(`SELECT ${COLS} FROM posts ORDER BY created_at DESC`);
  return rows;
}

export async function getPost(id) {
  const { rows } = await query(`SELECT ${COLS} FROM posts WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createPost(d) {
  const { board, title, body, authorMemberId, authorName } = d;
  const { rows } = await query(
    `INSERT INTO posts (board, title, body, author_member_id, author_name)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [board, title, body, authorMemberId, authorName]
  );
  return rows[0];
}

export async function removePost(id) {
  await query("DELETE FROM posts WHERE id = $1", [id]);
}
