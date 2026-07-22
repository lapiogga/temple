import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { SITE } from "@/content/site";
import JoinForm from "./JoinForm";
import { joinAction } from "./actions";

export const metadata = { title: `회원가입 | ${SITE.name}` };

export default function JoinPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />
      <section className="blk">
        <div className="wrap" style={{ maxWidth: "620px" }}>
          <div className="sec-head">
            <div><div className="ki">Join</div><h2>회원가입</h2></div>
          </div>
          <p style={{ color: "var(--ink-soft)", marginBottom: "18px", fontSize: "16.5px" }}>
            가입 신청 후 <b>종무소 승인</b>을 거쳐 이용하실 수 있습니다.
          </p>
          <JoinForm action={joinAction} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
