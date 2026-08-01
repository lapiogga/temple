import { query } from "@/lib/db";
import { deleteUpload } from "@/lib/upload";
import { CONTENT_DEFAULTS } from "@/lib/site-content";
import { SANSINDO, GUIDE_MAP } from "@/content/about";

// 씨앗 이미지 — DB 에 행이 없어도 코드 기본값으로 화면이 쓴다.
// site_content 가 비어 있으면 홈 히어로는 CONTENT_DEFAULTS 를 쓰므로,
// DB 조회만으로는 "아무도 안 쓴다" 로 잘못 판정된다.
// 목록을 손으로 적지 않고 실제 기본값에서 뽑아 드리프트를 막는다.
const RESERVED_UPLOADS = new Set(
  [
    ...(CONTENT_DEFAULTS?.hero?.images ?? []),
    SANSINDO?.image,
    GUIDE_MAP?.image,
  ].filter((u) => typeof u === "string" && u.startsWith("/uploads/"))
);

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

// 정화된 본문에 남아 있는 업로드 이미지 주소. 저장(syncPostImages)과 저장 전 검사가
// 같은 기준을 봐야 한다 — 따로 세면 "검사는 통과했는데 이미지가 0장" 이 생긴다.
export function bodyImageUrls(sanitizedBody) {
  const urls = [];
  const re = /<img[^>]+src="(\/uploads\/[^"?#]+)"/gi;
  let m;
  while ((m = re.exec(sanitizedBody ?? "")) !== null) {
    if (!urls.includes(m[1])) urls.push(m[1]);
  }
  return urls;
}

// 본문에 실제로 남아 있는 /uploads/ 이미지를 post_images 에 맞춘다.
// 정화(sanitizeHtml) 를 거친 뒤의 본문을 넘겨야 한다 — 그래야 제거된 태그의
// 경로가 딸려 들어오지 않는다.
export async function syncPostImages(postId, sanitizedBody) {
  const urls = bodyImageUrls(sanitizedBody);
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

// public/uploads 는 사이트 전체가 함께 쓰는 단일 저장소다. 그래서 파일을 지우기
// 전에 "이 경로를 다른 데서 쓰고 있는가" 를 전부 확인해야 한다.
//
// 예전에는 post_images 한 테이블만 봤다. 그 결과 본문에 홈 히어로 이미지 경로를
// 한 번 적어 넣은 글을 지우면 홈 배경이 404 가 됐다(2026-07-31 검증에서 실증).
// sanitizeHtml 이 상대경로 img src 를 통과시키고 syncPostImages 가 출처와
// 무관하게 연결하므로, 본문이 남의 파일을 가리키기만 하면 걸린다.
async function isUploadReferencedElsewhere(url) {
  // 코드 기본값(히어로·산신도·안내도)은 DB 에 행이 없어도 화면이 쓴다.
  if (RESERVED_UPLOADS.has(url)) return true;
  const { rows } = await query(
    `SELECT 1 WHERE EXISTS (SELECT 1 FROM post_images      WHERE url       = $1)
                OR EXISTS (SELECT 1 FROM gallery_photos    WHERE image_url = $1)
                OR EXISTS (SELECT 1 FROM event_attachments WHERE file_url  = $1)
                OR EXISTS (SELECT 1 FROM notices           WHERE cover_url = $1)
                OR EXISTS (SELECT 1 FROM site_content      WHERE value::text LIKE '%' || $1 || '%')`,
    [url]
  );
  return rows.length > 0;
}

// 글 수정. 제목·본문만 바꾼다 — board(소속 게시판)와 작성자는 건드리지 않는다.
// 게시판을 옮기면 카드형/목록형의 사진 요건이 달라지고 /about 주소도 바뀌므로
// 그건 별개의 일로 둔다.
//
// 이미지 처리가 생성보다 까다롭다. 본문에서 지워진 사진은 post_images 에서 빠지는
// 것으로 끝나지 않고 디스크의 파일이 아무도 참조하지 않는 고아로 남는다.
// removePost 와 같은 기준(isUploadReferencedElsewhere)으로 정리한다.
export async function updatePost(id, { title, body }) {
  // 바꾸기 전 목록을 먼저 잡는다 — syncPostImages 가 post_images 를 통째로
  // 갈아치우므로 그 뒤에는 무엇이 빠졌는지 알 수 없다.
  const before = await listPostImages(id);

  const { rows } = await query(
    "UPDATE posts SET title = $2, body = $3 WHERE id = $1 RETURNING id",
    [id, title, body]
  );
  if (!rows[0]) return null;

  await syncPostImages(id, body);

  // 남아 있는 것과 대조해 빠진 것만 지운다. 위 sync 가 이미 끝났으므로
  // isUploadReferencedElsewhere 는 '다른 글·갤러리·행사·공지·홈 콘텐츠가
  // 쓰고 있는가' 만 답한다.
  const still = new Set(bodyImageUrls(body));
  for (const img of before) {
    if (still.has(img.url)) continue;
    if (!(await isUploadReferencedElsewhere(img.url))) await deleteUpload(img.url);
  }
  return rows[0];
}

// 글을 지우면 딸린 이미지 파일도 지운다. post_images 행은 FK 의 ON DELETE CASCADE
// 로 사라지지만 디스크의 파일은 남기 때문이다(고아 파일).
export async function removePost(id) {
  const mine = await listPostImages(id);
  await query("DELETE FROM posts WHERE id = $1", [id]);
  for (const img of mine) {
    // 위 DELETE 로 이 글의 post_images 행은 이미 사라졌으므로, 남아 있다면
    // 다른 글이 같은 경로를 쓰는 것이다.
    if (!(await isUploadReferencedElsewhere(img.url))) await deleteUpload(img.url);
  }
}
