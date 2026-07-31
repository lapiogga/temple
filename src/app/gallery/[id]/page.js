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

export default async function AlbumPage({ params }) {
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
            <PhotoGrid photos={photos} albumTitle={album.title} />
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
