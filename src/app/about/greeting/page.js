import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { getSection } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const metadata = { title: `주지 스님 인사말 | ${SITE.name}` };

export default async function GreetingPage() {
  const g = await getSection("greeting");
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap">
          <PageHead title="주지 스님 인사말" ki="Greeting" back={{ href: "/", label: "홈으로" }} />
          <div className="about-greeting">
            {g.isDraft && (
              <p className="draft-badge">※ 초안입니다 — 주지 스님 인사말 원문으로 교체 예정입니다.</p>
            )}
            {/* 인삿말은 관리자 리치 에디터에서 HTML(bodyHtml)로 저장된다. 저장 때
                서버가 allowlist 로 정화한 값이라 게시판 본문과 같은 방식으로 그린다.
                아직 한 번도 새로 저장하지 않은 옛 값은 문단 배열로만 있으므로
                그때는 예전처럼 <p> 로 그린다. */}
            {g.bodyHtml ? (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: g.bodyHtml }} />
            ) : (
              (g.paragraphs || []).map((p, i) => <p key={i}>{p}</p>)
            )}
            <p className="sign">{g.sign}</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
