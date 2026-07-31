import { getViewer } from "@/lib/viewer";
import SiteHeaderNav from "./SiteHeaderNav";

// 서버에서 로그인 상태를 읽어 상단바에 넘긴다. 대메뉴 자체는 드롭다운 상태를
// 들고 있어야 하므로 SiteHeaderNav(클라이언트)가 담당한다.
//
// 판정은 lib/viewer.js 한 곳에서 한다. 예전에는 여기서 쿠키의 isLoggedIn 만 보고
// 이름을 띄웠는데, 정지·삭제된 회원에게도 이름과 '내 정보' 가 떴고 정작 누르면
// /mypage 가 307 로 튕겼다.
//
// temple_admin 과 temple_member 는 서로 독립된 쿠키라 동시에 살아 있을 수 있다.
// 그때는 운영자를 앞세운다 — 게시판 글쓰기의 작성자 판정과 같은 순서여야
// 화면과 결과가 어긋나지 않는다.
export default async function SiteHeader() {
  const { isAdmin, isApprovedMember, memberName } = await getViewer();
  return (
    <SiteHeaderNav auth={{ admin: isAdmin, member: isApprovedMember, memberName }} />
  );
}
