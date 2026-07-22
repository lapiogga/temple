import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule, LanternIcon } from "@/components/Icons";
import { listEventsInMonth, listRegular, listAllEvents } from "@/lib/events";
import { monthMatrix, ymNav, parseYm, ymString } from "@/lib/calendar";
import { solarToLunar, lunarLabel } from "@/lib/lunar";
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
  const p = (n) => String(n).padStart(2, "0");
  const time = d.getHours() === 0 && d.getMinutes() === 0 ? "" : ` ${p(d.getHours())}:${p(d.getMinutes())}`;
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.${time}`;
}

// 반복 규칙(weekly:N / lunar:D)이 해당 요일/음력일에 맞는지
function matchesRecurrence(rec, weekday, lunarDay) {
  const r = (rec || "").trim();
  if (r.startsWith("weekly:")) return Number(r.slice(7)) === weekday;
  if (r.startsWith("lunar:")) return lunarDay != null && Number(r.slice(6)) === lunarDay;
  return false;
}

export default async function EventsPage({ searchParams }) {
  const now = new Date();
  const parsed = parseYm(searchParams?.ym) ?? { y: now.getFullYear(), m: now.getMonth() + 1 };
  const { y, m } = parsed;
  const view = searchParams?.view === "list" ? "list" : "calendar";

  const regular = await listRegular();
  let monthEvents = [];
  let allEvents = [];
  try {
    if (view === "list") allEvents = await listAllEvents();
    else monthEvents = await listEventsInMonth(y, m);
  } catch (err) {
    console.error("행사 조회 실패:", err);
  }

  const byDay = {};
  monthEvents.forEach((e) => {
    const d = eventDay(e.starts_at);
    (byDay[d] ||= []).push(e);
  });

  const recurringRegular = regular.filter((e) => (e.recurrence || "").trim());
  function recurringFor(day) {
    const weekday = new Date(y, m - 1, day).getDay();
    const lun = solarToLunar(y, m, day);
    return recurringRegular.filter((e) => matchesRecurrence(e.recurrence, weekday, lun?.lDay));
  }

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
        <div className="wrap" style={{ maxWidth: "1000px" }}>
          <div className="sec-head reveal" style={{ marginBottom: "14px" }}>
            <div>
              <div className="ki">Dharma</div>
              <h2>법회 · 행사 안내</h2>
            </div>
            <Link className="more" href="/">← 홈으로</Link>
          </div>

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
                              <div className="cal-daynum">
                                <span className={`cal-day${isThisMonth && day === today ? " today" : ""}${di === 0 ? " sun" : ""}`}>
                                  {day}
                                </span>
                                <span className="cal-lunar">{lunarLabel(y, m, day)}</span>
                              </div>
                              {(byDay[day] ?? []).map((e) => (
                                <Link key={e.id} className="cal-ev" href={`/events/${e.id}`} title={e.title}>
                                  {e.title}
                                </Link>
                              ))}
                              {recurringFor(day).map((e) => (
                                <Link key={"r" + e.id} className="cal-ev reg" href={`/events/${e.id}`} title={e.title}>
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
              <p className="cal-legend">
                <span className="lg-dot ev" /> 행사
                <span className="lg-dot reg" /> 정기법회(반복)
                <span style={{ color: "var(--ink-soft)" }}>· 날짜 아래 작은 숫자는 음력</span>
              </p>
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
                      <span className="ev-w">{e.starts_at ? fmtDateTime(e.starts_at) : e.when_text}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}

          <div className="reg-panel reveal">
            <h3 style={{ fontFamily: "var(--font-title)", fontSize: "20px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <LanternIcon size={22} /> 정기 법회
            </h3>
            {regular.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: "15.5px" }}>정기 법회 안내는 준비 중입니다.</p>
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
