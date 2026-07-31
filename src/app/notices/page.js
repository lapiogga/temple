import Link from "next/link";
import BackLink from "@/components/BackLink";
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

  // 번호는 고정 글을 뺀 나머지에만 매긴다. 고정 글은 목록 맨 앞으로 끌어올려진
  // 것이라 번호를 주면 순번이 어긋나 보인다(맨 앞이 가장 큰 번호가 아니게 된다).
  const plainCount = notices.filter((n) => !n.is_pinned).length;
  let plainSeen = notices.slice(0, (page - 1) * PER_PAGE).filter((n) => !n.is_pinned).length;

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap wide">
          <BackLink href="/" label="홈으로" />
          <div className="sec-head reveal">
            <div>
              <div className="ki">Notice</div>
              <h2>공지사항</h2>
            </div>
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
                paged.map((n) => (
                  <tr key={n.id} className={n.is_pinned ? "row-pinned" : ""}>
                    <td className="c-cat">{n.is_pinned ? "-" : plainCount - plainSeen++}</td>
                    <td className="c-title">
                      <Link href={`/notices/${n.id}`}>
                        {n.is_pinned && <span className="tag-pin">공지</span>}
                        {n.title}
                      </Link>
                    </td>
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
