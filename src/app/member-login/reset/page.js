import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import ResetForm from "./ResetForm";
import { resetPasswordAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: `비밀번호 재설정 | ${SITE.name}` };

export default function MemberPasswordReset({ searchParams }) {
  // 로그인 화면에서 넘어오면 아이디를 채워 준다(초기화된 계정임이 이미 확인된 경우).
  const loginId = typeof searchParams?.loginId === "string" ? searchParams.loginId : "";
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "560px" }}>
          <PageHead title="비밀번호 재설정" ki="Reset" back={{ href: "/member-login", label: "회원 로그인" }} />
          <ResetForm action={resetPasswordAction} defaultLoginId={loginId} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
