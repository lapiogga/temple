import "./globals.css";

export const metadata = {
  title: "응선사(應禪寺) | 서울 부암동 도심 속 산사",
  description:
    "서울 종로구 부암동 백사실 계곡 곁의 도심 속 산사, 응선사(應禪寺). 대웅전 산신도(서울특별시 문화재자료 제14호)와 사찰 소식을 전합니다.",
  // 초안(테스트) 기간 검색엔진 색인 차단 — 8월 정식 오픈 시 해제.
  robots: { index: false, follow: false },
  openGraph: {
    title: "응선사(應禪寺) | 서울 부암동 도심 속 산사",
    description: "부암동 백사실 계곡 곁의 도심 속 산사 · 대웅전 산신도 · 사찰 소식",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
