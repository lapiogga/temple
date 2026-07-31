import { getViewer } from "@/lib/viewer";
import { listIntroCategories } from "@/lib/board-categories";
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
// 소개 메뉴의 게시판 항목 이름은 DB(board_categories.label)에서 읽는다.
// 예전에는 SiteHeaderNav 의 MENU 상수에 이름이 박혀 있어서, 관리자가
// /admin/intro 에서 이름을 바꿔도 대메뉴는 그대로였다 — 그 입력칸이
// "대메뉴에 나오는 이름" 이라고 약속하고 있는데도 그랬다.
// 대메뉴는 클라이언트 컴포넌트라 DB 를 직접 못 읽으므로 여기서 읽어 넘긴다.
export default async function SiteHeader() {
  const { isAdmin, isApprovedMember, memberName } = await getViewer();

  let introItems = [];
  try {
    introItems = (await listIntroCategories())
      .filter((c) => !c.is_hidden)
      .map((c) => ({ href: `/about/${c.slug}`, label: c.label }));
  } catch (err) {
    // 메뉴 하나 때문에 전 페이지가 죽으면 안 된다. 비면 고정 항목만 나온다.
    console.error("소개 게시판 메뉴 조회 실패:", err);
  }

  return (
    <SiteHeaderNav
      auth={{ admin: isAdmin, member: isApprovedMember, memberName }}
      introItems={introItems}
    />
  );
}
