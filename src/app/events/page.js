import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, LanternIcon } from "@/components/Icons";
import { listEventsInMonth, listRegular, listRecurring } from "@/lib/events";
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

  // 캘린더와 목록이 **같은 자료**를 본다.
  //
  // 예전에는 목록 뷰만 listAllEvents() 로 전체를 뽑았다. 그래서 월 화살표를 눌러 주소가
  // ?ym=2026-09 로 바뀌어도 목록 내용이 그대로였다 — 눌러도 아무 일이 안 일어나는 것처럼
  // 보였다(2026-08-01 사용자 신고). 목록도 그 달의 일정을 보여야 한다.
  const regular = await listRegular();
  let monthEvents = [];
  let recurring = [];
  try {
    monthEvents = await listEventsInMonth(y, m);
    recurring = await listRecurring();
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

  // '오늘' 바로가기. 이번 달을 보고 있으면 오늘 자리로 스크롤하고, 다른 달을 보고
  // 있으면 이번 달로 돌아온다. 달을 여러 번 넘긴 뒤 제자리로 오는 길이 없었다.
  const todayHref = `${linkYm(today0.y, today0.m)}#today`;

  // 목록 뷰는 그 달의 일정을 '행사'와 '법회'로 나눠 보여 준다.
  // 섞어 놓으면 정기법회가 행사 사이에 흩어져 무엇이 되풀이되는 것인지 읽히지 않는다.
  const monthEventsOnly = monthList.filter((it) => !it.reg);
  const monthRegularOnly = monthList.filter((it) => it.reg);

  // #today 는 문서에 하나여야 한다. 오늘 일정이 행사·법회 양쪽에 있으면 id 가 둘이 되어
  // 유효하지 않은 HTML 이 되고, 브라우저가 어디로 갈지도 정해져 있지 않다.
  // 렌더 순서(행사 먼저)에서 처음 오는 오늘 항목 하나에만 단다.
  const todayAnchorKey = isThisMonth
    ? [...monthEventsOnly, ...monthRegularOnly].find((it) => it.day === today)?.key ?? null
    : null;

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
              {/* 달을 여러 번 넘긴 뒤 제자리로 오는 길이 없었다.
                  이번 달을 보고 있을 때는 오늘 자리로 스크롤한다(#today). */}
              <Link className="cal-today" href={todayHref}>오늘</Link>
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
                                <span
                                  id={isThisMonth && day === today ? "today" : undefined}
                                  className={`cal-day${isThisMonth && day === today ? " today" : ""}${di === 0 ? " sun" : di === 6 ? " sat" : ""}`}
                                >
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
            /* 목록 뷰 — 캘린더와 같은 달, 같은 자료를 본다.
               '행사'와 '법회'를 나눠 놓는다. 섞으면 매주 되풀이되는 법회가 행사 사이에
               흩어져 무엇이 정기적인 것인지 읽히지 않는다. */
            <div className="ev-list-wrap">
              {monthList.length === 0 ? (
                <p className="cal-ml-empty">{y}년 {m}월에 등록된 일정이 없습니다.</p>
              ) : (
                [
                  ["행사", monthEventsOnly, "ev"],
                  ["법회", monthRegularOnly, "reg"],
                ].map(([label, items, cls]) => (
                  <section key={label} className="ev-group">
                    <h3 className="ev-group-h">
                      <span className={`lg-dot ${cls}`} /> {label}
                      <span className="ev-group-n">{items.length}</span>
                    </h3>
                    {items.length === 0 ? (
                      <p className="cal-ml-empty">이 달에는 없습니다.</p>
                    ) : (
                      <ul className="ev-list">
                        {items.map((it) => (
                          <li
                            key={`${it.day}-${it.key}`}
                            id={it.key === todayAnchorKey ? "today" : undefined}
                            className={isThisMonth && it.day === today ? "is-today" : undefined}
                          >
                            <Link href={it.href}>
                              <span className="ev-t">
                                <span className="ev-kind">{it.day}일</span>
                                {it.title}
                              </span>
                              <span className="ev-w">{it.time ?? "시각 미정"}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))
              )}
            </div>
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

        </div>
      </section>

      <SiteFooter />
    </>
  );
}
