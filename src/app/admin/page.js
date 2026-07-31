import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listNotices } from "@/lib/notices";
import { listMembers } from "@/lib/members";
import { listAllQuestions } from "@/lib/qna";

export const dynamic = "force-dynamic";

// 대시보드는 '지금 사람이 손대야 하는 것' 을 먼저 보여 준다.
//
// 예전에는 공지사항 개수 두 개뿐이었다. 그런데 정작 사람을 기다리게 하는 것은 그쪽이
// 아니다. 가입한 신도는 status='pending' 상태에서 **로그인이 막혀 있고**, 종무소가
// 회원 화면을 열어 볼 때까지 그대로 방치된다. 대시보드가 그 사실을 알려 주지 않으면
// 며칠씩 밀린다. 묻고답하기의 미답변도 같은 성격이다.
export default async function AdminHome() {
  await requireSession();

  // 하나가 실패해도 화면은 서야 한다 — 대시보드는 상태를 보는 곳이지 작업하는 곳이 아니다.
  const [notices, members, questions] = await Promise.all([
    listNotices({ includeUnpublished: true }).catch((e) => {
      console.error("대시보드 공지 조회 실패:", e);
      return null;
    }),
    listMembers().catch((e) => {
      console.error("대시보드 회원 조회 실패:", e);
      return null;
    }),
    listAllQuestions().catch((e) => {
      console.error("대시보드 Q&A 조회 실패:", e);
      return null;
    }),
  ]);

  const pendingMembers = members?.filter((m) => m.status === "pending").length ?? null;
  const unanswered = questions?.filter((q) => !q.answer).length ?? null;
  const publishedCount = notices?.filter((n) => n.published).length ?? null;

  // 값을 못 읽었으면 숫자 대신 '—'. 0 과 '못 읽음' 은 다르다.
  const num = (v) => (v == null ? "—" : v);

  return (
    <section>
      <h1 className="adm-h1">대시보드</h1>

      <div className="adm-cards">
        {/* 손대야 하는 것부터. 0 이 아니면 눈에 띄게 둔다. */}
        <Link className={`adm-card${pendingMembers ? " urgent" : ""}`} href="/admin/members">
          <div className="adm-card-n">{num(pendingMembers)}</div>
          <div className="adm-card-l">승인 대기 회원</div>
          {pendingMembers ? (
            <div className="adm-card-note">승인 전까지 로그인할 수 없습니다</div>
          ) : null}
        </Link>

        <Link className={`adm-card${unanswered ? " urgent" : ""}`} href="/admin/qna">
          <div className="adm-card-n">{num(unanswered)}</div>
          <div className="adm-card-l">미답변 문의</div>
        </Link>

        <Link className="adm-card" href="/admin/notices">
          <div className="adm-card-n">{num(notices?.length)}</div>
          <div className="adm-card-l">전체 공지사항</div>
        </Link>

        <Link className="adm-card" href="/admin/notices">
          <div className="adm-card-n">{num(publishedCount)}</div>
          <div className="adm-card-l">공개 중</div>
        </Link>
      </div>

      <p className="adm-quick">
        <Link className="btn btn-primary" href="/admin/notices">
          공지사항 관리로 이동
        </Link>
      </p>
    </section>
  );
}
