import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session-options";

// /admin/* 에 대한 1차 방어선(UX 게이트). 미인증이면 /login 으로 리다이렉트.
// 실제 인증 강제는 각 페이지/Server Action 의 requireSession() 이 담당한다.
export async function middleware(request) {
  const res = NextResponse.next();
  const session = await getIronSession(request, res, sessionOptions);

  // role 까지 본다. Edge 라 DB 를 못 보므로 계정 존재 확인은 requireSession() 몫이다.
  if (!session.isLoggedIn || !session.role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
