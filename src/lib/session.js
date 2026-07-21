import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions } from "@/lib/session-options";

// 서버 컴포넌트/Server Action 에서 운영자 세션을 읽고 인증을 강제한다.
// 세션 shape: { userId, loginId, role, isLoggedIn }

// 세션을 읽는다. 로그인 여부 판단은 호출부에서.
export async function getSession() {
  return getIronSession(cookies(), sessionOptions);
}

// 인증 강제. 미인증이면 /login 으로 리다이렉트.
// 주의: Server Action 은 페이지 트리 밖 독립 엔드포인트이므로,
// 레이아웃 가드와 별개로 각 액션 첫 줄에서도 이 함수를 호출해야 한다.
export async function requireSession() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  return session;
}
