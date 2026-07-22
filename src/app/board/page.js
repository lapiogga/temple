import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { listPosts, BOARD_LABEL } from "@/lib/posts";
import { requireMember } from "@/lib/member-session";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata = { title: `게시판 | ${SITE.name}` };

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export default async function BoardPage({ searchParams }) {
  const board =
    searchParams?.board === "story" ? "story" : searchParams?.board === "free" ? "free" : null;

  // 게시판은 회원 전용(비로그인 시 로그인 페이지로).
  await requireMember();
  let posts = [];
  try {
    posts = await listPosts(board ? { board } : {});
  } catch (err) {
    console.error("게시판 조회 실패:", err);
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
            <div><div className="ki">Community</div><h2>게시판</h2></div>
            <Link className="btn btn-primary btn-sm" href={`/board/write${board ? `?board=${board}` : ""}`}>글쓰기</Link>
          </div>

          <div className="post-tabs">
            <Link className={board === null ? "on" : ""} href="/board">전체</Link>
            <Link className={board === "free" ? "on" : ""} href="/board?board=free">자유게시판</Link>
            <Link className={board === "story" ? "on" : ""} href="/board?board=story">신행수기</Link>
          </div>

          {posts.length === 0 ? (
            <p className="reveal" style={{ color: "var(--ink-soft)" }}>등록된 글이 없습니다. 첫 글을 남겨 보세요.</p>
          ) : (
            <ul className="post-list">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/board/${p.id}`}>
                    <span className="p-title">
                      <span className="post-badge">{BOARD_LABEL[p.board] ?? ""}</span>
                      {p.title}
                    </span>
                    <span className="p-meta">{p.author_name} · {fmt(p.created_at)}</span>
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
