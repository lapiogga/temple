"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { setMemberStatus } from "@/lib/members";

async function setStatus(formData, status) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await setMemberStatus(id, status);
  } catch (err) {
    console.error("member status 변경 실패:", err);
  }
  revalidatePath("/admin/members");
}

export async function approveMemberAction(formData) {
  await setStatus(formData, "approved");
}
export async function rejectMemberAction(formData) {
  await setStatus(formData, "rejected");
}
export async function suspendMemberAction(formData) {
  await setStatus(formData, "suspended");
}
