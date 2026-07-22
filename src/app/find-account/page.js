import SiteHeader from "@/components/SiteHeader";
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
          <div className="sec-head">
            <div><div className="ki">Find</div><h2>아이디·비밀번호 찾기</h2></div>
          </div>
          <FindAccountForm initialTab={tab} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
