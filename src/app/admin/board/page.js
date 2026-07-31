import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listAllPosts } from "@/lib/posts";
import { getLabelMap, listCategories } from "@/lib/board-categories";
import { formatDateCompact as fmt } from "@/lib/format";
import { deletePostAction } from "./actions";

export default async function BoardAdmin() {
  await requireSession();
  const [allPosts, labelMap, boardCats] = await Promise.all([
    listAllPosts(),
    getLabelMap(),
    listCategories("board"),
  ]);
  // 소개 메뉴 게시판(법문·휴심선원)의 글은 '소개 게시판' 메뉴에서 따로 다룬다.
  const boardSlugs = new Set(boardCats.map((c) => c.slug));
  const posts = allPosts.filter((p) => boardSlugs.has(p.board));

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">게시판 글 관리</h1>
        <Link href="/admin/board/categories" className="btn btn-ghost btn-sm">게시판(카테고리) 관리</Link>
      </div>
      {posts.length === 0 ? (
        <p className="adm-empty">등록된 글이 없습니다.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>게시판</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th className="adm-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>{labelMap[p.board] ?? p.board}</td>
                  <td className="adm-title-cell">
                    <Link href={`/board/${p.id}`} target="_blank">{p.title}</Link>
                  </td>
                  <td>{p.author_name}</td>
                  <td>{fmt(p.created_at)}</td>
                  <td className="adm-actions">
                    <form action={deletePostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="adm-link-btn danger">삭제</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
