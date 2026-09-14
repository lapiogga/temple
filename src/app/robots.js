import { SITE } from "@/content/site";

// robots.txt — public/robots.txt 를 대신한다.
//
// 정적 파일로 두면 사이트맵 주소를 손으로 적어야 하고, 도메인이 바뀌면 그 파일만
// 남는다. 여기서 만들면 SITE.url 한 곳만 고치면 된다.
//
// 주의: public/robots.txt 가 있으면 그쪽이 이긴다(정적 파일이 라우트보다 먼저 잡힌다).
// 그래서 이 파일을 넣으면서 public/robots.txt 를 지웠다 — 남겨 두면 예전 `Disallow: /`
// 가 계속 먹어 여기서 무엇을 하든 색인이 되지 않는다.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 로그인·개인 화면은 수집해도 내용이 없거나(리다이렉트) 남의 개인정보다.
        // Q&A 는 문의 글이라 본인 외에는 뜻이 없고, 검색결과에 실명이 실릴 수 있다.
        disallow: [
          "/admin/", "/api/", "/login", "/member-login", "/mypage/",
          "/join", "/find-account", "/qna/", "/board/write", "/uploads/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
