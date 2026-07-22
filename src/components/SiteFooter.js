import { SITE } from "@/content/site";

// 슬림 푸터. flex 레이아웃으로 항상 화면 하단에 고정 노출.
export default function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap foot-slim">
        <div className="foot-slim-l">
          <span className="foot-name">{SITE.name}({SITE.hanja})</span>
          <span className="foot-links">
            <a href="/terms">이용약관</a>
            <a href="/privacy">개인정보</a>
            <a href="/email-policy">이메일수집거부</a>
            <a href={SITE.youtubeUrl} target="_blank" rel="noopener noreferrer">유튜브</a>
          </span>
        </div>
        <div className="foot-copy">© 2026 응선사(應禪寺). All rights reserved.</div>
      </div>
    </footer>
  );
}
