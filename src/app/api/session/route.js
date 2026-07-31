import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";

// 상단바가 현재 로그인 상태를 직접 물어보는 자리.
//
// 왜 필요한가: Next 의 Router Cache 는 <Link> 이동에서 30초, 브라우저 뒤로가기
// 에서는 만료 없이 옛 렌더 결과를 그대로 그린다. 그래서 로그인/로그아웃 뒤에
// 돌아가면 상단바가 옛 상태로 남는다("관리자 모드가 풀린 것처럼 보인다").
// force-dynamic 은 서버 렌더 캐시 지시라 이 클라이언트 캐시를 막지 못한다.
// 클라이언트 fetch 는 Router Cache 를 타지 않으므로 Link·뒤로가기 양쪽을 덮는다.
//
// 여기서 주는 것은 표시용 최소 정보다. 권한 강제는 각 페이지·액션이 한다.
export const dynamic = "force-dynamic";

export async function GET() {
  const { isAdmin, isApprovedMember, memberName, memberNeedsReset } = await getViewer();
  return NextResponse.json(
    { admin: isAdmin, member: isApprovedMember, memberName, needsReset: memberNeedsReset },
    { headers: { "Cache-Control": "no-store, must-revalidate" } }
  );
}
