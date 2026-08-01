import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs, PhotoIcon } from "@/components/Icons";
import { listAlbums } from "@/lib/gallery";
import { getViewer } from "@/lib/viewer";
import { thumbSrc } from "@/lib/thumb";
import { SITE } from "@/content/site";
import Pager from "@/components/Pager";

export const dynamic = "force-dynamic";
export const metadata = { title: `갤러리 | ${SITE.name}` };

const PER_PAGE = 6;

export default async function GalleryPage({ searchParams }) {
  // 승인된 회원과 운영자에게는 '회원 전용' 앨범도 보인다.
  const { isAdmin, isApprovedMember } = await getViewer();
  const canSeeMember = isAdmin || isApprovedMember;

  let all = [];
  try {
    all = await listAlbums({ publicOnly: true, includeMember: canSeeMember });
  } catch (err) {
    console.error("갤러리 조회 실패:", err);
  }

  // 회원·운영자에게는 '전체 / 일반 / 회원 전용' 가름막을 준다.
  // 회원 전용 앨범이 일반 앨범 사이에 섞여 있으면 무엇이 회원에게만 보이는 것인지
  // 한눈에 안 잡힌다. 비로그인에게는 볼 것이 하나뿐이라 가름막 자체를 두지 않는다.
  const tab = canSeeMember && ["public", "member"].includes(searchParams?.tab)
    ? searchParams.tab
    : "all";
  const albums = tab === "all" ? all : all.filter((a) => a.visibility === tab);
  const counts = {
    all: all.length,
    public: all.filter((a) => a.visibility === "public").length,
    member: all.filter((a) => a.visibility === "member").length,
  };

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

          {canSeeMember && (
            <div className="gal-tabs reveal" role="group" aria-label="앨범 구분">
              {[
                ["all", "전체"],
                ["public", "일반"],
                ["member", "회원 전용"],
              ].map(([v, label]) => (
                <Link
                  key={v}
                  className={`gal-tab${tab === v ? " on" : ""}`}
                  href={v === "all" ? "/gallery" : `/gallery?tab=${v}`}
                  aria-current={tab === v ? "true" : undefined}
                >
                  {label} <span className="gal-tab-n">{counts[v]}</span>
                </Link>
              ))}
            </div>
          )}

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
                      <img src={thumbSrc(a.cover)} alt={a.title} loading="lazy" />
                    ) : (
                      <PhotoIcon />
                    )}
                  </div>
                  <div className="meta">
                    <h3>
                      {a.title}
                      {/* 회원에게만 보이는 앨범임을 알린다. 표시가 없으면 로그아웃한 뒤
                          같은 주소가 404 가 되는 이유를 알 수 없다. */}
                      {a.visibility === "member" ? (
                        <span className="gal-badge">회원 전용</span>
                      ) : null}
                    </h3>
                    <div className="cnt">사진 {a.photo_count}장</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {/* tab 을 함께 넘긴다. 안 넘기면 2쪽으로 가는 순간 가름막이 '전체' 로 풀린다. */}
          <Pager
            basePath="/gallery"
            query={tab === "all" ? {} : { tab }}
            page={page}
            totalPages={totalPages}
          />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
