"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/member-session";
import { getMemberById } from "@/lib/members";
import { createPost } from "@/lib/posts";
import { sanitizeHtml, stripTags } from "@/lib/sanitize";

const schema = z.object({
  board: z.enum(["free", "story"]),
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  body: z.string().max(60000),
});

export async function createPostAction(prevState, formData) {
  const session = await requireMember();
  const m = await getMemberById(session.memberId);
  if (!m || m.status !== "approved") {
    return { error: "승인된 회원만 글을 쓸 수 있습니다." };
  }

  const parsed = schema.safeParse({
    board: formData.get("board") === "story" ? "story" : "free",
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
      board: parsed.data.board,
      title: parsed.data.title,
      body,
      authorMemberId: m.id,
      authorName: m.nickname || m.name,
    });
  } catch (err) {
    console.error("createPost 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  redirect(`/board/${post.id}`);
}
