import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import FindAccountForm from "./FindAccountForm";

export const metadata = { title: `아이디·비밀번호 찾기 | ${SITE.name}` };

export default function FindAccountPage({ searchParams }) {
  const tab = searchParams?.tab === "pw" ? "pw" : "id";
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "460px" }}>
          <PageHead title="아이디·비밀번호 찾기" ki="Find" back={{ href: "/member-login", label: "회원 로그인" }} />
          <FindAccountForm initialTab={tab} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
