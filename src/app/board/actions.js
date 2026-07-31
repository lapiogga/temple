"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { createPost } from "@/lib/posts";
import { getCategoryBySlug, canWrite } from "@/lib/board-categories";
import { sanitizeHtml, stripTags } from "@/lib/sanitize";

// board 는 board_categories 에서 오므로 z.enum 으로 고정할 수 없다. 아래에서 조회로 검증한다.
const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  body: z.string().max(60000),
});

export async function createPostAction(prevState, formData) {
  // 액션은 페이지 트리 밖 독립 엔드포인트라 화면 가드와 별개로 여기서 다시 본다.
  // getViewer 는 쿠키만이 아니라 계정이 지금도 유효한지(삭제·정지·비밀번호
  // 초기화 대기)를 DB 로 확인한다.
  const viewer = await getViewer();

  let authorMemberId = null;
  let authorName = null;

  // 운영자 세션이 우선이다. 두 쿠키(temple_admin · temple_member)는 서로 독립이라
  // 같은 브라우저에 동시에 살아 있을 수 있는데, 회원을 먼저 보면 관리자 화면에서
  // 글을 써도 회원 닉네임으로 기록된다(실제로 그렇게 올라간 글이 있었다).
  if (viewer.isAdmin) {
    // 운영자는 members 행이 없으므로 author_member_id 는 null 로 둔다(컬럼이 nullable).
    authorName = "종무소";
  } else if (viewer.isApprovedMember) {
    authorMemberId = viewer.memberId;
    // 실명은 비공개다. 게시판에는 닉네임만 노출한다.
    authorName = viewer.memberName;
  } else if (viewer.memberNeedsReset) {
    return { error: "비밀번호가 초기화되었습니다. 새 비밀번호를 정한 뒤 이용해 주세요." };
  } else {
    redirect("/member-login");
  }

  const slug = String(formData.get("board") ?? "");
  const category = await getCategoryBySlug(slug);
  if (!category || category.is_hidden) {
    return { error: "존재하지 않는 게시판입니다." };
  }
  // 게시판마다 쓸 수 있는 사람이 다르다(write_role). 화면에서 선택지를 감추는
  // 것만으로는 막히지 않는다 — 액션은 페이지 트리 밖의 독립 엔드포인트다.
  if (!canWrite(category, { isAdmin: viewer.isAdmin, isApprovedMember: viewer.isApprovedMember })) {
    return { error: `'${category.label}' 은 운영자만 글을 쓸 수 있습니다.` };
  }

  const parsed = schema.safeParse({
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  const body = sanitizeHtml(parsed.data.body);
  if (stripTags(body).length < 1) return { error: "본문을 입력하세요." };

  let post;
  try {
    post = await createPost({
      board: category.slug,
      title: parsed.data.title,
      body,
      authorMemberId,
      authorName,
    });
  } catch (err) {
    console.error("createPost 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  redirect(`/board/${post.id}`);
}
