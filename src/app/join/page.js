import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { TERMS, PRIVACY } from "@/lib/legal";
import JoinForm from "./JoinForm";
import { joinAction } from "./actions";

export const metadata = { title: `회원가입 | ${SITE.name}` };

export default function JoinPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top tight">
        <div className="wrap wide">
          <PageHead title="회원가입" ki="Join" back={{ href: "/", label: "홈으로" }}>
            <span style={{ color: "var(--n-fg-3)", fontSize: "var(--fs-300)" }}>
              가입 신청 후 <b>종무소 승인</b>을 거쳐 이용하실 수 있습니다.
            </span>
          </PageHead>
          <JoinForm action={joinAction} terms={TERMS} privacy={PRIVACY} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
