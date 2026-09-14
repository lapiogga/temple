// 반복 규칙 파싱·판정. 관리자 폼과 달력이 같은 규칙을 봐야 하므로 여기 모은다.
//
// 규칙 문자열
//   daily:HH:MM            매일
//   weekly:N:HH:MM         매주 N요일 (0=일)
//   monthly:D:HH:MM        양력 매월 D일
//   yearly:M:D:HH:MM       양력 매년 M월 D일
//   lunar:D:HH:MM          음력 매월 D일    — 초하루·보름·지장재일 같은 재일(齋日)
//   lunaryear:M:D:HH:MM    음력 매년 M월 D일 — 부처님오신날(4.8)·백중(7.15) 같은 연중 법회
//   lunar:D                (구형) 시각 없는 음력 매월. 읽기만 하고 새로 만들지는 않는다.
//
// 절 일정은 음력이 기준인 것이 많은데 예전에는 음력 규칙을 *읽기만* 할 수 있었다.
// 관리자 폼에 만들 수단이 없어 법회를 양력으로 등록하고 해마다 손으로 옮겨야 했다.
// 그래서 음력에도 시각 자리를 주고(lunar:D:HH:MM) 연 단위(lunaryear)를 추가했다.
// 구형 `lunar:D` 는 시각이 없던 형식이라 읽는 쪽에서 계속 받아 준다.
//
// 기간은 규칙에 넣지 않는다. events.starts_at(첫 회) ~ events.recurrence_until
// (종료일) 이 정한다. 규칙 안에 기간까지 넣으면 문자열이 길어지고, 종료일만
// 늘리는 '1년 연장' 을 할 때 규칙을 통째로 다시 써야 한다.

export const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 규칙 조각을 숫자로. 빈 칸·문자는 null 로 떨어뜨려 parseRec 이 통째로 null 을
// 돌려주게 한다 — 예전에는 Number("") = 0 이 그대로 남아 `monthly:0` 같은,
// 저장은 되는데 달력에 영영 걸리지 않는 규칙이 만들어졌다.
function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

// "HH","MM" 두 조각 → "HH:MM". 둘 중 하나라도 없으면 null(= 시각 없음).
function time2(hh, mm) {
  return hh != null && hh !== "" && mm != null && mm !== "" ? `${hh}:${mm}` : null;
}

// 주기마다 앞에 오는 '날짜' 자리 수. 그 뒤에 시각 두 자리(HH, MM)가 붙거나,
// 구형처럼 아예 없거나 — 둘뿐이다.
//
// 자리 수를 세지 않고 필요한 칸만 꺼내 쓰면 `lunar:1:10:00:99` 처럼 꼬리가 붙은 값이
// 조용히 통과한다. 지금 그런 값을 만들 길은 없지만, 통과시켜 두면 나중에 형식을 늘릴
// 때 옛 값과 구분되지 않아 어느 쪽으로 읽어야 할지 알 수 없게 된다.
const REC_ARITY = { daily: 0, weekly: 1, monthly: 1, lunar: 1, yearly: 2, lunaryear: 2 };

export function parseRec(rec) {
  const [head, ...a] = (rec || "").trim().split(":");
  const arity = REC_ARITY[head];
  if (arity === undefined) return null;
  // 시각이 있는 형식(arity + 2)이거나, 없는 구형(arity)이거나.
  if (a.length !== arity && a.length !== arity + 2) return null;

  const time = a.length === arity ? null : time2(a[arity], a[arity + 1]);
  const n = a.slice(0, arity).map(num);
  if (n.some((v) => v === null)) return null;

  switch (head) {
    case "daily": return { type: "daily", time };
    case "weekly": return { type: "weekly", weekday: n[0], time };
    case "monthly": return { type: "monthly", day: n[0], time };
    // 구형 `lunar:D` 가 여기로 온다 — 시각만 null 이고 날짜는 그대로다.
    case "lunar": return { type: "lunar", lday: n[0], time };
    case "yearly": return { type: "yearly", month: n[0], day: n[1], time };
    case "lunaryear": return { type: "lunaryear", lmonth: n[0], lday: n[1], time };
    default: return null;
  }
}

