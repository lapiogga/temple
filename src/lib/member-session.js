import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions } from "@/lib/session-options";

// 회원 세션(운영자와 별도 쿠키). shape: { memberId, loginId, name, isLoggedIn }
const memberOptions = { ...sessionOptions, cookieName: "temple_member" };

export async function getMemberSession() {
  return getIronSession(cookies(), memberOptions);
}

export async function requireMember() {
  const session = await getMemberSession();
  if (!session.isLoggedIn) redirect("/member-login");
  return session;
}
