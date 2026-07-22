"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createQuestion, getQuestion } from "@/lib/qna";

const schema = z.object({
  authorName: z.string().trim().min(1, "이름을 입력하세요.").max(50),
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  body: z.string().trim().min(1, "내용을 입력하세요.").max(10000),
  phone: z.string().trim().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "휴대폰 번호 형식을 확인하세요."),
});

export async function createQuestionAction(prevState, formData) {
  const phoneVerified = formData.get("phoneVerified") === "true";
  if (!phoneVerified) return { error: "휴대폰 본인인증을 완료해 주세요." };

  const isSecret = formData.get("isSecret") === "on";
  const secretCode = (formData.get("secretCode") ?? "").toString().trim();
  if (isSecret && !/^\d{4,20}$/.test(secretCode)) {
    return { error: "비밀글 비밀번호(숫자 4자 이상)를 입력하세요." };
  }

  const parsed = schema.safeParse({
    authorName: formData.get("authorName") ?? "",
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  const secretHash = isSecret ? await bcrypt.hash(secretCode, 10) : null;
  try {
    await createQuestion({
      title: parsed.data.title,
      body: parsed.data.body,
      authorName: parsed.data.authorName,
      phone: parsed.data.phone,
      isSecret,
      secretHash,
    });
  } catch (err) {
    console.error("createQuestion 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  redirect("/qna");
}

// 비밀글 열람: 코드 확인 후 내용 반환
export async function revealSecretAction(id, prevState, formData) {
  const code = (formData.get("code") ?? "").toString();
  let q = null;
  try {
    q = await getQuestion(id);
  } catch (err) {
    console.error("비밀글 조회 실패:", err);
  }
  if (!q || !q.is_secret) return { error: "잘못된 접근입니다." };
  const ok = q.secret_hash && (await bcrypt.compare(code, q.secret_hash));
  if (!ok) return { error: "비밀번호가 일치하지 않습니다." };
  return {
    ok: true,
    q: {
      title: q.title,
      body: q.body,
      authorName: q.author_name,
      createdAt: new Date(q.created_at).toISOString(),
      answer: q.answer,
      answeredAt: q.answered_at ? new Date(q.answered_at).toISOString() : null,
    },
  };
}
