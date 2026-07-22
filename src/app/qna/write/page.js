import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import QnaWriteForm from "../QnaWriteForm";
import { createQuestionAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: `묻고답하기 글쓰기 | ${SITE.name}` };

export default function QnaWrite() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "620px" }}>
          <div className="sec-head">
            <div><div className="ki">Q&amp;A</div><h2>묻고답하기</h2></div>
          </div>
          <p style={{ color: "var(--ink-soft)", marginBottom: "18px", fontSize: "16px" }}>
            휴대폰 본인인증 후 누구나 질문을 남길 수 있습니다. 비밀글은 작성자와 관리자만 열람합니다.
          </p>
          <QnaWriteForm action={createQuestionAction} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
