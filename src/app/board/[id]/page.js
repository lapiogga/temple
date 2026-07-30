import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { getPost, BOARD_LABEL } from "@/lib/posts";
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

export async function generateMetadata({ params }) {
  const id = parseId(params.id);
  if (!id) return { title: `게시판 | ${SITE.name}` };
  let p = null;
  try { p = await getPost(id); } catch { p = null; }
  return { title: p ? `${p.title} | ${SITE.name}` : `게시판 | ${SITE.name}` };
}

export default async function PostDetail({ params }) {
  const id = parseId(params.id);
  if (!id) notFound();
  let p = null;
  try { p = await getPost(id); } catch (err) { console.error("글 조회 실패:", err); }
  if (!p || !p.published) notFound();

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <article className="screen top">
        <div className="wrap wide">
          <Link className="more" href="/board">← 게시판</Link>

          {/* 정해진 틀(표): 타이틀·게시자·게시일시·게시내용·첨부자료 */}
          <table className="detail-table">
            <tbody>
              <tr>
                <th scope="row">타이틀</th>
                <td>
                  {BOARD_LABEL[p.board] && <span className="post-badge">{BOARD_LABEL[p.board]}</span>}
                  <span className="detail-title">{p.title}</span>
                </td>
              </tr>
              <tr>
                <th scope="row">게시자</th>
                <td>{p.author_name}</td>
              </tr>
              <tr>
                <th scope="row">게시일시</th>
                <td>{fmt(p.created_at)}</td>
              </tr>
              <tr>
                <th scope="row">게시내용</th>
                <td className="detail-body">
                  <div className="rich-content" dangerouslySetInnerHTML={{ __html: p.body }} />
                </td>
              </tr>
              <tr>
                <th scope="row">첨부자료</th>
                <td><span style={{ color: "var(--n-fg-3)" }}>첨부파일 없음</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