// 규칙이 그 날에 걸리는가(기간은 보지 않는다).
//
// ctx = { weekday, month, day, lunar } — lunar 는 lib/lunar 의 solarToLunar() 결과
// ({ lMonth, lDay, isLeap }) 또는 null(환산 범위 밖).
//
// 인자를 객체로 받는 이유: 음력 매년까지 보려면 음력 '월' 과 윤달 여부가 더 필요한데,
// 자리 인자로 늘리면 호출부가 `recMatches(p, wd, lm, ld, leap, m, d)` 처럼 되어
// 어느 자리가 양력 월인지 음력 월인지 읽어서는 알 수 없게 된다.
//
// 윤달 기준이 매월과 매년에서 다르다.
//  · 음력 매월(재일)은 윤달에도 초하루·보름이 온다. 윤5월 1일도 초하루법회 날이므로
//    isLeap 을 보지 않는다.
//  · 음력 매년은 그 해 한 번이다. 윤4월이 든 해에 부처님오신날을 4월 8일과 윤4월 8일
//    두 번 잡지 않는다 — 평달만 본다(봉행 관례).
export function recMatches(p, ctx) {
  if (!p || !ctx) return false;
  const { weekday, month, day, lunar } = ctx;
  switch (p.type) {
    case "daily":
      return true;
    case "weekly":
      return p.weekday === weekday;
    case "monthly":
      return p.day === day;
    case "yearly":
      return p.month === month && p.day === day;
    case "lunar":
      return !!lunar && p.lday === lunar.lDay;
    case "lunaryear":
      return !!lunar && !lunar.isLeap && p.lmonth === lunar.lMonth && p.lday === lunar.lDay;
    default:
      return false;
  }
}

// 규칙을 사람이 읽는 한 줄로 — "음력 매월 1일 오전 10:00".
//
// 관리자 폼의 미리보기와 DB 에 저장되는 when_text 가 같은 문장이어야 한다. 예전에는
// 폼이 상태 변수(freq·weekday·monthDay…)를 보고 따로 문장을 만들었는데, 그러면
// 규칙 문자열과 설명문이 각각 조립돼 한쪽만 고치면 조용히 어긋난다. 둘 다 규칙
// 문자열 하나에서 나오게 한다.
export function recLabel(p) {
  if (!p) return "";
  // 구형 음력 규칙에는 시각이 없다. 없는 시각을 지어 붙이지 않는다.
  const t = p.time ? ` ${timeLabel(p.time)}` : "";
  switch (p.type) {
    case "daily":
      return `매일${t}`;
    case "weekly":
      return `매주 ${WEEK[p.weekday] ?? "?"}요일${t}`;
    case "monthly":
      return `매월 ${p.day}일${t}`;
    case "yearly":
      return `매년 ${p.month}월 ${p.day}일${t}`;
    case "lunar":
      return `음력 매월 ${p.lday}일${t}`;
    case "lunaryear":
      return `음력 매년 ${p.lmonth}월 ${p.lday}일${t}`;
    default:
      return "";
  }
}

// 규칙이 저장해도 되는 형식인가. 서버(admin/events/actions.js)가 부른다.
//
// 형식을 정의하는 곳과 형식을 검사하는 곳이 갈라져 있으면 한쪽만 늘어난다 — 실제로
// 음력 매년을 넣을 때 여기 파서만 고치고 서버 검사를 잊으면 새 규칙이 전부 반려된다.
// 그래서 같은 파일에 둔다.
//
// 막으려는 것은 공격이라기보다 **조용한 실종**이다. 형식이 깨진 규칙은 저장은 되는데
// recMatches 가 영영 맞추지 못해 달력에 한 번도 뜨지 않는다. 등록한 사람은 올렸다고
// 믿고 신도는 볼 수 없다. 실제로 그런 값이 만들어진 적이 있다 — 예전 '매월 날짜'
// 입력은 칸을 비우면 Number("") = 0 이 그대로 `monthly:0:10:00` 이 됐다.
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const inRange = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

// 그 달에 있을 수 있는 최대 일수.
//
// 매년 규칙에서 월과 일을 따로 1~12 · 1~31 로만 보면 `yearly:2:31`(2월 31일)이 통과한다.
// 저장은 되는데 그런 날은 어느 해에도 오지 않아 달력에 한 번도 뜨지 않는다 — 이 파일이
// 막겠다고 적어 둔 '조용한 실종' 그대로다. 매월 규칙(`monthly:31`)은 31일이 있는 달에는
// 실제로 걸리므로 사정이 다르다. 여기서 거르는 것은 매년뿐이다.
//
// 2월을 29 로 두는 이유: 윤년에는 실제로 오는 날이다. 4년에 한 번 봉행하는 법회는
// 뜻이 통하지만 2월 31일은 뜻이 없다.
const SOLAR_MAX_DAY = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function maxDayOf(calType, month) {
  // 음력은 큰 달이 30일까지다(달마다 29·30 이 갈리지만 규칙은 달을 고르지 않는다).
  if (calType === "lunar") return 30;
  return SOLAR_MAX_DAY[month - 1] ?? 31;
}

