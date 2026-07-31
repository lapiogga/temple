import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, LanternIcon } from "@/components/Icons";
import { listEventsInMonth, listRegular, listRecurring, listAllEvents } from "@/lib/events";
import { WEEK, parseRec, recMatches, inRecurrenceWindow, toMin } from "@/lib/recurrence";
import { monthMatrix, ymNav, parseYm, ymString } from "@/lib/calendar";
import { solarToLunar, lunarLabel } from "@/lib/lunar";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata = { title: `법회·행사 | ${SITE.name}` };

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

const pad = (n) => String(n).padStart(2, "0");

export default async function EventsPage({ searchParams }) {
  const now = new Date();
  const parsed = parseYm(searchParams?.ym) ?? { y: now.getFullYear(), m: now.getMonth() + 1 };
  const { y, m } = parsed;
  const view = searchParams?.view === "list" ? "list" : "calendar";

  const regular = await listRegular();
  let monthEvents = [];
  let allEvents = [];
  let recurring = [];
  try {
    if (view === "list") allEvents = await listAllEvents();
    else {
      monthEvents = await listEventsInMonth(y, m);
      recurring = await listRecurring();
    }
  } catch (err) {
    console.error("행사 조회 실패:", err);
  }

  const byDay = {};
  monthEvents.forEach((e) => {
    const d = eventDay(e.starts_at);
    (byDay[d] ||= []).push(e);
  });

  // 특정 날짜의 일정(일회성 + 반복)을 시간순으로 모아 반환.
  // 반복은 법회뿐 아니라 행사도 될 수 있고, 시작일~종료일 안에서만 그린다.
  function dayItems(day) {
    const weekday = new Date(y, m - 1, day).getDay();
    const lun = solarToLunar(y, m, day);
    const dated = (byDay[day] ?? []).map((e) => {
      const d = new Date(e.starts_at);
      const time = d.getHours() === 0 && d.getMinutes() === 0 ? null : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      return { key: `e${e.id}`, href: `/events/${e.id}`, title: e.title, time, reg: false, sort: d.getHours() * 60 + d.getMinutes() };
    });
    const recs = recurring
      .map((e) => ({ e, p: parseRec(e.recurrence) }))
      .filter(({ e, p }) => recMatches(p, weekday, lun?.lDay, day) && inRecurrenceWindow(e, y, m, day))
      .map(({ e, p }) => ({
        key: `r${e.id}`, href: `/events/${e.id}`, title: e.title, time: p.time,
        reg: e.kind === "regular", sort: toMin(p.time),
      }));
    return [...dated, ...recs].sort((a, b) => a.sort - b.sort);
  }

  const weeks = monthMatrix(y, m);
  // 좁은 화면용 — 그 달의 일정을 날짜순 한 줄 목록으로 편다.
  // 캘린더 표는 min-width 760px 이라 360px 화면에서 446px 을 넘쳐 가로 스크롤이
  // 생기고, 그 때문에 모바일 브라우저가 축소(데스크톱) 모드로 고착됐다.
  // 자료는 캘린더와 같은 것을 쓴다(추가 조회 없음).
  const monthList = weeks
    .flat()
    .filter((d) => d != null)
    .flatMap((day) => dayItems(day).map((it) => ({ ...it, day })));
  const { prev, next } = ymNav(y, m);
  const isThisMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const today = now.getDate();
  const linkYm = (ny, nm, v = view) => `/events?ym=${ymString(ny, nm)}&view=${v}`;

  return (
    <>
      <DancheongDefs />
      <SiteHeader />

      <section className="screen top tight">
        <div className="wrap wide">
          <PageHead title="법회 · 행사 안내" ki="Dharma" back={{ href: "/", label: "홈으로" }} />

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

          <div className="ev-layout">
            <div className="ev-main">
          {view === "calendar" ? (
            <>
            <div className="cal-scroll">
              <table className="cal-grid">
                <thead>
                  <tr>
                    {WEEK.map((w, i) => (
                      <th key={w} className={i === 0 ? "sun" : i === 6 ? "sat" : ""}>{w}</th>
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
                                <span className={`cal-day${isThisMonth && day === today ? " today" : ""}${di === 0 ? " sun" : di === 6 ? " sat" : ""}`}>
                                  {day}
                                </span>
                                <span className="cal-lunar">{lunarLabel(y, m, day)}</span>
                              </div>
                              {dayItems(day).map((it) => (
                                <Link key={it.key} className={`cal-ev${it.reg ? " reg" : ""}`} href={it.href} title={`${it.time ? it.time + " " : ""}${it.title}`}>
                                  {it.time && <b className="ev-time">{it.time}</b>}{it.title}
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
                <span style={{ color: "var(--n-fg-3)" }}>· 날짜 아래 작은 숫자는 음력</span>
              </p>
            </div>
            {/* 좁은 화면에서는 위 캘린더가 숨고 이 목록만 보인다(globals.css). */}
            <ul className="cal-mobile-list">
              {monthList.length === 0 ? (
                <li className="cal-ml-empty">이 달에 등록된 일정이 없습니다.</li>
              ) : (
                monthList.map((it) => (
                  <li key={`${it.day}-${it.key}`}>
                    <Link href={it.href}>
                      <span className="cal-ml-day">{it.day}일</span>
                      <span className="cal-ml-title">
                        {it.time && <b className="ev-time">{it.time}</b>}
                        {it.title}
                      </span>
                      <span className={`cal-ml-kind${it.reg ? " reg" : ""}`}>
                        {it.reg ? "정기법회" : "행사"}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            </>
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
            </div>

            <aside className="reg-panel">
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "var(--fs-400)", lineHeight: "var(--lh-400)", fontWeight: "var(--fw-bold)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <LanternIcon size={20} /> 정기 법회
              </h3>
              {regular.length === 0 ? (
                <p style={{ color: "var(--n-fg-3)", fontSize: "var(--fs-300)" }}>정기 법회 안내는 준비 중입니다.</p>
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
            </aside>
          </div>

          <p className="note-small" style={{ marginTop: "8px" }}>
            ※ 표시된 일정은 예시(리뷰용)입니다. 관리자에서 실제 일정으로 등록·수정합니다.
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
