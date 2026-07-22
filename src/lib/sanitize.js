// 리치 텍스트(에디터 HTML) 기본 정화. 위험 태그·이벤트 핸들러·javascript: 스킴 제거.
// 에디터(Quill) 출력은 제한된 태그만 생성하므로, 여기에 방어선을 더한다.
export function sanitizeHtml(html) {
  if (typeof html !== "string") return "";
  return html
    // 스크립트성/구조 태그 블록 제거
    .replace(/<\s*(script|style|iframe|object|embed|form|meta|link|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    // 자기닫힘/미닫힘 위험 태그 제거
    .replace(/<\s*(script|style|iframe|object|embed|form|meta|link|base)\b[^>]*\/?>/gi, "")
    // on* 이벤트 핸들러 제거
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // href/src 의 javascript: 스킴 무력화 (data:/http(s): 는 허용)
    .replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '$1="#"');
}

// 태그 제거 후 순수 텍스트(발췌·길이검증용)
export function stripTags(html) {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
