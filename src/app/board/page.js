import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs } from "@/components/Icons";
import { listPosts } from "@/lib/posts";
import { listBoardTabCategories, getLabelMap, canWrite } from "@/lib/board-categories";
import { getViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/format";
import { SITE } from "@/content/site";
import Pager from "@/components/Pager";

export const dynamic = "force-dynamic";
export const metadata = { title: `게시판 | ${SITE.name}` };

const PER_PAGE = 12;

export default async function BoardPage({ searchParams }) {
  // 카테고리는 board_categories 가 갖는다. 목록 탭에는 숨김을 뺀 것만 쓰되,
  // 이름표는 숨긴 카테고리의 글에도 붙어야 하므로 전체 맵을 따로 받는다.
  let categories = [];
  let labelMap = {};
  try {
    [categories, labelMap] = await Promise.all([listBoardTabCategories(), getLabelMap()]);
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
    // '전체' 탭은 이 화면의 탭에 있는 게시판만 모은다. 소개 메뉴에 자기 주소가
    // 따로 있는 게시판(법문·휴심선원)의 글이 여기 섞이면 안 된다.
    if (!board) {
      const shown = new Set(categories.map((c) => c.slug));
      posts = posts.filter((p) => shown.has(p.board));
    }
  } catch (err) {
    console.error("게시판 조회 실패:", err);
  }
  // 쿠키가 있다고 글을 쓸 수 있는 것이 아니다. 계정이 지금도 유효한지, 그리고
  // 이 게시판의 write_role 을 통과하는지까지 본다(lib/viewer.js · canWrite).
  // 예전에는 isLoggedIn 만 봐서 정지 회원에게도 버튼이 떴고, 누르면 거짓 안내가 났다.
  const viewer = await getViewer();
  const perm = { isAdmin: viewer.isAdmin, isApprovedMember: viewer.isApprovedMember };
  const canWriteHere = board
    ? canWrite(categories.find((c) => c.slug === board), perm)
    : categories.some((c) => canWrite(c, perm));
  // '로그인 후 글쓰기' 는 정말 비로그인일 때만. 정지 회원에게 로그인 링크를
  // 보여주는 것은 또 다른 막다른 길이다.
  const anonymous = !viewer.isAdmin && !viewer.isApprovedMember && !viewer.memberNeedsReset;

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
          <PageHead title="게시판" ki="Community" className="reveal" back={{ href: "/", label: "홈으로" }}>
            {canWriteHere ? (
              <Link className="btn btn-primary btn-sm" href={`/board/write${board ? `?board=${board}` : ""}`}>글쓰기</Link>
            ) : viewer.memberNeedsReset ? (
              <Link className="more" href="/member-login/reset">비밀번호 재설정 후 이용 →</Link>
            ) : anonymous ? (
              <Link className="more" href="/member-login">로그인 후 글쓰기 →</Link>
            ) : null}
          </PageHead>

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
                    <td className="c-date">{formatDate(p.created_at)}</td>
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
