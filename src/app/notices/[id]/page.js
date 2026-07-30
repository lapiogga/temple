import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { getNotice } from "@/lib/notices";
import { formatDate } from "@/lib/format";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }) {
  const id = parseId(params.id);
  if (!id) return { title: `소식 | ${SITE.name}` };
  let n = null;
  try {
    n = await getNotice(id);
  } catch {
    n = null;
  }
  return { title: n ? `${n.title} | ${SITE.name}` : `소식 | ${SITE.name}` };
}

export default async function NoticeDetail({ params }) {
  const id = parseId(params.id);
  if (!id) notFound();

  let n = null;
  try {
    n = await getNotice(id);
  } catch (err) {
    console.error("소식 조회 실패:", err);
  }
  // 미공개(비공개/초안) 소식은 공개 열람 불가.
  if (!n || !n.published) notFound();

  return (
    <>
      <DancheongDefs />
      <SiteHeader />

      <article className="screen top">
        <div className="wrap wide">
          <Link className="more" href="/notices">← 소식 목록</Link>

          {/* 게시판과 동일한 표 틀: 타이틀·게시자·게시일시·게시내용·첨부자료 */}
          <table className="detail-table">
            <tbody>
              <tr>
                <th scope="row">타이틀</th>
                <td><span className="detail-title">{n.title}</span></td>
              </tr>
              <tr>
                <th scope="row">게시자</th>
                <td>종무소</td>
              </tr>
              <tr>
                <th scope="row">게시일시</th>
                <td>{formatDate(n.published_at)}</td>
              </tr>
              <tr>
                <th scope="row">게시내용</th>
                <td className="detail-body">
                  {n.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.cover_url}
                      alt={n.title}
                      style={{ width: "100%", maxWidth: "560px", borderRadius: "var(--r-card)", border: "1px solid var(--line)", marginBottom: "16px", display: "block" }}
                    />
                  )}
                  <div className="rich-content" dangerouslySetInnerHTML={{ __html: n.body }} />
                </td>
              </tr>
              <tr>
                <th scope="row">첨부자료</th>
                <td><span style={{ color: "var(--ink-soft)" }}>첨부파일 없음</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <SiteFooter />
    </>
  );
}
