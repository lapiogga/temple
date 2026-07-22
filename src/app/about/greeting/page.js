import SiteHeader from "@/components/SiteHeader";
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
      <section className="screen">
        <div className="wrap">
          <div className="sec-head">
            <div><div className="ki">Greeting</div><h2>주지 스님 인사말</h2></div>
          </div>
          <div className="about-greeting">
            {g.isDraft && (
              <p className="draft-badge">※ 초안입니다 — 주지 스님 인사말 원문으로 교체 예정입니다.</p>
            )}
            {(g.paragraphs || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="sign">{g.sign}</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
