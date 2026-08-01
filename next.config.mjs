/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 이미지 최적화: 추후 S3/CloudFront 도메인 추가
  images: { remotePatterns: [] },
  // 소개 대문(/about)은 인삿말로 보낸다.
  //
  // 이 처리가 페이지가 아니라 여기 있는 이유: 예전에는 src/app/about/page.js 가
  // redirect("/about/greeting") 만 하는 페이지였는데, 내용이 없어 Next 가 이 라우트를
  // 정적 프리렌더 대상으로 잡았다. 그런데 next/dist/export/routes/app-page.js:78-85 는
  // 목 응답의 헤더(Location 이 여기 들어 있다)를 PPR 이 켜져 있을 때만 가져오고,
  // 상태코드는 :92-102 에서 PPR 과 무관하게 가져온다. PPR 이 꺼진 이 프로젝트에서는
  // .next/server/app/about.meta 에 status 307 만 남고 location 이 빠진다.
  // 실제로 운영(:3000)이 Location 없는 307 + 빈 오류 문서를 돌려주고 있었다.
  // dev 는 매 요청을 렌더하므로 정상이라 개발 중에는 드러나지 않는다.
  //
  // 라우팅 계층에서 처리하면 페이지 렌더 자체가 없어 이 경로를 타지 않는다.
  // 페이지에 export const dynamic = "force-dynamic" 을 붙여도 고쳐지지만 그쪽을 안 썼다.
  // 그 한 줄이 지워지면 버그가 조용히 돌아오는데, dev 는 매 요청을 렌더하므로 개발 중에는
  // 멀쩡해 보인다 — 이번에 운영까지 나간 경로가 정확히 그것이다.
  // permanent:false(307) 는 기존 동작을 그대로 둔 것이다. 정식 오픈 전까지 메뉴 구조가
  // 더 바뀔 수 있는데, 308 은 브라우저가 영구 캐시해 되돌리기 어렵다.
  //
  // 대가: 아래 headers() 가 이 응답에는 붙지 않는다(Next 가 config 리다이렉트를
  // 커스텀 헤더보다 먼저 끝낸다. :3002 프로덕션 빌드로 확인 — /about/greeting 에는
  // 4개 다 붙고 /about 에는 0개). 본문 없는 307 이라 실질 손실은 없다고 판단했다.
  // 근본 해법은 이 헤더들을 nginx 서버 블록으로 올리는 것이다(로드맵 §3-A 4 하드닝).
  async redirects() {
    return [
      { source: "/about", destination: "/about/greeting", permanent: false },
      // 소개 게시판 허브가 홈페이지 허브(/admin/site)로 흡수됐다. 대메뉴에서는 뺐지만
      // 운영자가 갈피(북마크)를 걸어 뒀을 수 있어 주소는 살려 둔다.
      // 여기(라우팅 계층)에 두는 이유는 위 /about 과 같다 — redirect() 만 하는 페이지는
      // 정적 프리렌더에서 Location 을 잃는다.
      { source: "/admin/intro", destination: "/admin/site", permanent: false },
    ];
  },
  // 공통 보안 헤더. 초안 기간 X-Robots-Tag noindex 포함(8월 정식 오픈 시 제거).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};
export default nextConfig;
