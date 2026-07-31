import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import FindAccountForm from "./FindAccountForm";

export const metadata = { title: `아이디·비밀번호 찾기 | ${SITE.name}` };

// 예전에는 ?tab=id / ?tab=pw 로 두 탭을 갈랐다. 지금은 두 경우를 한 화면에 나란히
// 안내하므로 탭이 없다. 기존 링크(/find-account?tab=id)는 그대로 이 화면으로 온다.
export default function FindAccountPage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "460px" }}>
          <PageHead title="아이디·비밀번호 찾기" ki="Find" back={{ href: "/member-login", label: "회원 로그인" }} />
          <FindAccountForm />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
