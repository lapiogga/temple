// 반복 규칙 파싱·판정. 관리자 폼과 달력이 같은 규칙을 봐야 하므로 여기 모은다.
//
// 규칙 문자열
//   daily:HH:MM          매일
//   weekly:N:HH:MM       매주 N요일 (0=일)
//   monthly:D:HH:MM      매월 D일
//   lunar:D              (구형) 음력 D일 — 시간 없음. 읽기만 지원한다.
//
// 기간은 규칙에 넣지 않는다. events.starts_at(첫 회) ~ events.recurrence_until
// (종료일) 이 정한다. 규칙 안에 기간까지 넣으면 문자열이 길어지고, 종료일만
// 늘리는 '1년 연장' 을 할 때 규칙을 통째로 다시 써야 한다.

export const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export function parseRec(rec) {
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

// 규칙이 그 날에 걸리는가(기간은 보지 않는다).
export function recMatches(p, weekday, lunarDay, solarDay) {
  if (!p) return false;
  if (p.type === "daily") return true;
  if (p.type === "weekly") return p.weekday === weekday;
  if (p.type === "monthly") return p.day === solarDay;
  if (p.type === "lunar") return lunarDay != null && p.lday === lunarDay;
  return false;
}

// 그 날이 반복 기간 안인가.
// 시작일이 없으면 "예전부터" 로 본다(종료일만 지정한 기존 데이터 호환).
// 종료일이 없으면 "끝없이" 로 본다(종료일을 도입하기 전에 등록한 정기법회).
//
// 세 값 모두 UTC 로 꺼내 비교한다. starts_at 은 관리자가 친 벽시계가 UTC 라벨을
// 달고 저장된 값이고 recurrence_until 은 DATE 라 UTC 자정으로 들어온다
// (lib/format.js 머리말). 로컬 게터를 쓰면 이 함수가 도는 곳의 TZ 에 따라
// 시작·종료 당일이 하루씩 어긋난다. 지금 서버가 UTC 라 결과는 같다.
export function inRecurrenceWindow(ev, y, m, d) {
  const day = Date.UTC(y, m - 1, d);
  if (ev.starts_at) {
    const s = new Date(ev.starts_at);
    if (day < Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())) return false;
  }
  if (ev.recurrence_until) {
    const u = new Date(ev.recurrence_until);
    if (day > Date.UTC(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate())) return false;
  }
  return true;
}

// "HH:MM" → 분(정렬용). 시간 없으면 맨 뒤.
export function toMin(t) {
  if (!t) return 100000;
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

// ── 시간 표기 ────────────────────────────────────────────────
// 24시간 "HH:MM" ↔ { ampm, h12, mm }. 관리자 폼이 오전/오후 + 숫자 입력이라
// 두 표기를 오간다.
export function to12h(hhmm) {
  const [h, m] = (hhmm || "10:00").split(":").map(Number);
  const hh = Number.isFinite(h) ? h : 10;
  const mm = Number.isFinite(m) ? m : 0;
  return { ampm: hh < 12 ? "am" : "pm", h12: hh % 12 === 0 ? 12 : hh % 12, mm };
}

export function to24h(ampm, h12, mm) {
  let h = Number(h12) % 12;
  if (ampm === "pm") h += 12;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(Math.min(59, Math.max(0, Number(mm) || 0)))}`;
}

// 사람이 읽는 시각 — "오전 10:00"
export function timeLabel(hhmm) {
  const { ampm, h12, mm } = to12h(hhmm);
  return `${ampm === "am" ? "오전" : "오후"} ${h12}:${String(mm).padStart(2, "0")}`;
}
