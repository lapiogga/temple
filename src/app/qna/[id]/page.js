import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { getQuestion } from "@/lib/qna";
import { revealSecretAction } from "../actions";
import SecretGate from "./SecretGate";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
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
      <DancheongRule height={12} />
      <article className="blk">
        <div className="wrap" style={{ maxWidth: "760px" }}>
          <Link className="more" href="/qna">← 묻고답하기</Link>
          {q.is_secret ? (
            <div style={{ marginTop: "20px" }}>
              <SecretGate action={revealSecretAction.bind(null, id)} />
            </div>
          ) : (
            <>
              <h1 className="serif" style={{ fontSize: "clamp(24px,4vw,32px)", fontWeight: 700, margin: "18px 0 8px", lineHeight: 1.3 }}>
                {q.title}
              </h1>
              <div style={{ color: "var(--ink-soft)", fontSize: "15px", marginBottom: "22px" }}>
                {q.author_name} · {fmt(q.created_at)}
              </div>
              <div style={{ whiteSpace: "pre-line", fontSize: "17px", lineHeight: 1.8, color: "var(--ink)" }}>{q.body}</div>
              {q.answer && (
                <div className="qna-answer">
                  <div className="a-label">🙏 답변</div>
                  <div style={{ whiteSpace: "pre-line", fontSize: "16.5px", lineHeight: 1.8 }}>{q.answer}</div>
                </div>
              )}
            </>
          )}
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
