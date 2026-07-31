"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { solarToLunar, lunarToSolar } from "@/lib/lunar";
import { WEEK, parseRec, timeLabel } from "@/lib/recurrence";
import TimeField from "./TimeField";

const p2 = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

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
  const ir = parseRec(initial.recurrence) ?? {};
  const [repeat, setRepeat] = useState(
    isEdit ? !!(initial.recurrence || "").trim() : (initial.kind ?? "event") === "regular"
  );

  const [freq, setFreq] = useState(ir.type === "daily" || ir.type === "monthly" ? ir.type : "weekly");
  const [weekday, setWeekday] = useState(ir.weekday ?? 0);
  const [monthDay, setMonthDay] = useState(ir.day ?? ir.lday ?? 1);
  const [time, setTime] = useState(ir.time ?? "10:00");

  // 날짜(일회성) / 반복 시작일
  const initStarts = initial.starts_at ? new Date(initial.starts_at) : null;
  const [calType, setCalType] = useState("solar");
  const [solarDate, setSolarDate] = useState(initStarts ? ymd(initStarts) : "");
  const [lunarYear, setLunarYear] = useState(initStarts ? initStarts.getFullYear() : 2026);
  const [lunarMonth, setLunarMonth] = useState(1);
  const [lunarDay, setLunarDay] = useState(1);

  const [until, setUntil] = useState(
    initial.recurrence_until ? ymd(new Date(initial.recurrence_until)) : ""
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

  const recurrence = useMemo(() => {
    if (!repeat) return "";
    if (freq === "daily") return `daily:${time}`;
    if (freq === "weekly") return `weekly:${weekday}:${time}`;
    return `monthly:${monthDay}:${time}`;
  }, [repeat, freq, weekday, monthDay, time]);

  const whenText = useMemo(() => {
    const t = timeLabel(time);
    if (!repeat) {
      if (!evValues.startsAt) return "";
      return `${evValues.dateOnly} ${t}${evValues.conv ? ` (${evValues.conv})` : ""}`;
    }
    const head =
      freq === "daily" ? "매일" : freq === "weekly" ? `매주 ${WEEK[weekday]}요일` : `매월 ${monthDay}일`;
    return `${head} ${t}${until ? ` (~${until})` : ""}`;
  }, [repeat, freq, weekday, monthDay, time, until, evValues]);

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
                {[["daily", "매일"], ["weekly", "매주"], ["monthly", "매월"]].map(([v, l]) => (
                  <label key={v} className={`ev-radio${freq === v ? " on" : ""}`}>
                    <input type="radio" name="_freq" checked={freq === v} onChange={() => setFreq(v)} /> {l}
                  </label>
                ))}
              </div>
            </div>

            {freq === "weekly" && (
              <label className="adm-field">
                <span>요일</span>
                <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                  {WEEK.map((w, i) => <option key={i} value={i}>{w}요일</option>)}
                </select>
              </label>
            )}
            {freq === "monthly" && (
              <label className="adm-field">
                <span>매월 날짜 (일)</span>
                <input type="number" min={1} max={31} value={monthDay}
                  onChange={(e) => setMonthDay(Number(e.target.value))} />
              </label>
            )}

            <TimeField value={time} onChange={setTime} />

            <label className="adm-field">
              <span>시작일 (비우면 제한 없음)</span>
              <input type="date" value={solarDate} onChange={(e) => setSolarDate(e.target.value)} />
            </label>

            <div className="adm-field">
              <span>종료일 (최대 {isEdit ? "2" : "1"}년 뒤)</span>
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
                <input type="date" value={solarDate} onChange={(e) => setSolarDate(e.target.value)} />
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
