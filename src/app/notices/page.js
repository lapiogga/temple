import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs, DancheongRule, PhotoIcon } from "@/components/Icons";
import { listNotices } from "@/lib/notices";
import { formatDate, excerpt } from "@/lib/format";
import { SITE } from "@/content/site";

// 소식은 관리자 등록에 따라 바뀌므로 항상 최신 DB 조회.
export const dynamic = "force-dynamic";

export const metadata = { title: `사찰 소식 | ${SITE.name}` };

export default async function NoticesList() {
  let notices = [];
  try {
    notices = await listNotices({ includeUnpublished: false });
  } catch (err) {
    console.error("소식 목록 조회 실패:", err);
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
              <div className="ki">Notice</div>
              <h2>사찰 소식</h2>
            </div>
            <Link className="more" href="/">← 홈으로</Link>
          </div>

          {notices.length === 0 ? (
            <p className="reveal" style={{ color: "var(--ink-soft)" }}>
              등록된 소식이 없습니다. 곧 새로운 소식을 전해드리겠습니다.
            </p>
          ) : (
            <div className="news">
              {notices.map((n) => (
                <Link className="ncard reveal" key={n.id} href={`/notices/${n.id}`}>
                  <div className="ph">
                    {n.cover_url ? (
                      // 외부 https 이미지(자체 업로드는 8월 1차) — next/image 대신 순수 img
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.cover_url}
                        alt={n.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <PhotoIcon />
                    )}
                  </div>
                  <div className="body">
                    <div className="date">{formatDate(n.published_at)}</div>
                    <h3>{n.title}</h3>
                    <p>{excerpt(n.body)}</p>
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
