"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { setMemberStatus, flagPasswordReset } from "@/lib/members";

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

// 비밀번호 초기화. 기존 해시를 아무도 맞출 수 없는 난수 해시로 덮고 표시를 세운다.
// 이 뒤로 회원은 /member-login/reset 에서 가입정보(휴대폰·생년월일)를 확인한 뒤
// 새 비밀번호를 직접 정한다. 종무소가 임시 비밀번호를 전달할 필요가 없다.
export async function resetMemberPasswordAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    const unusable = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    await flagPasswordReset(id, unusable);
  } catch (err) {
    console.error("비밀번호 초기화 실패:", err);
  }
  revalidatePath("/admin/members");
}
