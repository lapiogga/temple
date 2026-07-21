import "./globals.css";

export const metadata = {
  title: "○○사 | 산중 포교도량",
  description:
    "○○산 ○○사 — 정기 법회와 사찰 소식, 가람 중창기를 안내합니다. 마음을 쉬어가는 산중 도량.",
  openGraph: {
    title: "○○사 | 산중 포교도량",
    description: "정기 법회·사찰 소식·가람 중창기 안내",
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
