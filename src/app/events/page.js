import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, LanternIcon } from "@/components/Icons";
import { listEventsInMonth, listRegular, listRecurring, listAllEvents } from "@/lib/events";
import { WEEK, parseRec, recMatches, inRecurrenceWindow, toMin } from "@/lib/recurrence";
import { monthMatrix, ymNav, parseYm, ymString } from "@/lib/calendar";
import { formatWallDateTime, wallDayOfMonth, wallTime, kstToday } from "@/lib/format";
import { solarToLunar, lunarLabel } from "@/lib/lunar";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata = { title: `법회·행사 | ${SITE.name}` };

const KIND_LABEL = { regular: "정기법회", event: "행사" };

// starts_at 은 관리자가 친 벽시계가 UTC 라벨을 달고 저장된 값이다.
// 로컬 게터로 꺼내면 서버 TZ 가 UTC 가 아닌 순간 전부 밀리므로 lib/format 의
// UTC 고정 판을 쓴다(자세한 사정은 그 파일 머리말).

export default async function EventsPage({ searchParams }) {
  // '오늘' 은 KST 기준이어야 한다 — 서버 TZ(UTC)를 쓰면 KST 00:00~09:00 사이에
  // 달력이 어제를 오늘로 표시하고, 매월 1일 그 시간대에는 지난달로 열린다.
  const today0 = kstToday();
  const parsed = parseYm(searchParams?.ym) ?? { y: today0.y, m: today0.m };
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
    const d = wallDayOfMonth(e.starts_at);
    if (d != null) (byDay[d] ||= []).push(e);
  });

  // 특정 날짜의 일정(일회성 + 반복)을 시간순으로 모아 반환.
  // 반복은 법회뿐 아니라 행사도 될 수 있고, 시작일~종료일 안에서만 그린다.
  function dayItems(day) {
    const weekday = new Date(y, m - 1, day).getDay();
    const lun = solarToLunar(y, m, day);
    const dated = (byDay[day] ?? []).map((e) => {
      const time = wallTime(e.starts_at);
      return {
        key: `e${e.id}`, href: `/events/${e.id}`, title: e.title, time,
        // 반복 여부가 아니라 구분(kind)이 정기법회인지를 본다.
        // 여기가 false 로 박혀 있어, 반복을 끈 하루짜리 법회(특별법회)가 달력에서는
        // '행사' 색으로, 모바일 목록에서는 '행사' 라벨로 나왔다 — 아래 반복 분기(:reg)
        // 와 기준이 서로 달랐던 것이다. 상세 화면은 처음부터 kind 를 쓰고 있었다.
        reg: e.kind === "regular",
        // toMin(null)=맨 뒤. 00:00 은 화면에서도 '시각 없음' 으로 다루므로
        // 시각을 적은 일정 뒤에 오는 것이 맞다(반복 분기와 같은 기준).
        sort: toMin(time),
      };
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
  const isThisMonth = y === today0.y && m === today0.m;
  const today = today0.d;
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
                {/* 기준이 kind 라 '(반복)' 은 뗀다 — 반복을 끈 특별법회도 여기 들어온다. */}
                <span className="lg-dot reg" /> 정기법회
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
                      {/* 반복 일정은 starts_at 이 '첫 회' 날짜다. 그대로 찍으면 매주 하는
                          법회가 그 하루짜리 행사처럼 보이므로, 반복이면 규칙을 담은
                          when_text("매주 일요일 오전 10:00")를 먼저 쓴다.
                          관리자 목록(admin/events/page.js:54)은 처음부터 이 순서였다. */}
                      <span className="ev-w">
                        {e.recurrence ? e.when_text ?? "" : e.starts_at ? formatWallDateTime(e.starts_at) : e.when_text}
                      </span>
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
