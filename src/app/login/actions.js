"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

const loginSchema = z.object({
  // 앞뒤 공백을 다듬는다. 다듬지 않으면 조회가 빗나가고, 실패 문구가 아래 GENERIC_ERROR
  // 하나뿐이라 사용자에게는 비밀번호 오류로 보인다. 비밀번호는 trim 하지 않는다.
  loginId: z.string().trim().min(1).max(100),
  // bcrypt 는 72바이트에서 절단되므로 상한을 72로(초과분 무시로 인한 혼동 방지).
  password: z.string().min(1).max(72),
});

// 존재하지 않는 계정에도 동일한 연산량을 태워 타이밍으로 계정 존재가 새지 않게 한다.
const DUMMY_HASH = bcrypt.hashSync("timing-equalization-dummy", 12);

const GENERIC_ERROR = "아이디 또는 비밀번호가 올바르지 않습니다.";

export async function login(prevState, formData) {
  const parsed = loginSchema.safeParse({
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC_ERROR };

  const { loginId, password } = parsed.data;

  let user = null;
  try {
    const { rows } = await query(
      "SELECT id, login_id, password_hash, role FROM admin_users WHERE login_id = $1",
      [loginId]
    );
    user = rows[0] ?? null;
  } catch (err) {
    console.error("login 조회 실패:", err);
    return { error: "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  // 계정 유무와 무관하게 항상 compare 수행(타이밍 균일화). 실패 메시지도 동일.
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) return { error: GENERIC_ERROR };

  try {
    await query("UPDATE admin_users SET last_login_at = now() WHERE id = $1", [
      user.id,
    ]);
  } catch (err) {
    console.error("last_login_at 갱신 실패(비치명적):", err);
  }

  const session = await getSession();
  session.userId = user.id;
  session.loginId = user.login_id;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  redirect("/admin");
}
