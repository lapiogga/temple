import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs } from "@/components/Icons";
import { listPosts } from "@/lib/posts";
import { listVisibleCategories, getLabelMap } from "@/lib/board-categories";
import { getMemberSession } from "@/lib/member-session";
import { getSession } from "@/lib/session";
import { SITE } from "@/content/site";
import Pager from "@/components/Pager";

export const dynamic = "force-dynamic";
export const metadata = { title: `게시판 | ${SITE.name}` };

const PER_PAGE = 12;

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export default async function BoardPage({ searchParams }) {
  // 카테고리는 board_categories 가 갖는다. 목록 탭에는 숨김을 뺀 것만 쓰되,
  // 이름표는 숨긴 카테고리의 글에도 붙어야 하므로 전체 맵을 따로 받는다.
  let categories = [];
  let labelMap = {};
  try {
    [categories, labelMap] = await Promise.all([listVisibleCategories(), getLabelMap()]);
  } catch (err) {
    console.error("게시판 카테고리 조회 실패:", err);
  }
  // 없는 slug 로 들어오면 전체 목록으로 떨어뜨린다.
  const q = searchParams?.board;
  const board = categories.some((c) => c.slug === q) ? q : null;

  // 열람은 공개. 글쓰기는 승인 회원 또는 운영자.
  let posts = [];
  try {
    posts = await listPosts(board ? { board } : {});
  } catch (err) {
    console.error("게시판 조회 실패:", err);
  }
  const [memberSession, adminSession] = await Promise.all([getMemberSession(), getSession()]);
  const loggedIn = !!memberSession.isLoggedIn || !!adminSession.isLoggedIn;

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, Number(searchParams?.page) || 1));
  const paged = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap wide">
          <div className="sec-head reveal">
            <div><div className="ki">Community</div><h2>게시판</h2></div>
            {loggedIn ? (
              <Link className="btn btn-primary btn-sm" href={`/board/write${board ? `?board=${board}` : ""}`}>글쓰기</Link>
            ) : (
              <Link className="more" href="/member-login">로그인 후 글쓰기 →</Link>
            )}
          </div>

          <div className="post-tabs">
            <Link className={board === null ? "on" : ""} href="/board">전체</Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                className={board === c.slug ? "on" : ""}
                href={`/board?board=${encodeURIComponent(c.slug)}`}
              >
                {c.label}
              </Link>
            ))}
          </div>

          <table className="list-table">
            <thead>
              <tr>
                <th className="c-cat">구분</th>
                <th>제목</th>
                <th className="c-author th-author">작성자</th>
                <th className="c-date">작성일</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((p) => (
                  <tr key={p.id}>
                    <td className="c-cat"><span className="post-badge">{labelMap[p.board] ?? ""}</span></td>
                    <td className="c-title"><Link href={`/board/${p.id}`}>{p.title}</Link></td>
                    <td className="c-author">{p.author_name}</td>
                    <td className="c-date">{fmt(p.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row"><td colSpan={4}>등록된 글이 없습니다. 첫 글을 남겨 보세요.</td></tr>
              )}
            </tbody>
          </table>

          <Pager basePath="/board" query={{ board: searchParams?.board }} page={page} totalPages={totalPages} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
