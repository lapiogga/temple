import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listCategories, countPostsBySlug } from "@/lib/board-categories";
import CategoryManager from "./CategoryManager";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleHiddenAction,
  deleteCategoryAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function BoardCategoriesAdmin() {
  await requireSession();
  const categories = await listCategories("board");
  // 삭제 가능 여부를 화면에서 미리 보여주기 위한 글 수.
  const counts = Object.fromEntries(
    await Promise.all(categories.map(async (c) => [c.slug, await countPostsBySlug(c.slug)]))
  );

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">게시판 관리</h1>
        <Link href="/admin/board" className="btn btn-ghost btn-sm">글 목록</Link>
      </div>
      <p style={{ color: "var(--n-fg-3)", marginBottom: "var(--sp-l)" }}>
        게시판(/board)의 구분 탭을 관리합니다. 응선사 소개 메뉴에 딸린 게시판(법문·휴심선원)은 별개이며 <b>소개 게시판</b> 메뉴에서 다룹니다. <b>주소값</b>은 목록 주소에 그대로
        쓰입니다(<code>/board?board=free</code>). 글이 남아 있는 게시판은 삭제되지 않으며,
        대신 <b>숨김</b>으로 두면 목록 탭과 글쓰기 선택지에서 빠지고 기존 글은 주소로 계속 열립니다.
      </p>
      <CategoryManager
        categories={categories}
        counts={counts}
        onCreate={createCategoryAction}
        onUpdate={updateCategoryAction}
        onToggle={toggleHiddenAction}
        onDelete={deleteCategoryAction}
      />
    </section>
  );
}
