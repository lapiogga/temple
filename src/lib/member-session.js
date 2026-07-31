import { createHash } from "crypto";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions } from "@/lib/session-options";

// 회원 세션(운영자와 별도 쿠키). shape: { memberId, loginId, name, isLoggedIn }
//
// 봉인 키를 운영자와 분리한다. sessionOptions 를 그대로 펼쳐 쓰면 password 까지
// 공유하게 되는데, iron-session 의 seal 에는 쿠키 이름이 섞이지 않는다. 그래서
// 회원 쿠키 값을 그대로 temple_admin 이라는 이름으로 보내면 운영자 세션으로
// 복호화되어 관리자 화면이 통째로 열렸다(2026-07-31 검증에서 실증).
// 시크릿을 하나 더 두는 대신 기존 SESSION_SECRET 에서 파생시킨다.
const memberPassword = createHash("sha256")
  .update(`${sessionOptions.password}:member`)
  .digest("base64"); // 44자 — iron-session 최소 32자 충족
const memberOptions = { ...sessionOptions, cookieName: "temple_member", password: memberPassword };

export async function getMemberSession() {
  return getIronSession(cookies(), memberOptions);
}

export async function requireMember() {
  const session = await getMemberSession();
  if (!session.isLoggedIn) redirect("/member-login");
  return session;
}
