import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { SITE } from "@/content/site";
import { TERMS } from "@/lib/legal";

export const metadata = { title: `서비스 이용약관 | ${SITE.name}` };

export default function TermsPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />

      <section className="blk">
        <div className="wrap" style={{ maxWidth: "820px" }}>
          <div className="sec-head">
            <div><div className="ki">Terms</div><h2>서비스 이용약관</h2></div>
            <Link className="more" href="/">← 홈으로</Link>
          </div>
          <div className="legal-doc" style={{ whiteSpace: "pre-line" }}>{TERMS}</div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
