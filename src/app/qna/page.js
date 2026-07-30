import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs } from "@/components/Icons";
import { listQuestions } from "@/lib/qna";
import { SITE } from "@/content/site";
import Pager from "@/components/Pager";

export const dynamic = "force-dynamic";
export const metadata = { title: `묻고답하기 | ${SITE.name}` };

const PER_PAGE = 12;

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export default async function QnaPage({ searchParams }) {
  let qs = [];
  try {
    qs = await listQuestions();
  } catch (err) {
    console.error("Q&A 조회 실패:", err);
  }

  const totalPages = Math.max(1, Math.ceil(qs.length / PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, Number(searchParams?.page) || 1));
  const paged = qs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap wide">
          <div className="sec-head reveal">
            <div><div className="ki">Q&amp;A</div><h2>묻고답하기</h2></div>
            <Link className="btn btn-primary btn-sm" href="/qna/write">질문하기</Link>
          </div>

          <table className="list-table">
            <thead>
              <tr>
                <th className="c-cat">상태</th>
                <th>제목</th>
                <th className="c-author th-author">작성자</th>
                <th className="c-date">작성일</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((q) => (
                  <tr key={q.id}>
                    <td className="c-cat">
                      {q.answered
                        ? <span className="post-badge">답변완료</span>
                        : <span style={{ color: "var(--n-fg-3)", fontSize: "var(--fs-200)" }}>대기</span>}
                    </td>
                    <td className="c-title">
                      <Link href={`/qna/${q.id}`}>
                        {q.is_secret && <span className="lock">🔒</span>}
                        {q.is_secret ? "비밀글입니다" : q.title}
                      </Link>
                    </td>
                    <td className="c-author">{q.author_name}</td>
                    <td className="c-date">{fmt(q.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row"><td colSpan={4}>등록된 질문이 없습니다. 궁금한 점을 남겨 주세요.</td></tr>
              )}
            </tbody>
          </table>

          <Pager basePath="/qna" page={page} totalPages={totalPages} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
