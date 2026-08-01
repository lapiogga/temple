import Link from "next/link";
import PageHead from "@/components/PageHead";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs } from "@/components/Icons";
import { getAlbum, listPhotos, canViewAlbum } from "@/lib/gallery";
import { getViewer } from "@/lib/viewer";
import PhotoGrid from "@/components/PhotoGrid";
import Pager from "@/components/Pager";
import { thumbSrc } from "@/lib/thumb";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }) {
  const id = parseId(params.id);
  if (!id) return { title: `갤러리 | ${SITE.name}` };
  let a = null;
  try {
    a = await getAlbum(id);
  } catch {
    a = null;
  }
  // 볼 수 없는 앨범의 제목은 내보내지 않는다. 본문은 404 인데 탭 제목에 이름이 뜨면
  // "회원 전용 앨범이 무엇무엇 있다" 가 그대로 새어 나간다.
  const { isAdmin, isApprovedMember } = await getViewer();
  const visible = canViewAlbum(a, { isAdmin, isApprovedMember });
  return { title: visible ? `${a.title} | ${SITE.name}` : `갤러리 | ${SITE.name}` };
}

// 한 화면에 놓는 사진 수.
//
// 예전에는 앨범의 사진을 전부 한 번에 그렸다. 35장짜리 앨범이 원본으로 13.84MB 를
// 내려받았다(2026-08-01 운영 실측). 격자는 썸네일로 바꿨고, 그 위에 쪽을 나눈다 —
// 사진 200장짜리 앨범이 들어와도 첫 화면이 무거워지지 않는다.
const PER_PAGE = 24;

export default async function AlbumPage({ params, searchParams }) {
  const id = parseId(params.id);
  if (!id) notFound();

  let album = null;
  let photos = [];
  try {
    album = await getAlbum(id);
    if (album) photos = await listPhotos(id);
  } catch (err) {
    console.error("앨범 조회 실패:", err);
  }
  // 목록과 같은 규칙을 쓴다(lib/gallery.js canViewAlbum). 한쪽만 고치면 목록에는
  // 뜨는데 눌러 들어가면 404 가 되는 식으로 어긋난다.
  const { isAdmin, isApprovedMember } = await getViewer();
  if (!canViewAlbum(album, { isAdmin, isApprovedMember })) notFound();

  const totalPages = Math.max(1, Math.ceil(photos.length / PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, Number(searchParams?.page) || 1));
  const paged = photos.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap">
          <PageHead title={album.title} ki="Gallery" className="reveal" back={{ href: "/gallery", label: "갤러리" }} />

          {photos.length === 0 ? (
            <p className="reveal" style={{ color: "var(--n-fg-3)" }}>등록된 사진이 없습니다.</p>
          ) : (
            <>
              {/* 격자에는 썸네일을 쓴다. 파일이 실제로 있을 때만 썸네일을 주고 없으면
                  원본으로 떨어진다 — 존재 확인은 서버에서만 할 수 있어 여기서 넣는다. */}
              <PhotoGrid
                photos={paged.map((p) => ({ ...p, thumb_src: thumbSrc(p.image_url) }))}
                albumTitle={album.title}
              />
              {totalPages > 1 && (
                <>
                  <p className="gal-count">
                    사진 {photos.length}장 중 {(page - 1) * PER_PAGE + 1}–
                    {Math.min(page * PER_PAGE, photos.length)}
                  </p>
                  <Pager page={page} totalPages={totalPages} basePath={`/gallery/${id}`} />
                </>
              )}
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
