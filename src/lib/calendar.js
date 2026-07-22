// 캘린더 순수 헬퍼(날짜 계산). DB/React 의존 없음.

// 월 매트릭스(주 x 7일, 일요일 시작). 빈칸은 null.
// year: 연도, month: 1~12
export function monthMatrix(year, month) {
  const first = new Date(year, month - 1, 1);
  const startWeekday = first.getDay(); // 0=일 ~ 6=토
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// 이전/다음 달 계산
export function ymNav(year, month) {
  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  return { prev, next };
}

// "2026-07" 파싱. 실패 시 null.
export function parseYm(ym) {
  if (typeof ym !== "string") return null;
  const m = ym.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return { y, m: mo };
}

export function ymString(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}
