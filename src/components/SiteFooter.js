import { DancheongRule } from "@/components/Icons";
import { SITE } from "@/content/site";

// 밝고 얇은 푸터. 바로가기는 상단 사이트맵으로 이동.
export default function SiteFooter() {
  return (
    <footer className="site">
      <DancheongRule height={10} />
      <div className="foot-lite">
        <div className="wrap">
          <div className="foot-lite-in">
            <div className="foot-id">
              <span className="foot-name">{SITE.name} ({SITE.hanja})</span>
              <span className="foot-sub">
                {SITE.order} · 주지 {SITE.abbot} · {SITE.addressFull}
              </span>
            </div>
            <div className="foot-legal">
              <a href="/terms">서비스 이용약관</a>
              <a href="/privacy">개인정보 보호정책</a>
              <a href="/email-policy">이메일 무단수집 거부</a>
              <a href={SITE.youtubeUrl} target="_blank" rel="noopener noreferrer">유튜브</a>
            </div>
          </div>
          <div className="foot-copy">© 2026 응선사(應禪寺) · 서울 종로구 부암동</div>
        </div>
      </div>
    </footer>
  );
}
