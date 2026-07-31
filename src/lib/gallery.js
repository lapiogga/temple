import { query } from "@/lib/db";

// 갤러리(앨범/사진) 데이터 접근. 파라미터화 쿼리만 사용.

// 앨범 목록 + 사진수 + 대표(첫) 사진.
//
// 공개 사이트는 보는 사람에 따라 갈린다.
//   · 누구나        → visibility='public' 만
//   · 승인된 회원   → 'public' + 'member'
//   · 관리자 화면   → 전부(옵션 없이 호출)
//
// 예전에는 publicOnly 하나뿐이라 'member' 앨범을 **아무도** 볼 수 없었다. 관리자
// 화면에는 '회원 전용' 선택지가 있어 실제로 3개가 그렇게 설정돼 있었는데, 목록에서
// 빠지고 상세는 404 였다. 관리자가 회원에게 보이라고 지정한 것이 아무에게도 안 보인 것이다.
export async function listAlbums({ publicOnly = false, includeMember = false } = {}) {
  const where = publicOnly
    ? includeMember
      ? "WHERE a.visibility IN ('public','member')"
      : "WHERE a.visibility = 'public'"
    : "";
  const { rows } = await query(
    `SELECT a.id, a.title, a.visibility, a.created_at,
            count(p.id)::int AS photo_count,
            (SELECT image_url FROM gallery_photos
              WHERE album_id = a.id ORDER BY sort_order, id LIMIT 1) AS cover
       FROM gallery_albums a
       LEFT JOIN gallery_photos p ON p.album_id = a.id
       ${where}
      GROUP BY a.id
      ORDER BY a.created_at DESC`
  );
  return rows;
}

// 이 앨범을 이 사람이 볼 수 있는가. 목록과 상세가 같은 규칙을 봐야 한다 —
// 한쪽만 고치면 목록에는 뜨는데 눌러 들어가면 404 가 되는 식으로 어긋난다.
export function canViewAlbum(album, { isAdmin = false, isApprovedMember = false } = {}) {
  if (!album) return false;
  if (album.visibility === "public") return true;
  if (album.visibility === "member") return isAdmin || isApprovedMember;
  return false;
}

export async function getAlbum(id) {
  const { rows } = await query(
    "SELECT id, title, visibility, created_at FROM gallery_albums WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function listPhotos(albumId) {
  const { rows } = await query(
    `SELECT id, album_id, image_url, caption, sort_order
       FROM gallery_photos WHERE album_id = $1 ORDER BY sort_order, id`,
    [albumId]
  );
  return rows;
}

export async function createAlbum({ title, visibility = "public" }) {
  const { rows } = await query(
    "INSERT INTO gallery_albums (title, visibility) VALUES ($1, $2) RETURNING id",
    [title, visibility]
  );
  return rows[0];
}

export async function updateAlbum(id, { title, visibility }) {
  await query(
    "UPDATE gallery_albums SET title = $2, visibility = $3 WHERE id = $1",
    [id, title, visibility]
  );
}

export async function removeAlbum(id) {
  // gallery_photos 는 ON DELETE CASCADE 로 함께 삭제.
  await query("DELETE FROM gallery_albums WHERE id = $1", [id]);
}

export async function addPhoto(albumId, { imageUrl, caption = null, sortOrder = 0 }) {
  const { rows } = await query(
    `INSERT INTO gallery_photos (album_id, image_url, caption, sort_order)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [albumId, imageUrl, caption, sortOrder]
  );
  return rows[0];
}

export async function removePhoto(id) {
  await query("DELETE FROM gallery_photos WHERE id = $1", [id]);
}
