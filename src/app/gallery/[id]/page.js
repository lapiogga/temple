import Link from "next/link";
import BackLink from "@/components/BackLink";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs } from "@/components/Icons";
import { getAlbum, listPhotos } from "@/lib/gallery";
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
  return { title: a ? `${a.title} | ${SITE.name}` : `갤러리 | ${SITE.name}` };
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
  if (!album || album.visibility !== "public") notFound();

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap">
          <BackLink href="/gallery" label="갤러리" />
          <div className="sec-head reveal">
            <div>
              <div className="ki">Gallery</div>
              <h2>{album.title}</h2>
            </div>
          </div>

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
