"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember, getMemberSession } from "@/lib/member-session";
import {
  getMemberById,
  getMemberPasswordHash,
  updateMemberNickname,
  updateMemberPhone,
  setMemberPassword,
  withdrawMember,
} from "@/lib/members";
import { digitsOnly, isValidPhone } from "@/lib/phone";

// 어떤 항목을 본인이 바꿀 수 있게 할지의 기준
//
//  · 닉네임  — 게시판 표시명일 뿐이라 본인이 자유롭게 바꾼다.
//  · 휴대폰  — 비밀번호 재설정의 본인확인 근거다(member-login/reset 이 휴대폰 +
//              생년월일로 확인한다). 그래서 현재 비밀번호를 확인한 뒤에만 바꾼다.
//  · 비밀번호 — 현재 비밀번호 확인 필수.
//  · 탈퇴    — 현재 비밀번호 확인 필수. 되돌릴 수 없다.
//  · 성명·생년월일·성별 — 본인이 못 바꾼다. 생년월일은 휴대폰과 함께 본인확인 근거라
//    자기가 바꿀 수 있으면 그 확인이 의미를 잃는다. 성명은 신도 명부의 기준이다.
//    정정이 필요하면 종무소가 확인 후 처리한다(방침 §7 에 그렇게 적어 두었다).

// 현재 비밀번호를 확인한다. 맞으면 회원 행을 돌려준다.
async function verifyCurrentPassword(memberId, password) {
  const hash = await getMemberPasswordHash(memberId);
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

// 세션이 살아 있어도 그 사이 종무소가 정지·거절했을 수 있다. 매번 최신 상태를 본다.
async function requireActiveMember() {
  const session = await requireMember();
  const m = await getMemberById(session.memberId);
  if (!m || m.status !== "approved" || m.must_reset_password) return null;
  return m;
}

const nicknameSchema = z.string().trim().min(1, "닉네임을 입력하세요.").max(30);

export async function updateNicknameAction(prevState, formData) {
  const m = await requireActiveMember();
  if (!m) return { error: "다시 로그인해 주세요." };

  const parsed = nicknameSchema.safeParse(formData.get("nickname") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "닉네임을 확인하세요." };
  if (parsed.data === m.nickname) return { ok: true, message: "바뀐 내용이 없습니다." };

  try {
    await updateMemberNickname(m.id, parsed.data);
  } catch (err) {
    console.error("닉네임 변경 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  // 상단바가 닉네임을 들고 있고, 게시판 목록의 작성자명도 함께 바뀐다.
  const session = await getMemberSession();
  session.name = parsed.data;
  await session.save();

  ["/mypage", "/board", "/qna"].forEach((p) => revalidatePath(p));
  return { ok: true, message: "닉네임을 바꿨습니다. 지난 글의 표시명도 함께 바뀝니다." };
}

const phoneSchema = z.object({
  phone: z.string().trim().transform(digitsOnly).refine(isValidPhone, "휴대폰 번호 형식을 확인하세요."),
  currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
});

export async function updatePhoneAction(prevState, formData) {
  const m = await requireActiveMember();
  if (!m) return { error: "다시 로그인해 주세요." };

  const parsed = phoneSchema.safeParse({
    phone: formData.get("phone") ?? "",
    currentPassword: formData.get("currentPassword") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  if (!(await verifyCurrentPassword(m.id, parsed.data.currentPassword))) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  try {
    await updateMemberPhone(m.id, parsed.data.phone);
  } catch (err) {
    console.error("휴대폰 변경 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath("/mypage");
  return { ok: true, message: "휴대폰 번호를 바꿨습니다." };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
    password: z.string().min(8, "새 비밀번호는 8자 이상입니다.").max(72),
    passwordConfirm: z.string().max(72),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "새 비밀번호가 서로 다릅니다.",
    path: ["passwordConfirm"],
  });

export async function updatePasswordAction(prevState, formData) {
  const m = await requireActiveMember();
  if (!m) return { error: "다시 로그인해 주세요." };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    password: formData.get("password") ?? "",
    passwordConfirm: formData.get("passwordConfirm") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  if (!(await verifyCurrentPassword(m.id, parsed.data.currentPassword))) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }
  if (parsed.data.currentPassword === parsed.data.password) {
    return { error: "지금 쓰는 비밀번호와 다른 것으로 정해 주세요." };
  }

  try {
    await setMemberPassword(m.id, await bcrypt.hash(parsed.data.password, 12));
  } catch (err) {
    console.error("비밀번호 변경 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  return { ok: true, message: "비밀번호를 바꿨습니다." };
}

const withdrawSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
  confirm: z.string(),
});

export async function withdrawAction(prevState, formData) {
  const m = await requireActiveMember();
  if (!m) return { error: "다시 로그인해 주세요." };

  const parsed = withdrawSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  // 되돌릴 수 없는 일이라 비밀번호만으로는 부족하다고 봤다.
  // 문구를 그대로 적게 해서 '실수로 눌렀다' 를 걸러 낸다.
  if (parsed.data.confirm.trim() !== "탈퇴합니다") {
    return { error: '확인란에 "탈퇴합니다" 를 그대로 입력해 주세요.' };
  }
  if (!(await verifyCurrentPassword(m.id, parsed.data.currentPassword))) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  try {
    // 어떤 입력과도 맞지 않는 해시. 익명화 뒤 그 계정으로 다시 들어올 수 없어야 한다.
    const unusable = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    await withdrawMember(m.id, unusable);
  } catch (err) {
    console.error("탈퇴 처리 실패:", err);
    return { error: "처리 중 오류가 발생했습니다. 종무소에 문의해 주세요." };
  }

  const session = await getMemberSession();
  session.destroy();

  ["/mypage", "/board", "/qna"].forEach((p) => revalidatePath(p));
  redirect("/?withdrawn=1");
}
