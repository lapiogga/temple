import { redirect } from "next/navigation";

// 소개는 소메뉴별 독립 화면으로 분리됨. 기존 /about 진입은 인삿말로 이동.
export default function AboutIndex() {
  redirect("/about/greeting");
}
