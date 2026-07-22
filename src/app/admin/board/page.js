import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listAllPosts, BOARD_LABEL } from "@/lib/posts";
import { deletePostAction } from "./actions";

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default async function BoardAdmin() {
  await requireSession();
  const posts = await listAllPosts();

  return (
    <section>
      <h1 className="adm-h1">게시판 관리</h1>
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
                  <td>{BOARD_LABEL[p.board] ?? p.board}</td>
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