export function recIsValid(raw) {
  if (raw === "" || raw == null) return true; // 반복 아님
  const p = parseRec(raw);
  if (!p) return false;
  // 시각을 비워 둘 수 있는 것은 구형 음력 규칙(lunar:D)뿐이다. 그 형식으로 등록된
  // 일정을 수정 화면에 열지 않고 지나갈 때 서버가 걷어차면 안 된다.
  if (p.time == null) {
    if (p.type !== "lunar") return false;
  } else if (!HHMM.test(p.time)) {
    return false;
  }
  switch (p.type) {
    case "daily": return true;
    case "weekly": return inRange(p.weekday, 0, 6);
    // 매월은 31 까지 받는다 — 31일이 없는 달은 건너뛸 뿐 나머지 달에는 실제로 걸린다.
    case "monthly": return inRange(p.day, 1, 31);
    // 매년은 월까지 정해지므로 그 달에 있을 수 있는 날인지까지 본다(maxDayOf 주석).
    case "yearly": return inRange(p.month, 1, 12) && inRange(p.day, 1, maxDayOf("solar", p.month));
    case "lunar": return inRange(p.lday, 1, 30);
    case "lunaryear": return inRange(p.lmonth, 1, 12) && inRange(p.lday, 1, 30);
    default: return false;
  }
}

// ── 규칙 문자열 ↔ 관리자 폼 상태 ────────────────────────────
// 규칙 문자열 하나에 '주기' 와 '양력/음력' 이 같이 들어 있다(monthly ↔ lunar,
// yearly ↔ lunaryear). 폼은 이 둘을 따로 고르게 하므로 열 때 풀고 저장할 때 합친다.
//
// 푸는 쪽과 합치는 쪽을 떨어뜨려 놓으면 수정 화면을 열어 저장하는 것만으로 규칙이
// 조용히 달라진다. 예전에 그 일이 실제로 났다 — 음력 규칙이 폼에서 "매주" 로 떨어져,
// 제목 하나 고치려고 열었다 저장하면 음력 법회가 `weekly:0`(매주 일요일)로 덮였다.
// 그때는 음력을 읽기 전용으로 묶어 두는 것으로 막았지만, 이제 음력도 만들 수 있으니
// 묶어 둘 수 없다. 대신 둘을 한자리에 두고 왕복이 제자리로 오는지 시험한다.
//
// formToRec 은 time 이 채워져 있다고 본다. 폼은 시각을 늘 들고 있다(없으면 starts_at,
// 그것도 없으면 10:00). 구형 `lunar:D` 는 시각이 없는데, 수정 화면을 열면 그 기본값이
// 채워져 시각 있는 새 형식으로 올라간다 — 없던 정보가 생기는 것이라 의도한 쪽이다.
export function recToForm(rec) {
  const f = { freq: "weekly", calType: "solar", weekday: 0, monthDay: 1, yearMonth: 1, yearDay: 1, time: null };
  const p = parseRec(rec);
  if (!p) return f;
  f.time = p.time;
  switch (p.type) {
    case "daily": f.freq = "daily"; break;
    case "weekly": f.freq = "weekly"; f.weekday = p.weekday; break;
    case "monthly": f.freq = "monthly"; f.monthDay = p.day; break;
    case "lunar": f.freq = "monthly"; f.calType = "lunar"; f.monthDay = p.lday; break;
    case "yearly": f.freq = "yearly"; f.yearMonth = p.month; f.yearDay = p.day; break;
    case "lunaryear": f.freq = "yearly"; f.calType = "lunar"; f.yearMonth = p.lmonth; f.yearDay = p.lday; break;
    default: break;
  }
  return f;
}

export function formToRec({ freq, calType, weekday, monthDay, yearMonth, yearDay, time }) {
  if (freq === "daily") return `daily:${time}`;
  if (freq === "weekly") return `weekly:${weekday}:${time}`;
  if (freq === "yearly") return `${calType === "lunar" ? "lunaryear" : "yearly"}:${yearMonth}:${yearDay}:${time}`;
  return `${calType === "lunar" ? "lunar" : "monthly"}:${monthDay}:${time}`;
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
