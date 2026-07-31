"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// 로그아웃: 세션 파기 후 홈으로.
// 로그인 페이지로 보내면 방금 나온 사람에게 다시 로그인을 요구하는 꼴이고,
// 그 화면에는 홈으로 가는 길이 없어 갇힌다.
export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
