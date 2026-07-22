import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { SITE } from "@/content/site";
import { PRIVACY } from "@/lib/legal";

export const metadata = { title: `개인정보 보호정책 | ${SITE.name}` };

export default function PrivacyPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />

      <section className="blk">
        <div className="wrap" style={{ maxWidth: "820px" }}>
          <div className="sec-head">
            <div><div className="ki">Privacy</div><h2>개인정보 보호정책</h2></div>
            <Link className="more" href="/">← 홈으로</Link>
          </div>
          <div className="legal-doc" style={{ whiteSpace: "pre-line" }}>{PRIVACY}</div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
