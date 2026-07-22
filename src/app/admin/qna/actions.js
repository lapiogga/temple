"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { answerQuestion, removeQuestion } from "@/lib/qna";

export async function answerQuestionAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const answer = (formData.get("answer") ?? "").toString().trim();
  if (!Number.isInteger(id) || id <= 0 || !answer) return;
  try {
    await answerQuestion(id, answer);
  } catch (err) {
    console.error("answerQuestion 실패:", err);
  }
  revalidatePath("/admin/qna");
  revalidatePath(`/qna/${id}`);
}

export async function deleteQuestionAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await removeQuestion(id);
  } catch (err) {
    console.error("removeQuestion 실패:", err);
  }
  revalidatePath("/admin/qna");
}
