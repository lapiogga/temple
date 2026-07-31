"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getMemberByLoginId, touchMemberLogin } from "@/lib/members";
import { getMemberSession } from "@/lib/member-session";

const schema = z.object({
  // 가입(join/actions.js)이 loginId 를 trim 해서 저장하므로 조회할 때도 똑같이 다듬는다.
  // 한쪽만 trim 하면 앞뒤 공백이 섞인 입력이 DB 조회에서 빗나가고, 아래 GENERIC 때문에
  // 사용자에게는 "비밀번호가 틀렸다"로 보인다. 모바일 자동완성·복사붙여넣기에서 흔하다.
  // 비밀번호는 trim 하지 않는다 — 앞뒤 공백도 비밀번호의 일부다.
  loginId: z.string().trim().min(1).max(30),
  password: z.string().min(1).max(72),
});

// 계정 유무와 무관하게 동일 연산량(타이밍 균일화).
const DUMMY_HASH = bcrypt.hashSync("member-timing-dummy", 12);
const GENERIC = "아이디 또는 비밀번호가 올바르지 않습니다.";

export async function memberLoginAction(prevState, formData) {
  const parsed = schema.safeParse({
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC };

  let m = null;
  try {
    m = await getMemberByLoginId(parsed.data.loginId);
  } catch (err) {
    console.error("member login 조회 실패:", err);
    return { error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  // 계정 유무와 무관하게 항상 compare 를 태워 타이밍으로 존재가 새지 않게 한다.
  const ok = await bcrypt.compare(parsed.data.password, m?.password_hash ?? DUMMY_HASH);

  // 관리자가 초기화한 계정은 기존 해시가 난수로 덮여 있어 어떤 비밀번호도 맞지 않는다.
  // 여기서 걸러주지 않으면 "비밀번호가 틀렸다"만 반복되어 회원이 길을 못 찾는다.
  if (m?.must_reset_password) {
    return { needsReset: true, loginId: m.login_id };
  }

  if (!m || !ok) return { error: GENERIC };

  if (m.status !== "approved") {
    return {
      error:
        m.status === "pending"
          ? "종무소 승인 대기 중입니다. 승인 후 이용해 주세요."
          : "이용이 제한된 계정입니다. 종무소에 문의해 주세요.",
    };
  }

  try {
    await touchMemberLogin(m.id);
  } catch (err) {
    console.error("last_login 갱신 실패(비치명적):", err);
  }

  const session = await getMemberSession();
  session.memberId = m.id;
  session.loginId = m.login_id;
  session.name = m.name;
  session.isLoggedIn = true;
  await session.save();

  redirect("/mypage");
}
