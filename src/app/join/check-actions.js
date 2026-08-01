"use server";

import { z } from "zod";
import { loginIdExists, nicknameExists } from "@/lib/members";
import { createAttemptLimiter } from "@/lib/attempt-limit";

// 가입 화면의 '중복 확인'.
//
// 이 창구는 "이 아이디가 이미 있는가" 를 알려 준다. 그 자체가 계정 존재를 확인해 주는
// 창구이므로 마음껏 열어 두면 아이디를 훑을 수 있다. 다만 가입 폼에서 중복을 미리
// 알려 주지 않으면, 사용자는 나머지를 다 채우고 제출한 뒤에야 되돌아와야 한다 —
// 그리고 그때도 결국 같은 사실을 알게 된다. 없앨 수 없는 정보라면 훑기만 늦춘다.
//
// 그래서 IP 가 아니라 '이 브라우저 세션이 얼마나 많이 물었는가' 로 제한한다고 해도
// 서버는 그것을 신뢰할 수 없으므로, 여기서는 값 자체를 키로 삼지 않고 호출 횟수를
// 한 덩어리로 묶어 센다. nginx 의 /join limit_req(POST 분당 10회)가 앞단에 있고
// 이것은 그 뒤의 두 번째 층이다.
const probe = createAttemptLimiter({ windowMs: 10 * 60 * 1000, max: 60 });

const loginIdSchema = z
  .string()
  .trim()
  .min(4, "아이디는 4자 이상입니다.")
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "아이디는 영문·숫자·_ 만 사용합니다.");

const nicknameSchema = z.string().trim().min(1, "닉네임을 입력하세요.").max(30);

export async function checkAvailabilityAction(kind, value) {
  // 창구 전체에 대한 상한. 정상 사용자는 몇 번 눌러 보고 끝난다.
  if (probe.blocked("join-check")) {
    return { ok: false, message: "확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." };
  }
  probe.recordFail("join-check");

  const schema = kind === "loginId" ? loginIdSchema : kind === "nickname" ? nicknameSchema : null;
  if (!schema) return { ok: false, message: "확인할 수 없습니다." };

  const parsed = schema.safeParse(value ?? "");
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "형식을 확인하세요." };
  }

  try {
    const taken =
      kind === "loginId"
        ? await loginIdExists(parsed.data)
        : await nicknameExists(parsed.data);
    return taken
      ? { ok: false, message: kind === "loginId" ? "이미 쓰이는 아이디입니다." : "이미 쓰이는 닉네임입니다." }
      : { ok: true, message: "사용할 수 있습니다." };
  } catch (err) {
    console.error("중복 확인 실패:", err);
    return { ok: false, message: "확인 중 오류가 발생했습니다." };
  }
}
