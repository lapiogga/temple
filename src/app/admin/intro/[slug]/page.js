import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCategoryBySlug } from "@/lib/board-categories";
import { listPosts, listPostImages } from "@/lib/posts";
import SettingsForm from "./SettingsForm";
import { updateIntroSettingsAction, deleteIntroPostAction } from "../actions";

export const dynamic = "force-dynamic";

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default async function IntroBoardAdmin({ params }) {
  await requireSession();
  const cat = await getCategoryBySlug(params.slug);
  // 게시판(/board) 카테고리는 이 화면에서 다루지 않는다 — /admin/board/categories 소관.
  if (!cat || cat.group_key !== "intro") notFound();

  const posts = await listPosts({ board: cat.slug });
  const imgCounts = Object.fromEntries(
    await Promise.all(posts.map(async (p) => [p.id, (await listPostImages(p.id)).length]))
  );

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">{cat.label}</h1>
        <div className="adm-actions">
          <Link href={`/board/write?board=${encodeURIComponent(cat.slug)}`} className="btn btn-primary btn-sm">
            글쓰기
          </Link>
          <Link href={`/about/${cat.slug}`} target="_blank" className="btn btn-ghost btn-sm">
            화면 보기 ↗
          </Link>
          <Link href="/admin/intro" className="btn btn-ghost btn-sm">목록</Link>
        </div>
      </div>

      <SettingsForm action={updateIntroSettingsAction} category={cat} />

      <h2 className="adm-h1" style={{ fontSize: "var(--fs-500)", lineHeight: "var(--lh-500)", marginTop: "var(--sp-xxxl)" }}>
        글 {posts.length}건
      </h2>
      {posts.length === 0 ? (
        <p className="adm-empty">등록된 글이 없습니다. 위 <b>글쓰기</b> 로 첫 글을 올리세요.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>작성자</th>
                <th>이미지</th>
                <th>작성일</th>
                <th className="adm-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td className="adm-title-cell">
                    <Link href={`/board/${p.id}`} target="_blank">{p.title}</Link>
                  </td>
                  <td>{p.author_name}</td>
                  <td>{imgCounts[p.id] ?? 0}장</td>
                  <td>{fmt(p.created_at)}</td>
                  <td className="adm-actions">
                    <form action={deleteIntroPostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="slug" value={cat.slug} />
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
