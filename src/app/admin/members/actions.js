"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  setMemberStatus,
  flagPasswordReset,
  getMemberById,
  updateMemberByAdmin,
} from "@/lib/members";
import { digitsOnly, isValidPhone } from "@/lib/phone";

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

// 회원정보 정정.
//
// 성명·생년월일은 본인이 못 바꾸는 값이라(본인확인 근거) 종무소가 확인 후 고친다.
// 휴대폰도 본인이 바꾸려면 현재 비밀번호가 필요한데, 비밀번호를 잊은 상태에서 번호까지
// 바뀌었다면 그 길이 막힌다 — 그 경우의 유일한 구제 경로가 이 화면이다.
//
// 아이디는 못 바꾼다. 로그인 식별자라 바꾸면 회원이 예전 아이디로 들어오려다 실패하고,
// 그 사실을 알릴 방법이 지금 없다(문자 발송 미연동).
const memberEditSchema = z.object({
  name: z.string().trim().min(1, "성명을 입력하세요.").max(50),
  nickname: z.string().trim().min(1, "닉네임을 입력하세요.").max(30),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일을 선택하세요.")
    .refine((v) => {
      // 가입 폼과 같은 검사. 1064 같은 값이 들어가면 본인확인이 영영 안 된다.
      const y = Number(v.slice(0, 4));
      return y >= 1900 && y <= new Date().getFullYear();
    }, "생년월일의 연도를 확인하세요."),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().trim().transform(digitsOnly).refine(isValidPhone, "휴대폰 번호 형식을 확인하세요."),
});

export async function updateMemberAction(id, prevState, formData) {
  await requireSession();

  const target = await getMemberById(id);
  if (!target) return { error: "회원을 찾을 수 없습니다." };
  // 탈퇴한 회원은 개인정보가 이미 지워졌다. 여기서 다시 채워 넣으면 익명화가 무의미해진다.
  if (target.status === "withdrawn") return { error: "탈퇴한 회원은 정정할 수 없습니다." };

  const parsed = memberEditSchema.safeParse({
    name: formData.get("name") ?? "",
    nickname: formData.get("nickname") ?? "",
    birthDate: formData.get("birthDate") ?? "",
    gender: formData.get("gender") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  try {
    await updateMemberByAdmin(id, parsed.data);
  } catch (err) {
    console.error("회원정보 정정 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  // 닉네임이 바뀌면 게시판 목록의 작성자명도 함께 바뀐다.
  ["/admin/members", "/board", "/qna"].forEach((p) => revalidatePath(p));
  redirect("/admin/members");
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
