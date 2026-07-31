"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getMemberForReset, setMemberPassword } from "@/lib/members";
import { digitsOnly } from "@/lib/phone";
import { createAttemptLimiter } from "@/lib/attempt-limit";

// 본인확인이 '휴대폰 + 생년월일' 두 가지뿐이라 시도 제한이 없으면 사실상 뚫린다.
// 아이디는 알려진 값으로 보아야 하고, 생년월일은 경우의 수가 3만 남짓이다
// (성인 기준 100년 × 365). 휴대폰까지 안다면 — 지인·명부 유출이면 흔한 일이다 —
// 생년월일만 훑어 남의 비밀번호를 새로 정할 수 있다.
// 이 경로의 성공은 '계정 탈취' 라서 로그인 실패보다 훨씬 엄하게 잡는다.
const resetLimiter = createAttemptLimiter({ windowMs: 30 * 60 * 1000, max: 5 });

const schema = z
  .object({
    loginId: z.string().trim().min(1, "아이디를 입력하세요.").max(30),
    phone: z.string().trim().min(1, "휴대폰 번호를 입력하세요.").max(20),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일을 선택하세요."),
    password: z.string().min(8, "비밀번호는 8자 이상입니다.").max(72),
    passwordConfirm: z.string().max(72),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "새 비밀번호가 서로 다릅니다.",
    path: ["passwordConfirm"],
  });

// 어떤 항목이 틀렸는지 알려주지 않는다. 알려주면 가입정보를 하나씩 맞춰볼 수 있다.
const GENERIC = "입력하신 정보가 가입 정보와 맞지 않습니다. 종무소에 문의해 주세요.";

export async function resetPasswordAction(prevState, formData) {
  const parsed = schema.safeParse({
    loginId: formData.get("loginId") ?? "",
    phone: formData.get("phone") ?? "",
    birthDate: formData.get("birthDate") ?? "",
    password: formData.get("password") ?? "",
    passwordConfirm: formData.get("passwordConfirm") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  // 아이디 기준으로 센다. 계정이 실제로 있는지와 무관하게 같은 문구를 돌려주므로
  // 이 응답으로 계정 존재 여부가 새지는 않는다.
  const key = parsed.data.loginId.toLowerCase();
  if (resetLimiter.blocked(key)) {
    return { error: "시도가 너무 많습니다. 잠시 후 다시 시도하거나 종무소에 문의해 주세요." };
  }

  let m = null;
  try {
    m = await getMemberForReset(parsed.data.loginId);
  } catch (err) {
    console.error("재설정 조회 실패:", err);
    return { error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  // 이 경로는 '종무소가 초기화해 준 계정' 에만 열린다. 아무 계정이나 가입정보만
  // 맞으면 비밀번호를 바꿀 수 있으면 안 되기 때문이다.
  const matched =
    !!m &&
    m.must_reset_password &&
    // 하이픈 유무·공백 차이로 어긋나지 않게 양쪽 다 숫자만 남겨 비교한다.
    digitsOnly(m.phone) === digitsOnly(parsed.data.phone) &&
    m.birth_date === parsed.data.birthDate;

  if (!matched) {
    resetLimiter.recordFail(key);
    return { error: GENERIC };
  }

  try {
    await setMemberPassword(m.id, await bcrypt.hash(parsed.data.password, 12));
  } catch (err) {
    console.error("비밀번호 저장 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  resetLimiter.clear(key);
  redirect("/member-login?reset=done");
}
