import solarlunarPkg from "solarlunar";

// solarlunar 는 { default: {...} } 형태로 내보내므로 interop 처리.
const solarlunar = solarlunarPkg.default || solarlunarPkg;

// 양력(year, 1~12월, day) → 음력 { lMonth, lDay, isLeap }. 범위 밖이면 null.
export function solarToLunar(year, month, day) {
  const r = solarlunar.solar2lunar(year, month, day);
  if (!r || r === -1) return null;
  return { lMonth: r.lMonth, lDay: r.lDay, isLeap: !!r.isLeap };
}

// 짧은 음력 라벨: "6.9" (윤달이면 "윤6.9")
export function lunarLabel(year, month, day) {
  const r = solarToLunar(year, month, day);
  if (!r) return "";
  return `${r.isLeap ? "윤" : ""}${r.lMonth}.${r.lDay}`;
}
