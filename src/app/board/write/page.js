import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { getViewer } from "@/lib/viewer";
import { listVisibleCategories, canWrite } from "@/lib/board-categories";
import BoardWriteForm from "../BoardWriteForm";
import { createPostAction } from "../actions";
import { uploadPostImageAction } from "../image-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: `글쓰기 | ${SITE.name}` };

export default async function BoardWrite({ searchParams }) {
  // 운영자도 글을 쓸 수 있다. 예전에는 requireMember() 라 운영자로 로그인한
  // 상태에서 글쓰기를 누르면 회원 로그인 화면으로 튕겼다.
  const viewer = await getViewer();
  if (viewer.memberNeedsReset) redirect("/member-login/reset");
  if (!viewer.isAdmin && !viewer.isApprovedMember) redirect("/member-login");

  const isAdmin = viewer.isAdmin;
  const isApprovedMember = viewer.isApprovedMember;
  // 두 쿠키가 동시에 살아 있을 수 있으므로 어떤 이름으로 올라가는지 미리 보여준다.
  // 우선순위는 createPostAction 과 같아야 한다 — 운영자 우선.
  const authorName = isAdmin ? "종무소" : viewer.memberName || "회원";

  let categories = [];
  try {
    categories = await listVisibleCategories();
  } catch (err) {
    console.error("카테고리 조회 실패:", err);
  }
  // 쓸 수 있는 게시판만 선택지에 남긴다. 서버 액션에서 한 번 더 검사한다.
  const writable = categories.filter((c) => canWrite(c, { isAdmin, isApprovedMember }));

  const wanted = searchParams?.board;
  const defaultBoard = writable.some((c) => c.slug === wanted) ? wanted : writable[0]?.slug;

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
          {writable.length === 0 ? (
            <p className="adm-empty">
              {categories.some((c) => c.slug === wanted)
                ? "이 게시판은 운영자만 글을 쓸 수 있습니다."
                : categories.length === 0
                  ? "글을 올릴 수 있는 게시판이 없습니다. 종무소에 문의해 주세요."
                  : "지금 계정으로는 글을 쓸 수 있는 게시판이 없습니다."}
            </p>
          ) : (
            <BoardWriteForm
              action={createPostAction}
              uploadAction={uploadPostImageAction}
              defaultBoard={defaultBoard}
              categories={writable}
              authorName={authorName}
            />
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
