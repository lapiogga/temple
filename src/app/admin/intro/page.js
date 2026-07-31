import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listIntroCategories, countPostsBySlug } from "@/lib/board-categories";

export const dynamic = "force-dynamic";

// 응선사 소개 메뉴에 딸린 게시판 관리 허브.
// 게시판(/admin/board)과 별개로 둔다 — 서로 다른 것이라 한 화면에 섞으면
// 게시판 탭을 손보다 소개 메뉴를 건드리기 쉽다.
// 화면 구성은 홈페이지 콘텐츠 허브(/admin/site)와 같은 카드 목록이다.
export default async function IntroBoardsAdmin() {
  await requireSession();
  const cats = await listIntroCategories();
  const counts = Object.fromEntries(
    await Promise.all(cats.map(async (c) => [c.slug, await countPostsBySlug(c.slug)]))
  );

  return (
    <section>
      <h1 className="adm-h1">소개 게시판</h1>
      <p style={{ color: "var(--n-fg-3)", marginBottom: "var(--sp-l)" }}>
        <b>응선사 소개</b> 메뉴에 딸린 게시판입니다. 각각 자기 주소(<code>/about/…</code>)를
        가지며 <b>게시판(/board)의 카테고리와는 별개</b>로 관리됩니다.
        글은 운영자만 쓸 수 있고, 본문에 이미지를 넣을 수 있습니다.
      </p>

      <div className="site-cards">
        {cats.map((c) => (
          <Link key={c.slug} className="site-card" href={`/admin/intro/${c.slug}`}>
            <span className="site-card-l">
              {c.label}
              <span className="adm-who" style={{ display: "block", fontWeight: 400 }}>
                /about/{c.slug} · {c.layout === "card" ? "카드" : "목록"} · 글 {counts[c.slug] ?? 0}건
              </span>
            </span>
            <span className="site-card-go">관리 →</span>
          </Link>
        ))}
      </div>

      {cats.length === 0 && <p className="adm-empty">등록된 소개 게시판이 없습니다.</p>}
    </section>
  );
}
