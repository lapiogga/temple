import Link from "next/link";
import BackLink from "@/components/BackLink";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { TERMS } from "@/lib/legal";

export const metadata = { title: `서비스 이용약관 | ${SITE.name}` };

export default function TermsPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "820px" }}>
          <BackLink href="/" label="홈으로" />
          <div className="sec-head">
            <div><div className="ki">Terms</div><h2>서비스 이용약관</h2></div>
          </div>
          <div className="legal-doc" style={{ whiteSpace: "pre-line" }}>{TERMS}</div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
