"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createMember, loginIdExists } from "@/lib/members";

const schema = z.object({
  loginId: z
    .string().trim().min(4, "아이디는 4자 이상입니다.").max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문·숫자·_ 만 사용합니다."),
  password: z.string().min(8, "비밀번호는 8자 이상입니다.").max(72),
  name: z.string().trim().min(1, "성명을 입력하세요.").max(50),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일을 선택하세요."),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().trim().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "휴대폰 번호 형식을 확인하세요."),
});

export async function joinAction(prevState, formData) {
  const agreedTerms = formData.get("agreeTerms") === "on";
  const agreedPrivacy = formData.get("agreePrivacy") === "on";
  const phoneVerified = formData.get("phoneVerified") === "true";

  if (!agreedTerms || !agreedPrivacy) {
    return { error: "서비스 이용약관과 개인정보 보호정책에 모두 동의해야 가입할 수 있습니다." };
  }
  if (!phoneVerified) {
    return { error: "휴대폰 본인인증을 완료해 주세요." };
  }

  const parsed = schema.safeParse({
    loginId: formData.get("loginId") ?? "",
    password: formData.get("password") ?? "",
    name: formData.get("name") ?? "",
    birthDate: formData.get("birthDate") ?? "",
    gender: formData.get("gender") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  try {
    if (await loginIdExists(parsed.data.loginId)) {
      return { error: "이미 사용 중인 아이디입니다." };
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await createMember({
      loginId: parsed.data.loginId,
      passwordHash,
      name: parsed.data.name,
      birthDate: parsed.data.birthDate,
      gender: parsed.data.gender,
      phone: parsed.data.phone,
    });
  } catch (err) {
    console.error("회원가입 실패:", err);
    return { error: "가입 처리 중 오류가 발생했습니다." };
  }

  redirect("/join/done");
}
