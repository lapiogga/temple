import { query } from "@/lib/db";
import { deleteUpload } from "@/lib/upload";

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

// 카드 목록용 — 글마다 첫 이미지를 함께 가져온다.
// 본문 HTML 을 파싱하지 않고 post_images 에서 뽑는다(그래서 이 테이블을 둔다).
export async function listPostsWithThumb({ board } = {}) {
  const params = [];
  let where = "p.published = true";
  if (board) {
    params.push(board);
    where += ` AND p.board = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT p.id, p.board, p.title, p.author_name, p.created_at,
            (SELECT i.url FROM post_images i
              WHERE i.post_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS thumb_url
       FROM posts p
      WHERE ${where}
      ORDER BY p.created_at DESC`,
    params
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
  const post = rows[0];
  await syncPostImages(post.id, body);
  return post;
}

// 본문에 실제로 남아 있는 /uploads/ 이미지를 post_images 에 맞춘다.
// 정화(sanitizeHtml) 를 거친 뒤의 본문을 넘겨야 한다 — 그래야 제거된 태그의
// 경로가 딸려 들어오지 않는다.
export async function syncPostImages(postId, sanitizedBody) {
  const urls = [];
  const re = /<img[^>]+src="(\/uploads\/[^"?#]+)"/gi;
  let m;
  while ((m = re.exec(sanitizedBody ?? "")) !== null) {
    if (!urls.includes(m[1])) urls.push(m[1]);
  }
  await query("DELETE FROM post_images WHERE post_id = $1", [postId]);
  for (let i = 0; i < urls.length; i++) {
    await query(
      "INSERT INTO post_images (post_id, url, sort_order) VALUES ($1, $2, $3)",
      [postId, urls[i], i]
    );
  }
  return urls.length;
}

export async function listPostImages(postId) {
  const { rows } = await query(
    "SELECT id, url, sort_order FROM post_images WHERE post_id = $1 ORDER BY sort_order, id",
    [postId]
  );
  return rows;
}

// 글을 지우면 딸린 이미지 파일도 지운다. post_images 행은 FK 의 ON DELETE CASCADE
// 로 사라지지만 디스크의 파일은 남기 때문이다(고아 파일).
// 다른 글이 같은 경로를 참조하고 있으면 파일은 남긴다 — 업로드마다 파일명이
// 달라 보통은 겹치지 않지만, 본문을 복사해 붙여 넣으면 겹칠 수 있다.
export async function removePost(id) {
  const mine = await listPostImages(id);
  await query("DELETE FROM posts WHERE id = $1", [id]);
  for (const img of mine) {
    const { rows } = await query(
      "SELECT 1 FROM post_images WHERE url = $1 LIMIT 1",
      [img.url]
    );
    if (rows.length === 0) await deleteUpload(img.url);
  }
}
