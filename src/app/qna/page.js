import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { listQuestions } from "@/lib/qna";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata = { title: `묻고답하기 | ${SITE.name}` };

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export default async function QnaPage() {
  let qs = [];
  try {
    qs = await listQuestions();
  } catch (err) {
    console.error("Q&A 조회 실패:", err);
  }

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />
      <DancheongRule height={12} />
      <section className="blk">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">Q&amp;A</div><h2>묻고답하기</h2></div>
            <Link className="btn btn-primary btn-sm" href="/qna/write">질문하기</Link>
          </div>

          {qs.length === 0 ? (
            <p className="reveal" style={{ color: "var(--ink-soft)" }}>등록된 질문이 없습니다. 궁금한 점을 남겨 주세요.</p>
          ) : (
            <ul className="post-list">
              {qs.map((q) => (
                <li key={q.id}>
                  <Link href={`/qna/${q.id}`}>
                    <span className="p-title">
                      {q.is_secret && <span className="lock">🔒</span>}
                      {q.answered && <span className="post-badge">답변완료</span>}
                      {q.is_secret ? "비밀글입니다" : q.title}
                    </span>
                    <span className="p-meta">{q.author_name} · {fmt(q.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
