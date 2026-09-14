"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { solarToLunar, lunarToSolar } from "@/lib/lunar";
import {
  WEEK, parseRec, recMatches, recLabel, recToForm, formToRec, timeLabel,
  inRecurrenceWindow, maxDayOf,
} from "@/lib/recurrence";
import TimeField from "./TimeField";

const p2 = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

// 규칙이 앞으로 실제로 걸리는 양력 날짜 몇 개.
//
// 음력 규칙은 고른 값만 봐서는 언제인지 알 수 없다 — "음력 18일" 이 다음 달 몇 일인지
// 관리자가 머리로 셀 수는 없다. 그래서 저장 전에 환산해 보여 준다.
//
// **달력이 쓰는 두 조건을 모두 건다** — 주기 판정(recMatches)과 기간(inRecurrenceWindow).
// 처음에는 recMatches 만 불렀는데, 그러면 종료일을 짧게 잡거나 시작일을 미래로 둔
// 일정에서 미리보기에는 날짜가 뜨는데 달력에는 하나도 안 나온다. 판정 함수를 공유하는
// 것만으로는 부족하고 거르는 조건이 같아야 어긋나지 않는다.
//
// 훑기 시작점도 시작일과 오늘 중 늦은 쪽이다. 오늘부터 훑으면 시작일이 반년 뒤인
// 일정은 훑는 범위를 다 써도 한 건도 못 찾는다.
//
// 덤으로 드러나는 것이 하나 더 있다 — 음력 30일은 작은 달(29일)에는 없어서 건너뛴다.
// 목록의 간격이 벌어지므로 눈으로 확인된다.
function nextHits(rec, fromUTC, win, count, scanDays) {
  const p = parseRec(rec);
  if (!p) return [];
  let start = fromUTC;
  if (win.starts_at) {
    const s = new Date(win.starts_at);
    const sUTC = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
    if (sUTC > start) start = sUTC;
  }
  const out = [];
  const d = new Date(start);
  for (let i = 0; i < scanDays && out.length < count; i++) {
    const Y = d.getUTCFullYear();
    const M = d.getUTCMonth() + 1;
    const D = d.getUTCDate();
    const ctx = { weekday: d.getUTCDay(), month: M, day: D, lunar: solarToLunar(Y, M, D) };
    if (recMatches(p, ctx) && inRecurrenceWindow(win, Y, M, D)) out.push(`${Y}-${p2(M)}-${p2(D)}`);
    d.setUTCDate(D + 1);
  }
  return out;
}

// 저장된 starts_at · recurrence_until 을 되읽을 때 쓰는 UTC 판.
//
// 이 두 값은 '어느 순간' 이 아니라 관리자가 친 벽시계다. 저장 경로가
// `${solarDate}T${time}` 이라는 시간대 없는 문자열을 서버(TZ=UTC)에서 new Date() 로
// 파싱하므로 "18:00" 입력이 18:00+00 으로 들어간다(실측: id=3 → 2026-08-04T18:00Z,
// when_text 는 "2026-08-04 18:00"). 그러니 되읽을 때도 UTC 로 꺼내야 친 그대로 나온다.
//
// 로컬 게터를 쓰면 안 되는 이유가 하나 더 있다 — 이 파일은 "use client" 라서
// 초기 state 가 브라우저에서 다시 계산된다. 관리자의 브라우저가 KST 면 18:00Z 가
// 다음날 03:00 으로 읽혀 날짜까지 하루 밀린다(SSR 은 UTC 라 하이드레이션도 어긋난다).
const ymdU = (d) => `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
const hmU = (d) => `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;

// 종료일 상한. 신규 등록은 시작일 + 1년까지, 이미 등록된 것은 '1년 연장' 으로
// 한 번 더 밀 수 있어 최대 2년이다(서버도 같은 값으로 검사한다).
function plusYears(dateStr, n) {
  const [Y, M, D] = (dateStr || "").split("-").map(Number);
  if (!Y) return "";
  return ymd(new Date(Y + n, M - 1, D));
}

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

