import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs } from "@/components/Icons";
import { listNotices } from "@/lib/notices";
import { formatDate } from "@/lib/format";
import { SITE } from "@/content/site";
import Pager from "@/components/Pager";

// 공지사항은 관리자 등록에 따라 바뀌므로 항상 최신 DB 조회.
export const dynamic = "force-dynamic";

const PER_PAGE = 12;

export const metadata = { title: `공지사항 | ${SITE.name}` };

export default async function NoticesList({ searchParams }) {
  let notices = [];
  try {
    notices = await listNotices({ includeUnpublished: false });
  } catch (err) {
    console.error("공지사항 목록 조회 실패:", err);
  }

  const totalPages = Math.max(1, Math.ceil(notices.length / PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, Number(searchParams?.page) || 1));
  const paged = notices.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap wide">
          <div className="sec-head reveal">
            <div>
              <div className="ki">Notice</div>
              <h2>공지사항</h2>
            </div>
            <Link className="more" href="/">← 홈으로</Link>
          </div>

          <table className="list-table">
            <thead>
              <tr>
                <th className="c-cat">번호</th>
                <th>제목</th>
                <th className="c-date">작성일</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((n, i) => (
                  <tr key={n.id}>
                    <td className="c-cat">{notices.length - ((page - 1) * PER_PAGE + i)}</td>
                    <td className="c-title"><Link href={`/notices/${n.id}`}>{n.title}</Link></td>
                    <td className="c-date">{formatDate(n.published_at)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row"><td colSpan={3}>등록된 공지사항이 없습니다. 곧 새로운 공지사항을 올리겠습니다.</td></tr>
              )}
            </tbody>
          </table>

          <Pager basePath="/notices" page={page} totalPages={totalPages} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
