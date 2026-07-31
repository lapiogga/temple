// 공개 화면 공용 포맷 유틸.
//
// 이 저장소의 시각 값은 두 종류이고 다루는 법이 다르다. 섞어 쓰면 한쪽이 반드시 어긋난다.
//
// (A) 순간(instant) — created_at · published_at · answered_at 처럼 now() 로 찍힌 값.
//     실제로 일어난 시점이므로 보는 사람의 시간대, 즉 KST 로 표시해야 한다.
//     서버 TZ 가 UTC 라 getMonth()/getDate() 를 그냥 쓰면 KST 00:00~09:00 에 올린 글이
//     하루 앞당겨 보인다 — 2026-08-01 05:00 KST 저장분은 2026-07-31T20:00Z 라
//     "2026. 07. 31." 로 표시된다. formatDate/formatDateCompact 가 이 경우다.
//
// (B) 벽시계(wall clock) — events.starts_at · events.recurrence_until.
//     관리자가 친 "2026-08-04 18:00" 을 시간대 없는 문자열로 조립해 서버에서
//     new Date() 로 파싱하므로 18:00+00 으로 저장된다(실측: id=3 → 2026-08-04T18:00Z,
//     when_text 는 "2026-08-04 18:00"). 즉 순간이 아니라 벽시계에 UTC 라벨이
//     붙어 있는 것이라, KST 로 읽으면 9시간 밀려 오전 3시가 된다.
//     친 그대로 보이려면 UTC 로 꺼내야 한다 — formatWallDate/formatWallDateTime.
//
//     지금까지 맞아 보였던 것은 서버 TZ 가 UTC 여서 쓰기와 읽기가 같은 착각을
//     공유했기 때문이다. systemd 에 TZ 를 넣거나 서버를 옮기는 순간 전부 밀린다.
//     그래서 (B) 는 주변 TZ 에 기대지 않고 UTC 로 못 박는다. 지금 서버가 UTC 라
//     이 변경은 기존 행의 표시를 바꾸지 않는다(데이터 이전이 필요 없다).
//
//     근본 해법은 저장을 KST 기준으로 옮기면서 기존 행도 함께 9시간 미는 것인데,
//     그건 콘텐츠 이관과 같이 봐야 할 별건이다(로드맵 §2-C).

const KST = "Asia/Seoul";

// Intl 로 지정한 시간대의 연·월·일·시·분을 꺼낸다.
// getMonth() 류는 그 코드가 도는 곳의 TZ 를 타므로, 시간대를 말로 적어 고정한다.
function partsIn(value, timeZone) {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23", // hour12:false 는 자정을 "24" 로 주는 환경이 있다
  });
  const out = {};
  for (const p of fmt.formatToParts(d)) out[p.type] = p.value;
  return out;
}

// ── (A) 순간 — KST 로 표시 ────────────────────────────────────

// 게시일 → "2026. 07. 20."
export function formatDate(value) {
  const p = partsIn(value, KST);
  return p ? `${p.year}. ${p.month}. ${p.day}.` : "";
}

// 관리자 표에서 쓰는 짧은 형식 → "2026.07.20"
export function formatDateCompact(value) {
  const p = partsIn(value, KST);
  return p ? `${p.year}.${p.month}.${p.day}` : "";
}

// ── (B) 벽시계 — UTC 로 고정해 친 그대로 ──────────────────────

// 행사 날짜 → "2026. 08. 04."
export function formatWallDate(value) {
  const p = partsIn(value, "UTC");
  return p ? `${p.year}. ${p.month}. ${p.day}.` : "";
}

// 관리자 표에서 쓰는 짧은 형식 → "1964.04.28"
export function formatWallDateCompact(value) {
  const p = partsIn(value, "UTC");
  return p ? `${p.year}.${p.month}.${p.day}` : "";
}

// 행사 일시 → "2026. 08. 04. 18:00"  (자정이면 시각을 떼고 날짜만)
export function formatWallDateTime(value) {
  const p = partsIn(value, "UTC");
  if (!p) return "";
  const midnight = p.hour === "00" && p.minute === "00";
  return `${p.year}. ${p.month}. ${p.day}.${midnight ? "" : ` ${p.hour}:${p.minute}`}`;
}

// 행사 일시(관리자 목록) → "2026. 08. 04. 18:00"  (자정도 시각을 붙인다)
export function formatWallDateTimeFull(value) {
  const p = partsIn(value, "UTC");
  return p ? `${p.year}. ${p.month}. ${p.day}. ${p.hour}:${p.minute}` : "";
}

// 벽시계 값의 '일(日)' 만 — 달력이 날짜 칸을 고를 때 쓴다.
export function wallDayOfMonth(value) {
  const p = partsIn(value, "UTC");
  return p ? Number(p.day) : null;
}

// 벽시계 값의 "HH:MM" — 자정이면 null(시각 미지정으로 본다).
export function wallTime(value) {
  const p = partsIn(value, "UTC");
  if (!p) return null;
  return p.hour === "00" && p.minute === "00" ? null : `${p.hour}:${p.minute}`;
}

// 행사 날짜(홈 목록) → "08.04"
export function formatWallMonthDay(value) {
  const p = partsIn(value, "UTC");
  return p ? `${p.month}.${p.day}` : "";
}

// ── 오늘 ──────────────────────────────────────────────────────

// KST 기준 오늘. 달력의 '이번 달'·'오늘' 표시가 이걸 써야 한다.
// new Date().getMonth() 는 서버 TZ(UTC)를 타므로 KST 00:00~09:00 사이에는
// 아직 어제로 나오고, 매월 1일 그 시간대에는 달력이 지난달로 열린다.
export function kstToday() {
  const p = partsIn(new Date(), KST);
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day) };
}

// 본문 발췌: 공백 정규화 후 지정 길이로 자르고 말줄임.
export function excerpt(text, max = 100) {
  const s = (text ?? "")
    .replace(/<[^>]*>/g, " ") // HTML 태그 제거(리치 본문 대응)
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max) + "…" : s;
}
