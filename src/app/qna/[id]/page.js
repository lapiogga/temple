import Link from "next/link";
import BackLink from "@/components/BackLink";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { getQuestion } from "@/lib/qna";
import { revealSecretAction } from "../actions";
import SecretGate from "./SecretGate";
import QnaView from "./QnaView";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const metadata = { title: `묻고답하기 | ${SITE.name}` };

export default async function QnaDetail({ params }) {
  const id = parseId(params.id);
  if (!id) notFound();
  let q = null;
  try { q = await getQuestion(id); } catch (err) { console.error("질문 조회 실패:", err); }
  if (!q) notFound();

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <article className="screen top">
        <div className="wrap wide">
          <div className="head-back"><BackLink href="/qna" label="묻고답하기" /></div>
          {q.is_secret ? (
            <div style={{ marginTop: "20px" }}>
              <SecretGate action={revealSecretAction.bind(null, id)} />
            </div>
          ) : (
            <QnaView
              title={q.title}
              authorName={q.author_name}
              createdAt={q.created_at}
              body={q.body}
              answer={q.answer}
              answeredAt={q.answered_at}
            />
          )}
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
