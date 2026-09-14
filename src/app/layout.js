import "./globals.css";
import ScrollTop from "@/components/ScrollTop";
import { SITE } from "@/content/site";

// 검색 노출.
//
// 2026-07 초안 기간에는 색인을 **네 겹**으로 막아 뒀었다 — public/robots.txt 의
// `Disallow: /`, 여기 metadata.robots 의 noindex, next.config.mjs 의 X-Robots-Tag,
// 그리고 자체서명 인증서(로봇이 TLS 검증에 실패해 애초에 못 읽는다).
// 한 겹만 풀면 나머지가 계속 막으므로 네 곳을 같이 봐야 한다.
//
// metadataBase 가 있어야 상대 경로 canonical·OG 이미지가 절대 주소로 펼쳐진다.
// 없으면 Next 가 경고를 내고 OG 주소가 비거나 localhost 로 나간다.
const base = new URL(SITE.url);

export const metadata = {
  metadataBase: base,
  // title.template 을 두지 않는다. 하위 페이지들이 이미 제목에 사이트명을 붙여 두어
  // (`법회·행사 | 응선사`) 템플릿을 걸면 `… | 응선사 | 응선사(應禪寺)` 로 두 번 붙는다.
  title: `${SITE.name}(${SITE.hanja}) | 서울 부암동 도심 속 산사`,
  description:
    "서울 종로구 부암동 백사실 계곡 곁의 도심 속 산사, 응선사(應禪寺). 대한불교조계종 · 대웅전 산신도(서울특별시 문화재자료 제14호) · 법회 일정과 공지사항을 전합니다.",
  // 검색어로 실제로 들어오는 말들. 메타 키워드는 구글이 보지 않지만 네이버는 참고한다.
  keywords: [
    "응선사", "應禪寺", "부암동 응선사", "서울 응선사", "백사실 응선사",
    "종로구 절", "부암동 절", "백사실계곡 절", "서울 도심 사찰",
    "대한불교조계종", "응선사 법회", "응선사 산신도",
  ],
  applicationName: `${SITE.name}(${SITE.hanja})`,
  // './' 는 metadataBase + 현재 경로로 펼쳐진다 — 페이지마다 따로 적지 않아도
  // 자기 주소를 가리킨다. www/apex, 쿼리스트링이 붙은 주소가 따로 색인되는 것을 막는다.
  alternates: { canonical: "./" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // 서치콘솔·서치어드바이저 소유확인 토큰. 발급받아 .env 에 넣으면 자동으로 붙는다.
  // 값이 없으면 해당 메타 태그를 아예 내보내지 않는다(빈 태그는 확인에 실패한다).
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { other: { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION } }
      : {}),
  },
  openGraph: {
    type: "website",
    siteName: `${SITE.name}(${SITE.hanja})`,
    locale: "ko_KR",
    url: base.toString(),
    title: `${SITE.name}(${SITE.hanja}) | 서울 부암동 도심 속 산사`,
    description: "부암동 백사실 계곡 곁의 도심 속 산사 · 대웅전 산신도 · 법회 일정과 공지사항",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name}(${SITE.hanja}) | 서울 부암동 도심 속 산사`,
    description: "부암동 백사실 계곡 곁의 도심 속 산사 · 대웅전 산신도 · 법회 일정과 공지사항",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
        {/* 모든 화면에 따라다니는 '제일 위로' 버튼 */}
        <ScrollTop />
      </body>
    </html>
  );
}
