import sanitizeHtmlLib from "sanitize-html";

// 파서 기반 allowlist 정화(기존 정규식 블랙리스트 대체 — 우회 가능하던 XSS 차단).
// 리치에디터(Quill)가 생성하는 서식 태그만 허용하고, 나머지·위험 속성/스킴은 제거한다.
const ALIGN = ["ql-align-center", "ql-align-right", "ql-align-justify"];

const OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "del",
    "h1", "h2", "h3", "ul", "ol", "li", "a", "blockquote", "span",
    // 본문 이미지. 업로드는 서버 액션에서 권한을 확인한 뒤 /uploads/ 에만 쓴다.
    // src 스킴 제한을 함께 걸어 data: · javascript: 로 들어오는 것을 막는다.
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    p: ["class"], h1: ["class"], h2: ["class"], h3: ["class"],
    li: ["class"], blockquote: ["class"], span: ["class"],
    img: ["src", "alt", "class"],
  },
  allowedClasses: {
    p: ALIGN, h1: ALIGN, h2: ALIGN, h3: ALIGN, li: ALIGN, blockquote: ALIGN, span: ALIGN,
    img: ALIGN,
  },
  allowedSchemes: ["http", "https", "mailto"],
  // src 를 포함해야 <img src="data:…"> 가 걸러진다.
  // 상대경로(/uploads/…)는 스킴이 없어 그대로 통과한다.
  allowedSchemesAppliedToAttributes: ["href", "src"],
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
  },
  disallowedTagsMode: "discard",
};

export function sanitizeHtml(html) {
  if (typeof html !== "string") return "";
  return sanitizeHtmlLib(html, OPTIONS);
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
