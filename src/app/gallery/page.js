import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs, DancheongRule, PhotoIcon } from "@/components/Icons";
import { listAlbums } from "@/lib/gallery";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata = { title: `갤러리 | ${SITE.name}` };

export default async function GalleryPage() {
  let albums = [];
  try {
    albums = await listAlbums({ publicOnly: true });
  } catch (err) {
    console.error("갤러리 조회 실패:", err);
  }

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />
      <DancheongRule height={12} />

      <section className="blk">
        <div className="wrap">
          <div className="sec-head reveal">
            <div>
              <div className="ki">Gallery</div>
              <h2>갤러리</h2>
            </div>
            <Link className="more" href="/">← 홈으로</Link>
          </div>

          {albums.length === 0 ? (
            <p className="reveal" style={{ color: "var(--ink-soft)" }}>
              등록된 사진이 없습니다. 곧 도량의 모습을 담아 올리겠습니다.
            </p>
          ) : (
            <div className="gal-grid">
              {albums.map((a) => (
                <Link className="gal-card reveal" key={a.id} href={`/gallery/${a.id}`}>
                  <div className="cover">
                    {a.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.cover} alt={a.title} />
                    ) : (
                      <PhotoIcon />
                    )}
                  </div>
                  <div className="meta">
                    <h3>{a.title}</h3>
                    <div className="cnt">사진 {a.photo_count}장</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
