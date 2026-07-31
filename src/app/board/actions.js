"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/member-session";
import { getSession } from "@/lib/session";
import { getMemberById } from "@/lib/members";
import { createPost } from "@/lib/posts";
import { getCategoryBySlug } from "@/lib/board-categories";
import { sanitizeHtml, stripTags } from "@/lib/sanitize";

// board 는 board_categories 에서 오므로 z.enum 으로 고정할 수 없다. 아래에서 조회로 검증한다.
const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  body: z.string().max(60000),
});

export async function createPostAction(prevState, formData) {
  // 승인된 회원 또는 운영자. 예전에는 requireMember() 뿐이라 운영자로 로그인하면
  // 글쓰기 자체가 불가능했다(회원 로그인 화면으로 튕겼다).
  const [memberSession, adminSession] = await Promise.all([getMemberSession(), getSession()]);

  let authorMemberId = null;
  let authorName = null;

  if (memberSession.isLoggedIn) {
    const m = await getMemberById(memberSession.memberId);
    if (!m || m.status !== "approved") {
      return { error: "승인된 회원만 글을 쓸 수 있습니다." };
    }
    authorMemberId = m.id;
    // 실명은 비공개다. 게시판에는 닉네임만 노출한다.
    authorName = m.nickname || m.name;
  } else if (adminSession.isLoggedIn) {
    // 운영자는 members 행이 없으므로 author_member_id 는 null 로 둔다(컬럼이 nullable).
    // 운영자 개인 이름 대신 기관명으로 적는다.
    authorName = "종무소";
  } else {
    redirect("/member-login");
  }

  const slug = String(formData.get("board") ?? "");
  const category = await getCategoryBySlug(slug);
  if (!category || category.is_hidden) {
    return { error: "존재하지 않는 게시판입니다." };
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
