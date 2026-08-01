import { notFound } from "next/navigation";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { requireSession } from "@/lib/session";
import { getPost } from "@/lib/posts";
import { getCategoryBySlug } from "@/lib/board-categories";
import BoardWriteForm from "../../BoardWriteForm";
import { updatePostAction } from "../../actions";
import { uploadPostImageAction } from "../../image-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: `글 수정 | ${SITE.name}` };

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// 글 수정 — 운영자 전용.
//
// 글쓰기(/board/write)와 같은 자리에 둔다. 관리자 틀 안이 아니라 여기인 이유는
// 본문 에디터·이미지 업로드가 전부 이쪽에 있어서다 — 소개 게시판의 '글쓰기'
// 버튼도 이미 /board/write 로 나간다(admin/intro/[slug]/page.js).
//
// requireSession() 은 운영자가 아니면 /login 으로 보낸다. 회원 세션으로는 들어올 수
// 없다 — 수정은 아직 운영자만 한다(board/actions.js 의 updatePostAction 주석 참고).
export default async function BoardEdit({ params }) {
  await requireSession();

  const id = parseId(params.id);
  if (!id) notFound();

  const post = await getPost(id);
  if (!post) notFound();

  // 카테고리를 못 찾아도(값이 어긋났거나 지워졌어도) 수정 자체는 막지 않는다.
  // 이름표가 없을 뿐이고, 사진 요건은 저장할 때 서버가 다시 본다.
  let category = null;
  try {
    category = await getCategoryBySlug(post.board);
  } catch (err) {
    console.error("카테고리 조회 실패:", err);
  }

  const isIntro = category?.group_key === "intro";
  const backHref = isIntro ? `/admin/intro/${post.board}` : "/admin/board";
  const backLabel = isIntro ? (category?.label ?? "소개 게시판") : "게시판 글 관리";

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        {/* 본문 에디터가 들어가므로 글쓰기와 같이 최대 폭을 쓴다. */}
        <div className="wrap wide">
          <PageHead title="글 수정" ki="Edit" back={{ href: backHref, label: backLabel }} />
          <BoardWriteForm
            action={updatePostAction}
            uploadAction={uploadPostImageAction}
            postId={post.id}
            initialTitle={post.title}
            initialBody={post.body}
            boardLabel={category?.label ?? post.board}
            cancelHref={backHref}
          />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
