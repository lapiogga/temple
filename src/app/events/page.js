import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, LanternIcon } from "@/components/Icons";
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

const pad = (n) => String(n).padStart(2, "0");

// 반복 규칙 파싱: daily:HH:MM / weekly:N[:HH:MM] / monthly:D[:HH:MM] / lunar:D(구형)
function parseRec(rec) {
  const r = (rec || "").trim();
  if (r.startsWith("daily:")) return { type: "daily", time: r.slice(6) || null };
  if (r.startsWith("weekly:")) {
    const [, n, hh, mm] = r.split(":");
    return { type: "weekly", weekday: Number(n), time: hh != null ? `${hh}:${mm}` : null };
  }
  if (r.startsWith("monthly:")) {
    const [, d, hh, mm] = r.split(":");
    return { type: "monthly", day: Number(d), time: hh != null ? `${hh}:${mm}` : null };
  }
  if (r.startsWith("lunar:")) return { type: "lunar", lday: Number(r.slice(6)), time: null };
  return null;
}
function recMatches(p, weekday, lunarDay, solarDay) {
  if (!p) return false;
  if (p.type === "daily") return true;
  if (p.type === "weekly") return p.weekday === weekday;
  if (p.type === "monthly") return p.day === solarDay;
  if (p.type === "lunar") return lunarDay != null && p.lday === lunarDay;
  return false;
}
// "HH:MM" → 분(정렬용). 시간 없으면 맨 뒤.
function toMin(t) {
  if (!t) return 100000;
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
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
  // 특정 날짜의 일정(행사 + 반복법회)을 시간순으로 모아 반환
  function dayItems(day) {
    const weekday = new Date(y, m - 1, day).getDay();
    const lun = solarToLunar(y, m, day);
    const dated = (byDay[day] ?? []).map((e) => {
      const d = new Date(e.starts_at);
      const time = d.getHours() === 0 && d.getMinutes() === 0 ? null : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      return { key: `e${e.id}`, href: `/events/${e.id}`, title: e.title, time, reg: false, sort: d.getHours() * 60 + d.getMinutes() };
    });
    const recs = recurringRegular
      .map((e) => ({ e, p: parseRec(e.recurrence) }))
      .filter(({ p }) => recMatches(p, weekday, lun?.lDay, day))
      .map(({ e, p }) => ({ key: `r${e.id}`, href: `/events/${e.id}`, title: e.title, time: p.time, reg: true, sort: toMin(p.time) }));
    return [...dated, ...recs].sort((a, b) => a.sort - b.sort);
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

      <section className="screen top tight">
        <div className="wrap wide">
          <div className="sec-head" style={{ marginBottom: "8px" }}>
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

          <div className="ev-layout">
            <div className="ev-main">
          {view === "calendar" ? (
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
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "var(--fs-400)", lineHeight: "var(--lh-400)", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
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
