import SiteHeader from "@/components/SiteHeader";
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
          <div className="sec-head" style={{ marginBottom: "6px" }}>
            <div><div className="ki">Join</div><h2>회원가입</h2></div>
            <span style={{ color: "var(--ink-soft)", fontSize: "var(--fs-300)" }}>
              가입 신청 후 <b>종무소 승인</b>을 거쳐 이용하실 수 있습니다.
            </span>
          </div>
          <JoinForm action={joinAction} terms={TERMS} privacy={PRIVACY} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
