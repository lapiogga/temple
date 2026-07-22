"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { solarToLunar, lunarToSolar } from "@/lib/lunar";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const p2 = (n) => String(n).padStart(2, "0");

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

// 기존 recurrence 문자열 → 폼 상태(수정 화면)
function parseInitialRecurrence(rec) {
  const r = (rec || "").trim();
  if (r.startsWith("daily:")) return { freq: "daily", time: r.slice(6) };
  if (r.startsWith("weekly:")) {
    const [, n, hh, mm] = r.split(":");
    return { freq: "weekly", weekday: Number(n) || 0, time: hh != null ? `${hh}:${mm}` : "10:00" };
  }
  if (r.startsWith("monthly:")) {
    const [, d, hh, mm] = r.split(":");
    return { freq: "monthly", monthDay: Number(d) || 1, time: hh != null ? `${hh}:${mm}` : "10:00" };
  }
  if (r.startsWith("lunar:")) return { freq: "monthly", monthDay: Number(r.slice(6)) || 1, time: "10:00" };
  return {};
}

export default function EventForm({ action, initial = {}, submitLabel = "저장" }) {
  const [state, formAction] = useFormState(action, {});

  const [kind, setKind] = useState(initial.kind ?? "event");

  // 법회(regular)
  const ir = parseInitialRecurrence(initial.recurrence);
  const [freq, setFreq] = useState(ir.freq ?? "weekly");
  const [weekday, setWeekday] = useState(ir.weekday ?? 0);
  const [monthDay, setMonthDay] = useState(ir.monthDay ?? 1);
  const [regTime, setRegTime] = useState(ir.time ?? "10:00");

  // 행사(event)
  const initStarts = initial.starts_at ? new Date(initial.starts_at) : null;
  const [calType, setCalType] = useState("solar");
  const [solarDate, setSolarDate] = useState(
    initStarts ? `${initStarts.getFullYear()}-${p2(initStarts.getMonth() + 1)}-${p2(initStarts.getDate())}` : ""
  );
  const [evTime, setEvTime] = useState(
    initStarts ? `${p2(initStarts.getHours())}:${p2(initStarts.getMinutes())}` : "10:00"
  );
  const [lunarYear, setLunarYear] = useState(initStarts ? initStarts.getFullYear() : 2026);
  const [lunarMonth, setLunarMonth] = useState(1);
  const [lunarDay, setLunarDay] = useState(1);

  // 법회 → recurrence + 표시문구
  const regValues = useMemo(() => {
    if (freq === "daily") return { recurrence: `daily:${regTime}`, whenText: `매일 ${regTime}` };
    if (freq === "weekly")
      return { recurrence: `weekly:${weekday}:${regTime}`, whenText: `매주 ${WEEK[weekday]}요일 ${regTime}` };
    return { recurrence: `monthly:${monthDay}:${regTime}`, whenText: `매월 ${monthDay}일 ${regTime}` };
  }, [freq, weekday, monthDay, regTime]);

  // 행사 → startsAt(양력) + 표시문구 + 환산
  const evValues = useMemo(() => {
    if (calType === "solar") {
      if (!solarDate) return { startsAt: "", whenText: "", conv: "" };
      const [Y, M, D] = solarDate.split("-").map(Number);
      const lun = solarToLunar(Y, M, D);
      const conv = lun ? `음력 ${lun.isLeap ? "윤" : ""}${lun.lMonth}.${lun.lDay}` : "";
      return { startsAt: `${solarDate}T${evTime}`, whenText: `${solarDate} ${evTime}${conv ? ` (${conv})` : ""}`, conv };
    }
    const sol = lunarToSolar(Number(lunarYear), Number(lunarMonth), Number(lunarDay));
    if (!sol) return { startsAt: "", whenText: "", conv: "환산할 수 없는 날짜입니다." };
    const sd = `${sol.year}-${p2(sol.month)}-${p2(sol.day)}`;
    return { startsAt: `${sd}T${evTime}`, whenText: `음력 ${lunarMonth}.${lunarDay} (양력 ${sd}) ${evTime}`, conv: `양력 ${sd}` };
  }, [calType, solarDate, evTime, lunarYear, lunarMonth, lunarDay]);

  const recurrence = kind === "regular" ? regValues.recurrence : "";
  const startsAt = kind === "event" ? evValues.startsAt : "";
  const whenText = kind === "regular" ? regValues.whenText : evValues.whenText;

  return (
    <form action={formAction} className="adm-form ev-form">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      {/* 서버로 전달될 최종 값 */}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="recurrence" value={recurrence} />
      <input type="hidden" name="startsAt" value={startsAt} />
      <input type="hidden" name="whenText" value={whenText} />

      <div className="ev-grid">
        <div className="adm-field ev-span">
          <span>구분</span>
          <div className="ev-radios">
            <label className={`ev-radio${kind === "event" ? " on" : ""}`}>
              <input type="radio" name="_kind" checked={kind === "event"} onChange={() => setKind("event")} /> 행사
            </label>
            <label className={`ev-radio${kind === "regular" ? " on" : ""}`}>
              <input type="radio" name="_kind" checked={kind === "regular"} onChange={() => setKind("regular")} /> 법회
            </label>
          </div>
        </div>

        <label className="adm-field ev-span">
          <span>제목</span>
          <input name="title" defaultValue={initial.title ?? ""} maxLength={200} required />
        </label>

        {kind === "regular" ? (
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
                <input type="number" min={1} max={31} value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))} />
              </label>
            )}
            <label className="adm-field">
              <span>시간</span>
              <input type="time" value={regTime} onChange={(e) => setRegTime(e.target.value)} />
            </label>

            <div className="adm-field ev-span">
              <span>표시 미리보기</span>
              <div className="ev-prev">{regValues.whenText}</div>
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
            <label className="adm-field">
              <span>시간</span>
              <input type="time" value={evTime} onChange={(e) => setEvTime(e.target.value)} />
            </label>

            <div className="adm-field ev-span">
              <span>환산 · 미리보기</span>
              <div className="ev-prev">{evValues.startsAt ? evValues.whenText : "날짜를 선택하세요."}</div>
            </div>
          </>
        )}

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
