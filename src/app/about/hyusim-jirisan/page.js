import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";

// 화면 구성은 별도로 진행 예정. 지금은 대메뉴에서 눌렀을 때 404 가 나지 않도록
// 사이트 프레임과 제목만 세워 둔다.
export const metadata = { title: `휴심선원(지리산 휴심) | ${SITE.name}` };

export default function HyusimJirisanPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen">
        <div className="wrap">
          <div className="sec-head">
            <div><div className="ki">Hyusim</div><h2>휴심선원(지리산 휴심)</h2></div>
          </div>
          <div className="about-greeting">
            <p className="draft-badge">※ 준비 중입니다 — 화면 구성은 별도로 진행합니다.</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
