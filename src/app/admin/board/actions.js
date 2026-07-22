"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { removePost } from "@/lib/posts";

export async function deletePostAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await removePost(id);
  } catch (err) {
    console.error("removePost 실패:", err);
  }
  revalidatePath("/admin/board");
}
