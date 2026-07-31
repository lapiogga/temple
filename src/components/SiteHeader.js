import { getSession } from "@/lib/session";
import { getMemberSession } from "@/lib/member-session";
import SiteHeaderNav from "./SiteHeaderNav";

// 서버에서 세션을 읽어 상단바에 넘긴다. 대메뉴 자체는 드롭다운 상태를 들고 있어야
// 하므로 SiteHeaderNav(클라이언트)가 담당한다.
//
// temple_admin 과 temple_member 는 서로 독립된 쿠키라 동시에 살아 있을 수 있다.
// 그때는 운영자를 앞세운다 — 게시판 글쓰기의 작성자 판정(board/actions.js)과
// 같은 순서여야 화면과 결과가 어긋나지 않는다.
export default async function SiteHeader() {
  let admin = false;
  let member = false;
  let memberName = "";
  try {
    const [a, m] = await Promise.all([getSession(), getMemberSession()]);
    admin = !!a.isLoggedIn;
    member = !!m.isLoggedIn;
    memberName = m.name ?? "";
  } catch (err) {
    // 세션을 못 읽어도 상단바는 떠야 한다. 비로그인으로 취급한다.
    console.error("세션 조회 실패:", err);
  }
  return <SiteHeaderNav auth={{ admin, member, memberName }} />;
}
