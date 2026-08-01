"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createMember, loginIdExists, nicknameExists } from "@/lib/members";
import { digitsOnly, isValidPhone } from "@/lib/phone";

const schema = z.object({
  loginId: z
    .string().trim().min(4, "아이디는 4자 이상입니다.").max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문·숫자·_ 만 사용합니다."),
  password: z.string().min(8, "비밀번호는 8자 이상입니다.").max(72),
  name: z.string().trim().min(1, "성명을 입력하세요.").max(50),
  nickname: z.string().trim().min(1, "닉네임을 입력하세요.").max(30),
  // 연도 범위를 막지 않으면 1064 같은 값이 그대로 저장된다(실제로 그런 가입 건이 있었다).
  // 본인 확인에 쓰이는 값이라 한 번 잘못 들어가면 회원이 영영 확인을 통과하지 못한다.
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일을 선택하세요.")
    .refine((v) => {
      const y = Number(v.slice(0, 4));
      return y >= 1900 && y <= new Date().getFullYear();
    }, "생년월일의 연도를 확인하세요."),
  gender: z.enum(["male", "female", "other"]),
  // 화면에서 하이픈이 자동으로 붙지만 전송되는 값은 숫자만이다. 서버에서도 숫자만 받는다.
  phone: z.string().trim().transform(digitsOnly)
    .refine(isValidPhone, "휴대폰 번호 형식을 확인하세요."),
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
    nickname: formData.get("nickname") ?? "",
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
    if (await nicknameExists(parsed.data.nickname)) {
      // 닉네임은 게시판에 보이는 이름이라 같은 이름이 둘이면 글쓴이를 구별할 수 없다.
      // 화면의 '중복 확인' 은 안내일 뿐이고 누르지 않아도 제출된다 — 여기가 실제 방어선이다.
      return { error: "이미 쓰이는 닉네임입니다. 다른 이름을 정해 주세요." };
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await createMember({
      loginId: parsed.data.loginId,
      passwordHash,
      name: parsed.data.name,
      nickname: parsed.data.nickname,
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
