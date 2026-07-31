import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { PRIVACY } from "@/lib/legal";

export const metadata = { title: `개인정보 보호정책 | ${SITE.name}` };

export default function PrivacyPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "820px" }}>
          <PageHead title="개인정보 보호정책" ki="Privacy" back={{ href: "/", label: "홈으로" }} />
          <div className="legal-doc" style={{ whiteSpace: "pre-line" }}>{PRIVACY}</div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
