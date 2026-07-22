// 공개 화면 공용 포맷 유틸.

// 게시일 → "2026. 07. 20."
export function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}. ${mm}. ${dd}.`;
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
