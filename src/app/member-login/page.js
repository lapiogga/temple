import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import LoginForm from "./LoginForm";
import { memberLoginAction } from "./actions";

export const metadata = { title: `회원 로그인 | ${SITE.name}` };

export default function MemberLogin({ searchParams }) {
  const justReset = searchParams?.reset === "done";
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "460px" }}>
          <PageHead title="회원 로그인" ki="Login" back={{ href: "/", label: "홈으로" }} />
          {justReset && (
            <p className="adm-form-ok" style={{ marginBottom: "var(--sp-l)" }}>
              새 비밀번호가 설정되었습니다. 새 비밀번호로 로그인해 주세요.
            </p>
          )}
          <LoginForm action={memberLoginAction} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
