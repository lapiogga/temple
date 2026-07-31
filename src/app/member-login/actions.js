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

  // 관리자가 초기화한 계정(must_reset_password)도 여기서 GENERIC 으로 떨어진다.
  // 초기화 시 해시를 난수로 덮으므로(admin/members/actions.js) ok 가 항상 false 다.
  //
  // 예전에는 이 위에서 { needsReset, loginId } 를 돌려줘 재설정 화면으로 안내했다.
  // 그런데 그 분기가 비밀번호 검사보다 앞이라, 아이디만 찍어 넣으면 비밀번호 없이도
  // "그 계정은 있고, 초기화 대기 중" 이라는 사실이 그대로 나왔다. 타이밍까지 균일화해
  // 계정 존재를 감춰 놓고 응답으로 흘리고 있었던 셈이다.
  //
  // 안내는 없애지 않고 화면 쪽으로 옮겼다 — LoginForm 이 '실패 전체' 에 대해
  // 재설정 경로를 함께 보여 준다. 계정 상태와 무관하게 늘 같은 문구라 새지 않는다.
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
