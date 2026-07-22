"use server";

import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/member-session";

export async function memberLogout() {
  const session = await getMemberSession();
  session.destroy();
  redirect("/");
}
