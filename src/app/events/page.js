import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule, LanternIcon, BellIcon } from "@/components/Icons";
import { listEventsInMonth, listRegular, listAllEvents } from "@/lib/events";
import { monthMatrix, ymNav, parseYm, ymString } from "@/lib/calendar";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata = { title: `법회·행사 | ${SITE.name}` };

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const KIND_LABEL = { regular: "정기법회", event: "행사" };

function eventDay(startsAt) {
  return new Date(startsAt).getDate();
}
function fmtDateTime(startsAt) {
  const d = new Date(startsAt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const time = hh === "00" && mi === "00" ? "" : ` ${hh}:${mi}`;
  return `${d.getFullYear()}. ${mm}. ${dd}.${time}`;
}

export default async function EventsPage({ searchParams }) {
  const now = new Date();
  const parsed = parseYm(searchParams?.ym) ?? {
    y: now.getFullYear(),
    m: now.getMonth() + 1,
  };
  const { y, m } = parsed;
  const view = searchParams?.view === "list" ? "list" : "calendar";

  const regular = await listRegular();
  let monthEvents = [];
  let allEvents = [];
  try {
    if (view === "list") {
      allEvents = await listAllEvents();
    } else {
      monthEvents = await listEventsInMonth(y, m);
    }
  } catch (err) {
    console.error("행사 조회 실패:", err);
  }

  // 캘린더: 날짜별 버킷
  const byDay = {};
  monthEvents.forEach((e) => {
    const d = eventDay(e.starts_at);
    (byDay[d] ||= []).push(e);
  });
  const weeks = monthMatrix(y, m);
  const { prev, next } = ymNav(y, m);
  const isThisMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const today = now.getDate();

  const linkYm = (ny, nm, v = view) => `/events?ym=${ymString(ny, nm)}&view=${v}`;

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />

      <section className="blk">
        <div className="wrap">
          <div className="sec-head reveal" style={{ marginBottom: "14px" }}>
            <div>
              <div className="ki">Dharma</div>
              <h2>법회 · 행사 안내</h2>
            </div>
            <Link className="more" href="/">← 홈으로</Link>
          </div>

          {/* 컨트롤: 월 이동 + 뷰 토글 */}
          <div className="cal-head">
            <div className="cal-nav">
              <Link href={linkYm(prev.y, prev.m)} aria-label="이전 달">‹</Link>
              <span className="cal-title">{y}년 {m}월</span>
              <Link href={linkYm(next.y, next.m)} aria-label="다음 달">›</Link>
            </div>
            <div className="view-toggle">
              <Link href={linkYm(y, m, "calendar")} className={view === "calendar" ? "on" : ""}>캘린더</Link>
              <Link href={linkYm(y, m, "list")} className={view === "list" ? "on" : ""}>목록</Link>
            </div>
          </div>

          {view === "calendar" ? (
            <div className="cal-scroll">
              <table className="cal-grid">
                <thead>
                  <tr>
                    {WEEK.map((w, i) => (
                      <th key={w} className={i === 0 ? "sun" : ""}>{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((day, di) => (
                        <td key={di} className={day == null ? "empty" : ""}>
                          {day != null && (
                            <>
                              <span className={`cal-day${isThisMonth && day === today ? " today" : ""}`}>{day}</span>
                              {(byDay[day] ?? []).map((e) => (
                                <Link key={e.id} className="cal-ev" href={`/events/${e.id}`} title={e.title}>
                                  {e.title}
                                </Link>
                              ))}
                            </>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="ev-list">
              {allEvents.length === 0 ? (
                <li>등록된 행사가 없습니다.</li>
              ) : (
                allEvents.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.id}`}>
                      <span className="ev-t">
                        <span className="ev-kind">{KIND_LABEL[e.kind] ?? ""}</span>
                        {e.title}
                      </span>
                      <span className="ev-w">
                        {e.starts_at ? fmtDateTime(e.starts_at) : e.when_text}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}

          {/* 정기 법회 안내 */}
          <div className="reg-panel reveal">
            <h3 style={{ fontFamily: "var(--font-title)", fontSize: "18px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <LanternIcon size={20} /> 정기 법회
            </h3>
            {regular.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: "14.5px" }}>정기 법회 안내는 준비 중입니다.</p>
            ) : (
              <ul className="plist">
                {regular.map((r) => (
                  <li key={r.id}>
                    <span className="t">{r.title}</span>
                    <span className="v">{r.when_text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="note-small" style={{ marginTop: "16px" }}>
            ※ 표시된 일정은 예시(리뷰용)입니다. 관리자에서 실제 일정으로 등록·수정합니다.
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
