import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs, PhotoIcon } from "@/components/Icons";
import { listAlbums } from "@/lib/gallery";
import { SITE } from "@/content/site";
import Pager from "@/components/Pager";

export const dynamic = "force-dynamic";
export const metadata = { title: `갤러리 | ${SITE.name}` };

const PER_PAGE = 6;

export default async function GalleryPage({ searchParams }) {
  let albums = [];
  try {
    albums = await listAlbums({ publicOnly: true });
  } catch (err) {
    console.error("갤러리 조회 실패:", err);
  }

  const totalPages = Math.max(1, Math.ceil(albums.length / PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, Number(searchParams?.page) || 1));
  const paged = albums.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap">
          <PageHead title="갤러리" ki="Gallery" className="reveal" back={{ href: "/", label: "홈으로" }} />

          {albums.length === 0 ? (
            <p className="reveal" style={{ color: "var(--n-fg-3)" }}>
              등록된 사진이 없습니다. 곧 도량의 모습을 담아 올리겠습니다.
            </p>
          ) : (
            <div className="gal-grid">
              {paged.map((a) => (
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
          <Pager basePath="/gallery" page={page} totalPages={totalPages} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