export default function EventForm({ action, initial = {}, submitLabel = "저장" }) {
  const [state, formAction] = useFormState(action, {});
  const isEdit = !!initial.id;

  const [kind, setKind] = useState(initial.kind ?? "event");

  // 반복 여부는 구분(행사/법회)과 별개다.
  //  · 법회는 반복이 기본 — 매주 일요일 같은 것이 대부분이다.
  //    다만 특별법회처럼 하루짜리도 있어 끌 수 있어야 한다.
  //  · 행사는 반대로 하루짜리가 기본이고 필요하면 켠다.
  // 수정 화면에서는 저장된 값(recurrence 유무)이 곧 반복 여부다.
  const [repeat, setRepeat] = useState(
    isEdit ? !!(initial.recurrence || "").trim() : (initial.kind ?? "event") === "regular"
  );

  // 날짜(일회성) / 반복 시작일 — 아래 time 초기화가 이 값을 쓰므로 먼저 계산한다.
  const initStarts = initial.starts_at ? new Date(initial.starts_at) : null;

  // 저장된 규칙을 폼이 고르는 두 축('주기' 와 '양력/음력')으로 푼다. 되돌려 합치는
  // 것은 아래 recurrence useMemo 의 formToRec — 둘이 lib/recurrence 에 나란히 있다.
  //
  // 음력은 이제 폼이 직접 만든다. 예전에는 lunar 규칙을 읽기 전용으로 붙들고 있었다 —
  // 만들 수단이 없으니 손대면 양력으로 덮여 버려서, 건드리지 않는 것이 최선이었다.
  // 이제 lunar 도 매월·매년 둘 다 고를 수 있으므로 붙들어 둘 이유가 없어졌다.
  const initForm = recToForm(initial.recurrence);

  const [freq, setFreq] = useState(initForm.freq);
  const [weekday, setWeekday] = useState(initForm.weekday);
  const [monthDay, setMonthDay] = useState(initForm.monthDay);
  const [yearMonth, setYearMonth] = useState(initForm.yearMonth);
  const [yearDay, setYearDay] = useState(initForm.yearDay);

  // 시각은 반복 규칙 문자열 안에 들어 있다(weekly:0:10:00). 일회성은 규칙이 없어
  // parseRec 이 null 을 돌려주므로 starts_at 에서 꺼내야 한다.
  // 이 폴백이 빠져 있어서 일회성 수정 화면이 저장값과 무관하게 늘 10:00 으로 열렸고,
  // 시각을 건드리지 않고 제목만 고쳐 저장해도 hidden startsAt·whenText 가 10:00 으로
  // 다시 조립돼 저장돼 있던 시각이 조용히 사라졌다. Ver1.1 에는 있던 처리다.
  //
  // 구형 `lunar:D` 는 시각 자리가 없어 initForm.time 이 null 이다. 그 경우에도 여기서
  // 기본값이 채워져, 수정 화면을 열어 저장하면 시각이 붙은 새 형식으로 올라간다.
  const [time, setTime] = useState(initForm.time ?? (initStarts ? hmU(initStarts) : "10:00"));

  // 날짜 기준(양력/음력)을 반복 규칙과 일회성 날짜가 **따로** 든다.
  //
  // 한때 하나로 합쳐 뒀다가 사고가 났다. 음력 규칙으로 저장된 법회를 열면 공유 상태가
  // 'lunar' 로 시작하는데, 거기서 '반복 일정' 체크를 끄면 일회성 화면이 음력 탭으로
  // 열린다. 그런데 아래 lunarYear/lunarMonth/lunarDay 는 규칙에서 복원되지 않는
  // 값이라 2026/1/1 기본값 그대로다. 그 순간 아무도 고르지 않은 날짜가 조립되고,
  // 양력 칸에 달아 둔 required 는 렌더되지 않으니 브라우저도 서버도 통과시킨다.
  // 제목만 고치러 들어왔다가 체크박스를 잘못 눌러도 법회가 지난 날짜의 일회성 행사로
  // 바뀌는 것이다(recurrence 가 비면 정기법회 패널에서도 빠진다).
  //
  // 같은 질문처럼 보여도 답이 쓰이는 곳이 다르다 — 규칙의 '음력 18일' 과 일회성의
  // '음력 몇 년 몇 월 며칠' 은 필요한 값 자체가 다르다. 그래서 상태를 나눈다.
  const [recCal, setRecCal] = useState(initForm.calType);
  const [calType, setCalType] = useState("solar");
  const [solarDate, setSolarDate] = useState(initStarts ? ymdU(initStarts) : "");
  const [lunarYear, setLunarYear] = useState(initStarts ? initStarts.getUTCFullYear() : 2026);
  const [lunarMonth, setLunarMonth] = useState(1);
  const [lunarDay, setLunarDay] = useState(1);

  // 고른 날짜가 그 달에 있는 날인지는 규칙 파일이 정한다(양력 2월은 29, 음력은 30).
  // 매월 규칙은 달을 고르지 않으므로 양력이면 31 까지 열어 둔다 — 31일이 없는 달을
  // 건너뛸 뿐 나머지 달에는 실제로 걸린다.
  const monthMaxDay = recCal === "lunar" ? 30 : 31;
  const yearMaxDay = maxDayOf(recCal, yearMonth);

  // 날짜 기준을 바꾸면 범위 밖이 된 값을 끌어내린다. 그대로 두면 어느 날에도
  // 걸리지 않는 규칙이 만들어진다(음력에 31일은 없다).
  function pickRecCal(v) {
    setRecCal(v);
    setMonthDay((d) => Math.min(d, v === "lunar" ? 30 : 31));
    setYearDay((d) => Math.min(d, maxDayOf(v, yearMonth)));
  }
  // 달을 바꿀 때도 같다 — 1월 31일에서 2월로 옮기면 31일이 남는다.
  function pickYearMonth(m) {
    setYearMonth(m);
    setYearDay((d) => Math.min(d, maxDayOf(recCal, m)));
  }

  const [until, setUntil] = useState(
    initial.recurrence_until ? ymdU(new Date(initial.recurrence_until)) : ""
  );

  // 일회성 시각도 같은 time 상태를 쓴다(시간 입력이 하나뿐이라 헷갈리지 않는다).
  const evValues = useMemo(() => {
    if (calType === "solar") {
      if (!solarDate) return { startsAt: "", conv: "", dateOnly: "" };
      const [Y, M, D] = solarDate.split("-").map(Number);
      const lun = solarToLunar(Y, M, D);
      return {
        startsAt: `${solarDate}T${time}`,
        conv: lun ? `음력 ${lun.isLeap ? "윤" : ""}${lun.lMonth}.${lun.lDay}` : "",
        dateOnly: solarDate,
      };
    }
    const sol = lunarToSolar(Number(lunarYear), Number(lunarMonth), Number(lunarDay));
    if (!sol) return { startsAt: "", conv: "환산할 수 없는 날짜입니다.", dateOnly: "" };
    const sd = `${sol.year}-${p2(sol.month)}-${p2(sol.day)}`;
    return { startsAt: `${sd}T${time}`, conv: `양력 ${sd}`, dateOnly: sd };
  }, [calType, solarDate, time, lunarYear, lunarMonth, lunarDay]);

  const recurrence = useMemo(
    () => (repeat ? formToRec({ freq, calType: recCal, weekday, monthDay, yearMonth, yearDay, time }) : ""),
    [repeat, freq, recCal, weekday, monthDay, yearMonth, yearDay, time]
  );

  const whenText = useMemo(() => {
    if (!repeat) {
      if (!evValues.startsAt) return "";
      return `${evValues.dateOnly} ${timeLabel(time)}${evValues.conv ? ` (${evValues.conv})` : ""}`;
    }
    // 설명문도 규칙 문자열 하나에서 뽑는다. 상태 변수를 보고 따로 문장을 만들면
    // 규칙과 설명이 각각 조립돼 한쪽만 고쳤을 때 조용히 어긋난다(recLabel 주석).
    const head = recLabel(parseRec(recurrence));
    return head ? `${head}${until ? ` (~${until})` : ""}` : "";
  }, [repeat, recurrence, time, until, evValues]);

  // '오늘' 은 브라우저에서만 읽는다. 서버(UTC)와 관리자 브라우저(KST)의 오늘이 연말
  // 9시간 동안 하루 다르므로, 렌더 중에 new Date() 를 읽으면 하이드레이션이 어긋난다.
  const [todayUTC, setTodayUTC] = useState(null);
  useEffect(() => {
    const n = new Date();
    setTodayUTC(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  }, []);

  // 음력 규칙을 고른 동안만 — 앞으로 걸리는 양력 날짜 세 번.
  // 매월은 넉 달이면 세 번이 나오고, 매년은 세 번을 보려면 3년 남짓을 훑어야 한다.
  //
  // 기간(시작일·종료일)까지 보므로 그 둘도 의존성에 넣는다. 빠뜨리면 종료일을 줄여도
  // 미리보기가 옛 날짜를 그대로 들고 있다.
  const showPeek = repeat && recCal === "lunar" && (freq === "monthly" || freq === "yearly");
  const lunarPeek = useMemo(() => {
    if (!showPeek || todayUTC == null) return [];
    const win = {
      starts_at: solarDate ? `${solarDate}T00:00:00Z` : null,
      recurrence_until: until ? `${until}T00:00:00Z` : null,
    };
    return nextHits(recurrence, todayUTC, win, 3, freq === "yearly" ? 1150 : 130);
  }, [showPeek, freq, recurrence, todayUTC, solarDate, until]);

  // 반복이면 startsAt 은 '첫 회' 날짜다. 비워 두면 예전부터 있던 것으로 본다.
  const startsAt = repeat ? (solarDate ? `${solarDate}T${time}` : "") : evValues.startsAt;
  const untilMax = plusYears(solarDate || ymd(new Date()), isEdit ? 2 : 1);

  return (
    <form action={formAction} className="adm-form ev-form">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      {/* 서버로 전달될 최종 값 */}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="recurrence" value={recurrence} />
      <input type="hidden" name="recurrenceUntil" value={repeat ? until : ""} />
      <input type="hidden" name="startsAt" value={startsAt} />
      <input type="hidden" name="whenText" value={whenText} />

      <div className="ev-grid">
        <div className="adm-field ev-span">
          <span>구분</span>
          <div className="ev-radios">
            <label className={`ev-radio${kind === "event" ? " on" : ""}`}>
              <input type="radio" name="_kind" checked={kind === "event"}
                onChange={() => { setKind("event"); if (!isEdit) setRepeat(false); }} /> 행사
            </label>
            <label className={`ev-radio${kind === "regular" ? " on" : ""}`}>
              <input type="radio" name="_kind" checked={kind === "regular"}
                onChange={() => { setKind("regular"); if (!isEdit) setRepeat(true); }} /> 법회
            </label>
          </div>
        </div>

        <label className="adm-field ev-span">
          <span>제목</span>
          <input name="title" defaultValue={initial.title ?? ""} maxLength={200} required />
        </label>

        <label className="adm-check-row ev-span">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
          <span>
            반복 일정
            <em className="ev-hint">
              {kind === "regular"
                ? "정기법회는 보통 반복입니다. 특별법회처럼 하루짜리면 해제하세요."
                : "매주·매월 되풀이되는 행사면 켜세요."}
            </em>
          </span>
        </label>

        {repeat ? (
          <>
            <div className="adm-field ev-span">
              <span>반복 주기</span>
              <div className="ev-radios">
                {[["daily", "매일"], ["weekly", "매주"], ["monthly", "매월"], ["yearly", "매년"]].map(([v, l]) => (
                  <label key={v} className={`ev-radio${freq === v ? " on" : ""}`}>
                    <input type="radio" name="_freq" checked={freq === v} onChange={() => setFreq(v)} /> {l}
                  </label>
                ))}
              </div>
            </div>

            {/* 날짜 기준은 매월·매년에만 묻는다. 매일은 어느 달력이든 같은 말이고,
                음력에는 요일이 없어 매주에 물으면 답할 수 없는 질문이 된다. */}
            {(freq === "monthly" || freq === "yearly") && (
              <div className="adm-field ev-span">
                <span>날짜 기준</span>
                <div className="ev-radios">
                  {[["solar", "양력"], ["lunar", "음력"]].map(([v, l]) => (
                    <label key={v} className={`ev-radio${recCal === v ? " on" : ""}`}>
                      <input type="radio" name="_recCal" checked={recCal === v}
                        onChange={() => pickRecCal(v)} /> {l}
                    </label>
                  ))}
                </div>
                <em className="adm-hint">
                  {recCal !== "lunar"
                    ? "고른 날짜를 양력 그대로 씁니다."
                    : freq === "monthly"
                      ? "초하루(1일)·보름(15일)·지장재일(18일)처럼 음력 날짜로 되풀이되는 법회입니다. 윤달에도 그 날짜에 봉행합니다."
                      : "부처님오신날(4월 8일)·백중(7월 15일)처럼 해마다 오는 음력 법회입니다. 윤달이 든 해에도 평달에 한 번만 잡습니다."}
                </em>
              </div>
            )}

            {freq === "weekly" && (
              <label className="adm-field">
                <span>요일</span>
                <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                  {WEEK.map((w, i) => <option key={i} value={i}>{w}요일</option>)}
                </select>
              </label>
            )}
            {/* 숫자 입력이 아니라 목록에서 고르게 한다. 직접 치게 하면 지우는 도중의
                빈 칸을 다뤄야 하는데(빈 칸을 곧바로 1로 되돌리면 15를 8로 고치려다
                18이 된다), 고를 수 있는 값이 서른 남짓이라 목록이 더 빠르고 애초에
                범위 밖을 만들 수 없다. */}
            {freq === "monthly" && (
              <label className="adm-field">
                <span>{recCal === "lunar" ? "음력" : "양력"} 매월 날짜 (일)</span>
                <select value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))}>
                  {Array.from({ length: monthMaxDay }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
              </label>
            )}
            {freq === "yearly" && (
              <div className="adm-field">
                <span>{recCal === "lunar" ? "음력" : "양력"} 매년 날짜 (월·일)</span>
                <div className="ev-lunar-row">
                  <select value={yearMonth} onChange={(e) => pickYearMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                  {/* 일 목록은 고른 달에 맞춘다. 2월에 31일을 고를 수 있으면 어느 해에도
                      오지 않는 규칙이 만들어진다(2월 29일은 윤년에 실제로 온다). */}
                  <select value={yearDay} onChange={(e) => setYearDay(Number(e.target.value))}>
                    {Array.from({ length: yearMaxDay }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <TimeField value={time} onChange={setTime} />

            {/* 음력은 고른 값만 봐서는 언제인지 알 수 없다. 저장하기 전에 양력으로
                환산해 보여 준다(판정은 달력과 같은 recMatches 를 쓴다). */}
            {/* 미리보기가 비어도 칸을 지우지 않는다. 한 건도 안 잡히는 것이야말로
                알려야 할 일인데, 칸째로 사라지면 화면이 아무 말도 하지 않는다. */}
            {showPeek && (
              <div className="adm-field ev-span">
                <span>다가오는 날짜 (양력 환산)</span>
                <div className="ev-prev">
                  {todayUTC == null
                    ? "계산 중…"
                    : lunarPeek.length > 0
                      ? lunarPeek.join("  ·  ")
                      : "이 기간 안에 해당하는 날이 없습니다. 시작일·종료일을 확인하세요."}
                </div>
                {(freq === "monthly" ? monthDay : yearDay) === 30 && (
                  <em className="adm-hint">
                    {freq === "monthly"
                      ? "음력 30일은 작은 달(29일까지)에 없어 그 달은 건너뜁니다. 위 간격으로 확인하세요."
                      : "음력 30일은 작은 달에 없습니다. 그 해 그 달이 작은 달이면 한 해를 통째로 건너뜁니다."}
                  </em>
                )}
              </div>
            )}

            {/* 시작·종료일은 규칙이 음력이어도 늘 양력이다. 이 둘은 '언제부터 언제까지'
                라는 기간의 양 끝일 뿐 법회 날짜가 아니어서, 음력으로 받으면 규칙의
                음력 날짜와 섞여 읽힌다. 라벨에 양력이라고 박아 둔다. */}
            <label className="adm-field">
              <span>시작일 (양력, 비우면 제한 없음)</span>
              <input type="date" value={solarDate} onChange={(e) => setSolarDate(e.target.value)} />
            </label>

            <div className="adm-field">
              <span>종료일 (양력, 최대 {isEdit ? "2" : "1"}년 뒤)</span>
              <div className="ev-until-row">
                <input type="date" value={until} max={untilMax}
                  onChange={(e) => setUntil(e.target.value)} />
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const base = until || solarDate || ymd(new Date());
                    const next = plusYears(base, 1);
                    setUntil(next > untilMax ? untilMax : next);
                  }}>
                  1년 연장
                </button>
                {until && (
                  <button type="button" className="adm-link-btn" onClick={() => setUntil("")}>지우기</button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="adm-field ev-span">
              <span>날짜 기준</span>
              <div className="ev-radios">
                <label className={`ev-radio${calType === "solar" ? " on" : ""}`}>
                  <input type="radio" name="_cal" checked={calType === "solar"} onChange={() => setCalType("solar")} /> 양력
                </label>
                <label className={`ev-radio${calType === "lunar" ? " on" : ""}`}>
                  <input type="radio" name="_cal" checked={calType === "lunar"} onChange={() => setCalType("lunar")} /> 음력
                </label>
              </div>
            </div>

            {calType === "solar" ? (
              <label className="adm-field">
                <span>양력 날짜</span>
                {/* 반복이 아니면 날짜가 있어야 한다. 없으면 달력에 나오지 않는다.
                    서버도 같은 조건으로 거절한다(actions.js hasWhen) — 이 required 는
                    거기까지 가기 전에 알려 주기 위한 것이다. */}
                <input type="date" required value={solarDate} onChange={(e) => setSolarDate(e.target.value)} />
              </label>
            ) : (
              <div className="adm-field">
                <span>음력 (연·월·일)</span>
                <div className="ev-lunar-row">
                  <select value={lunarYear} onChange={(e) => setLunarYear(Number(e.target.value))}>
                    {[2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}년</option>)}
                  </select>
                  <select value={lunarMonth} onChange={(e) => setLunarMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
                  </select>
                  <select value={lunarDay} onChange={(e) => setLunarDay(Number(e.target.value))}>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}일</option>)}
                  </select>
                </div>
              </div>
            )}

            <TimeField value={time} onChange={setTime} />
          </>
        )}

        <div className="adm-field ev-span">
          <span>표시 미리보기</span>
          <div className="ev-prev">{whenText || "날짜를 선택하세요."}</div>
        </div>

        <label className="adm-field ev-span">
          <span>설명</span>
          <textarea name="description" defaultValue={initial.description ?? ""} rows={3} />
        </label>

        <label className="adm-field">
          <span>정렬 순서 (작을수록 먼저)</span>
          <input name="sortOrder" type="number" defaultValue={initial.sort_order ?? 0} min={0} max={9999} />
        </label>
      </div>

      <div className="adm-form-actions">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/events" className="btn btn-ghost">취소</Link>
      </div>
    </form>
  );
}
