import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { getMemberSession } from "@/lib/member-session";
import { getSession } from "@/lib/session";
import { listVisibleCategories } from "@/lib/board-categories";
import BoardWriteForm from "../BoardWriteForm";
import { createPostAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: `글쓰기 | ${SITE.name}` };

export default async function BoardWrite({ searchParams }) {
  // 운영자도 글을 쓸 수 있다. 예전에는 requireMember() 라 운영자로 로그인한
  // 상태에서 글쓰기를 누르면 회원 로그인 화면으로 튕겼다.
  const [memberSession, adminSession] = await Promise.all([getMemberSession(), getSession()]);
  if (!memberSession.isLoggedIn && !adminSession.isLoggedIn) redirect("/member-login");

  let categories = [];
  try {
    categories = await listVisibleCategories();
  } catch (err) {
    console.error("카테고리 조회 실패:", err);
  }

  const wanted = searchParams?.board;
  const defaultBoard = categories.some((c) => c.slug === wanted) ? wanted : categories[0]?.slug;

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        {/* 본문 에디터가 들어가므로 화면이 허용하는 최대 폭을 쓴다. 예전에는 wrap 을
            760px 로 조인 위에 폼에 .auth-wide(560px)까지 걸려 에디터가 손바닥만 했다. */}
        <div className="wrap wide">
          <div className="sec-head">
            <div><div className="ki">Write</div><h2>글쓰기</h2></div>
          </div>
          {categories.length === 0 ? (
            <p className="adm-empty">
              글을 올릴 수 있는 게시판이 없습니다. 종무소에 문의해 주세요.
            </p>
          ) : (
            <BoardWriteForm
              action={createPostAction}
              defaultBoard={defaultBoard}
              categories={categories}
            />
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
