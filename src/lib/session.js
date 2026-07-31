import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions } from "@/lib/session-options";
import { query } from "@/lib/db";

// 서버 컴포넌트/Server Action 에서 운영자 세션을 읽고 인증을 강제한다.
// 세션 shape: { userId, loginId, role, isLoggedIn }

// 세션을 읽는다. 로그인 여부 판단은 호출부에서.
export async function getSession() {
  return getIronSession(cookies(), sessionOptions);
}

// 인증 강제. 미인증이면 /login 으로 리다이렉트.
// 주의: Server Action 은 페이지 트리 밖 독립 엔드포인트이므로,
// 레이아웃 가드와 별개로 각 액션 첫 줄에서도 이 함수를 호출해야 한다.
//
// 봉인 쿠키의 isLoggedIn 만 믿지 않고 두 가지를 더 본다.
//  1) role 이 있는가 — 회원 세션 payload 에는 role 이 없다. 봉인 키는 이미
//     분리했지만(lib/member-session.js) 이중 방어로 남긴다.
//  2) admin_users 에 그 계정이 아직 있고 운영자인가 — 이 검사가 없으면 계정을
//     지워도 발급된 세션이 ttl(24시간) 동안 살아 있고 무효화할 수단이 없었다.
//     회원 경로는 이미 getMemberById 로 재검증하는데 운영자만 빠져 있었다.
export async function requireSession() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.role) redirect("/login");

  let user = null;
  let lookupFailed = false;
  try {
    const { rows } = await query(
      "SELECT id, login_id, role FROM admin_users WHERE id = $1",
      [session.userId]
    );
    user = rows[0] ?? null;
  } catch (err) {
    // 조회가 실패하면 통과시키지 않는다(fail-closed).
    console.error("운영자 세션 재검증 조회 실패:", err);
    lookupFailed = true;
  }

  // redirect() 는 NEXT_REDIRECT 예외를 던지므로 try 블록 밖에서 부른다.
  //
  // 여기서 session.destroy() 를 부르면 안 된다. requireSession 은 서버 컴포넌트
  // (admin/layout.js)에서도 불리는데, 쿠키 수정은 Server Action 과 Route Handler
  // 에서만 허용된다 — 부르면 라우트가 500 이 된다(실제로 그렇게 났다).
  // 쿠키를 남겨 둬도 매 요청 이 검사에서 걸리므로 권한상 무해하다.
  if (lookupFailed || !user || user.role !== "operator") redirect("/login");
  return session;
}
