import Link from "next/link";
import { DancheongDefs } from "@/components/Icons";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HeroCarousel from "@/components/HeroCarousel";
import { listNotices } from "@/lib/notices";
import { listEventsInMonth, listAllEvents } from "@/lib/events";
import { getSection } from "@/lib/site-content";
import { formatDate } from "@/lib/format";

// 관리자 등록이 즉시 반영되도록 항상 최신 DB 조회.
export const dynamic = "force-dynamic";

function evDate(startsAt, whenText) {
  if (!startsAt) return whenText || "";
  const d = new Date(startsAt);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default async function Home() {
  const now = new Date();
  let notices = [];
  let events = [];
  try {
    notices = (await listNotices({ includeUnpublished: false })).slice(0, 5);
  } catch (err) {
    console.error("홈 공지사항 조회 실패:", err);
  }
  try {
    events = await listEventsInMonth(now.getFullYear(), now.getMonth() + 1);
    if (events.length === 0) events = await listAllEvents();
  } catch (err) {
    console.error("홈 행사 조회 실패:", err);
  }
  events = events.slice(0, 5);

  const hero = await getSection("hero");

  return (
    <>
      <DancheongDefs />
      <SiteHeader />

      <section className="screen home2">
        <div className="wrap home2-in">
          {/* 윗단: 대표 이미지 좌우 슬라이드(옅게) + 문구 (관리자 편집) */}
          <HeroCarousel images={hero.images} eyebrow={hero.eyebrow} title={hero.title} lede={hero.lede} />

          {/* 아랫단: 공지사항(표)·산신도(옅은 배경)·법회행사(목록) */}
          <div className="home-cards">
            {/* 공지사항 — 최근 5 표 + 더보기 */}
            <div className="hpanel">
              <div className="hpanel-head">
                <span className="k">Notice</span>
                <h3>공지사항</h3>
              </div>
              <table className="mini-table">
                <tbody>
                  {notices.length > 0 ? (
                    notices.map((n) => (
                      <tr key={n.id}>
                        <td className="d">{formatDate(n.published_at)}</td>
                        <td className="t">
                          <Link href={`/notices/${n.id}`}>
                            {n.is_pinned && <span className="tag-pin">공지</span>}
                            {n.title}
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="empty" colSpan={2}>등록된 공지사항이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
              <Link className="more-btn" href="/notices">더보기 →</Link>
            </div>

            {/* 대웅전 산신도 — 옅은 배경 이미지 */}
            <Link className="hfade" href="/about/sansindo" style={{ backgroundImage: `url(/uploads/sansindo.jpg)` }}>
              <div className="hfade-in">
                <span className="k">Treasure</span>
                <h3>대웅전 산신도</h3>
                <p>서울시 문화재자료 제14호 · 1914년 조성</p>
                <span className="more-inline">자세히 보기 →</span>
              </div>
            </Link>

            {/* 법회·행사 — 최근 한 달 목록 + 더보기 */}
            <div className="hpanel">
              <div className="hpanel-head">
                <span className="k">Dharma</span>
                <h3>법회·행사</h3>
              </div>
              <ul className="mini-list">
                {events.length > 0 ? (
                  events.map((e) => (
                    <li key={e.id}>
                      <Link href={`/events/${e.id}`}>
                        <span className="d">{evDate(e.starts_at, e.when_text)}</span>
                        <span className="t">{e.title}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="empty">예정된 일정이 없습니다.</li>
                )}
              </ul>
              <Link className="more-btn" href="/events">더보기 →</Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
