"use server";

import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/member-session";

// 회원 로그아웃. 상단바에서 부르므로 특정 화면(mypage)에 두지 않는다.
// 예전에는 /mypage 안에만 버튼이 있어서, 다른 화면에서는 로그아웃하려면
// 마이페이지까지 들어가야 했다.
export async function memberLogout() {
  const session = await getMemberSession();
  session.destroy();
  redirect("/");
}
