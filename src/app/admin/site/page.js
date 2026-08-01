import Link from "next/link";
import { requireSession } from "@/lib/session";
import { CONTENT_SECTIONS } from "@/lib/site-content";
import { listIntroCategories, countPostsBySlug } from "@/lib/board-categories";

// 글 건수를 매 요청 읽는다.
export const dynamic = "force-dynamic";

// 홈페이지 관리 허브.
//
// '응선사 소개' 메뉴에 걸리는 것을 한 화면에 모은다. 예전에는 고정 문구(인삿말·연혁·
// 산신도)만 여기 있고 게시판(법문·휴심선원)은 /admin/intro 라는 별도 대메뉴였다.
// 공개 화면에서는 둘이 같은 '응선사 소개' 소메뉴에 나란히 서는데(SiteHeaderNav 의
// ABOUT_FIXED + introItems) 고치는 자리만 갈라져 있어, 소개 메뉴를 손보러 온 사람이
// 절반을 다른 대메뉴에서 찾아야 했다.
//
// 둘의 성격은 그대로 다르다 — 위는 문구·이미지 한 벌을 고치는 것이고 아래는 글이
// 쌓이는 게시판이다. 그래서 한 화면에 두되 가름막을 두고 나눈다.
export default async function AdminSite() {
  await requireSession();

  // 게시판 조회가 실패해도 홈페이지 문구 편집까지 막지는 않는다 — 위 카드는 DB 를
  // 보지 않으므로 여기서 throw 하면 멀쩡한 기능까지 같이 죽는다.
  let cats = [];
  let counts = {};
  try {
    cats = await listIntroCategories();
    counts = Object.fromEntries(
      await Promise.all(cats.map(async (c) => [c.slug, await countPostsBySlug(c.slug)]))
    );
  } catch (err) {
    console.error("소개 게시판 목록 조회 실패:", err);
  }

  return (
    <section>
      <h1 className="adm-h1">홈페이지 콘텐츠</h1>
      <p style={{ color: "var(--n-fg-3)", fontSize: "var(--fs-300)", marginBottom: "var(--sp-l)" }}>
        홈페이지 각 영역의 문구·이미지를 수정합니다. 저장하면 공개 화면에 바로 반영됩니다.
      </p>
      <div className="site-cards">
        {CONTENT_SECTIONS.map((s) => (
          <Link key={s.key} className="site-card" href={`/admin/site/${s.key}`}>
            <span className="site-card-l">{s.label}</span>
            <span className="site-card-go">편집 →</span>
          </Link>
        ))}
      </div>

      <h2
        className="adm-h1"
        style={{ fontSize: "var(--fs-500)", lineHeight: "var(--lh-500)", marginTop: "var(--sp-xxxl)" }}
      >
        소개 메뉴 게시판
      </h2>
      <p style={{ color: "var(--n-fg-3)", fontSize: "var(--fs-300)", marginBottom: "var(--sp-l)" }}>
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
