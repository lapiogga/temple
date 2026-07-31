"use client";

import { to12h, to24h } from "@/lib/recurrence";

// 시각 입력 — 오전/오후 라디오 + 시·분 직접 입력.
//
// 예전에는 <input type="time"> 이었다. 브라우저마다 생김새가 다르고, 크롬은
// 시/분/AM·PM 을 각각 눌러 스피너로 올려야 해서 마우스 없이는 답답하다.
// 여기서는 숫자만 치면 되고 오전/오후는 눌러서 고른다.
//
// 값은 24시간 "HH:MM" 으로 부모가 들고 있다 — 저장 형식이 그것이고,
// 화면 표기만 12시간제다.
export default function TimeField({ label = "시간", value, onChange }) {
  const { ampm, h12, mm } = to12h(value);
  const set = (a, h, m) => onChange(to24h(a, h, m));

  return (
    <div className="adm-field">
      <span>{label}</span>
      <div className="ev-time-row">
        <div className="ev-radios">
          <label className={`ev-radio${ampm === "am" ? " on" : ""}`}>
            <input type="radio" checked={ampm === "am"} onChange={() => set("am", h12, mm)} /> 오전
          </label>
          <label className={`ev-radio${ampm === "pm" ? " on" : ""}`}>
            <input type="radio" checked={ampm === "pm"} onChange={() => set("pm", h12, mm)} /> 오후
          </label>
        </div>
        <span className="ev-time-nums">
          <input
            type="number" min={1} max={12} value={h12} aria-label="시"
            onChange={(e) => {
              // 비우는 중간 상태를 막지 않는다. 범위를 벗어난 값만 되돌린다.
              const v = e.target.value === "" ? 12 : Number(e.target.value);
              set(ampm, Math.min(12, Math.max(1, v)), mm);
            }}
          />
          <b>시</b>
          <input
            type="number" min={0} max={59} step={5} value={String(mm).padStart(2, "0")} aria-label="분"
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              set(ampm, h12, Math.min(59, Math.max(0, v)));
            }}
          />
          <b>분</b>
        </span>
      </div>
    </div>
  );
}
