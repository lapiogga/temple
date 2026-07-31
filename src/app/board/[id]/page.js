import Link from "next/link";
import BackLink from "@/components/BackLink";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { getPost } from "@/lib/posts";
import { getCategoryBySlug, boardHref } from "@/lib/board-categories";
import { formatDate } from "@/lib/format";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
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
  // 이 글이 속한 게시판. 이름표와 "돌아가기" 주소를 여기서 얻는다.
  // 숨긴 카테고리의 글도 이름표는 보여야 하므로 숨김 여부로 거르지 않는다.
  let category = null;
  try { category = await getCategoryBySlug(p.board); } catch (err) { console.error("카테고리 조회 실패:", err); }
  const backHref = boardHref(category);
  const backLabel = category ? category.label : "게시판";

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <article className="screen top">
        <div className="wrap wide">
          <div className="head-back"><BackLink href={backHref} label={backLabel} /></div>
          {/* 정해진 틀(표): 타이틀·게시자·게시일시·게시내용.
              첨부자료 행은 뺐다 — 게시판에는 첨부 기능이 없어(event_attachments 만 존재)
              영원히 "첨부파일 없음" 만 찍히는 죽은 행이었다. */}
          <table className="detail-table">
            <tbody>
              <tr>
                <th scope="row">타이틀</th>
                <td>
                  {category && <span className="post-badge">{category.label}</span>}
                  <span className="detail-title">{p.title}</span>
                </td>
              </tr>
              <tr>
                <th scope="row">게시자</th>
                <td>{p.author_name}</td>
              </tr>
              <tr>
                <th scope="row">게시일시</th>
                <td>{formatDate(p.created_at)}</td>
              </tr>
              <tr>
                <th scope="row">게시내용</th>
                <td className="detail-body">
                  <div className="rich-content" dangerouslySetInnerHTML={{ __html: p.body }} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
