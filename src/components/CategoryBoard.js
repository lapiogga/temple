import Link from "next/link";
import BackLink from "@/components/BackLink";
import { notFound } from "next/navigation";
import { listPosts, listPostsWithThumb } from "@/lib/posts";
import { getCategoryBySlug, canWrite } from "@/lib/board-categories";
import { getViewer } from "@/lib/viewer";
import Pager from "@/components/Pager";

// 소개 메뉴에 딸린 게시판(법문·휴심선원)을 자기 주소에서 보여 준다.
// 글·글쓰기·상세는 /board 와 같은 테이블과 같은 액션을 쓴다. 다른 것은
// 목록 생김새(layout)와 누가 쓸 수 있는지(write_role)뿐이다.

const PER_PAGE = 12;

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export default async function CategoryBoard({ slug, kicker, basePath, page = 1 }) {
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const isCard = category.layout === "card";

  const [posts, viewer] = await Promise.all([
    isCard ? listPostsWithThumb({ board: slug }) : listPosts({ board: slug }),
    getViewer(),
  ]);
  const writable = canWrite(category, {
    isAdmin: viewer.isAdmin,
    isApprovedMember: viewer.isApprovedMember,
  });

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const cur = Math.min(totalPages, Math.max(1, Number(page) || 1));
  const paged = posts.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  return (
    <section className="screen top">
      <div className="wrap wide">
        <BackLink href="/" label="홈으로" />
        <div className="sec-head">
          <div>
            <div className="ki">{kicker}</div>
            <h2>{category.label}</h2>
          </div>
          {writable ? (
            <Link className="btn btn-primary btn-sm" href={`/board/write?board=${encodeURIComponent(slug)}`}>
              글쓰기
            </Link>
          ) : null}
        </div>

        {paged.length === 0 ? (
          <p className="adm-empty">등록된 글이 없습니다.</p>
        ) : isCard ? (
          <div className="gal-grid">
            {paged.map((p) => (
              <Link key={p.id} className="gal-card" href={`/board/${p.id}`}>
                <div className="cover">
                  {p.thumb_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumb_url} alt="" />
                  ) : (
                    <span className="cover-empty">이미지 없음</span>
                  )}
                </div>
                <div className="meta">
                  <h3>{p.title}</h3>
                  <div className="cnt">{p.author_name} · {fmt(p.created_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>제목</th>
                <th className="c-author th-author">작성자</th>
                <th className="c-date">작성일</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.id}>
                  <td className="c-title"><Link href={`/board/${p.id}`}>{p.title}</Link></td>
                  <td className="c-author">{p.author_name}</td>
                  <td className="c-date">{fmt(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pager basePath={basePath} page={cur} totalPages={totalPages} />
      </div>
    </section>
  );
}
