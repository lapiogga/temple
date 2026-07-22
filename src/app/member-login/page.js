import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { SITE } from "@/content/site";
import LoginForm from "./LoginForm";
import { memberLoginAction } from "./actions";

export const metadata = { title: `회원 로그인 | ${SITE.name}` };

export default function MemberLogin() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />
      <section className="blk">
        <div className="wrap" style={{ maxWidth: "460px" }}>
          <div className="sec-head">
            <div><div className="ki">Login</div><h2>회원 로그인</h2></div>
          </div>
          <LoginForm action={memberLoginAction} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
