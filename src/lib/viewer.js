import { cache } from "react";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getMemberSession } from "@/lib/member-session";
import { getMemberById } from "@/lib/members";

// "지금 이 요청을 보낸 사람이 누구인가" 를 한 곳에서 판정한다.
//
// 예전에는 이 판정이 다섯 곳(SiteHeader · board/page.js · CategoryBoard ·
// board/write/page.js · board/actions.js)에 흩어져 있었고 기준이 서로 달랐다.
// 상단바와 /board 는 쿠키의 isLoggedIn 만 봐서, 정지·삭제된 회원이나 비밀번호
// 초기화 대기 중인 회원에게도 이름과 글쓰기 버튼이 그대로 떴다. 정작 누르면
// /mypage 는 307 로 튕기고 글쓰기는 거짓 안내를 냈다(막다른 길).
//
// 쿠키는 위조되지 않았을 뿐 '지금도 유효한 계정' 이라는 뜻은 아니다. 발급 뒤에
// 계정이 지워지거나 정지되거나 비밀번호가 초기화될 수 있으므로 매번 DB 를 본다.
// React cache() 로 감싸 같은 요청 안에서는 조회가 한 번만 돈다.
//
// 이 함수는 화면 표시용 판정이다. Server Action 은 페이지 트리 밖 독립
// 엔드포인트이므로 각 액션이 스스로 다시 검사해야 한다.
export const getViewer = cache(async () => {
  const [adminSession, memberSession] = await Promise.all([
    getSession(),
    getMemberSession(),
  ]);

  let isAdmin = false;
  if (adminSession.isLoggedIn && adminSession.role) {
    try {
      const { rows } = await query(
        "SELECT 1 FROM admin_users WHERE id = $1 AND role = 'operator'",
        [adminSession.userId]
      );
      isAdmin = rows.length > 0;
    } catch (err) {
      // 조회 실패 시 권한을 주지 않는다(fail-closed).
      console.error("운영자 확인 실패:", err);
    }
  }

  let member = null;
  if (memberSession.isLoggedIn) {
    try {
      member = await getMemberById(memberSession.memberId);
    } catch (err) {
      console.error("회원 확인 실패:", err);
    }
  }

  const memberExists = !!member;
  const needsReset = memberExists && !!member.must_reset_password;
  // 초기화 대기 중이면 새 비밀번호를 정하기 전까지 회원 자격을 인정하지 않는다.
  const isApprovedMember = memberExists && member.status === "approved" && !needsReset;

  return {
    isAdmin,
    isApprovedMember,
    // 상단바에 띄울 이름. 자격이 없으면 비워 둔다 — 이름만 뜨고 기능은 안 되는
    // 상태가 사용자에게는 가장 헷갈린다.
    memberName: isApprovedMember ? member.nickname || member.name || "" : "",
    // 초기화 대기 안내를 띄우기 위한 신호.
    memberNeedsReset: needsReset,
    memberId: isApprovedMember ? member.id : null,
  };
});
