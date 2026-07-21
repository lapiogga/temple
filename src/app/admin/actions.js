"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// 로그아웃: 세션 파기 후 로그인 페이지로.
export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
