import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getMemberById } from "@/lib/members";
import { wallDateInput } from "@/lib/format";
import { updateMemberAction } from "../../actions";
import MemberEditForm from "./MemberEditForm";

export const dynamic = "force-dynamic";

export default async function MemberEditPage({ params }) {
  await requireSession();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const member = await getMemberById(id);
  if (!member) notFound();

  // 탈퇴한 회원은 개인정보가 이미 지워져 있다. 여기서 다시 채워 넣으면 익명화가
  // 무의미해지므로 화면 자체를 열지 않는다(서버 액션도 같은 조건으로 거절한다).
  if (member.status === "withdrawn") {
    return (
      <section>
        <h1 className="adm-h1">회원정보 정정</h1>
        <p className="adm-empty">탈퇴한 회원은 정정할 수 없습니다.</p>
        <Link href="/admin/members" className="btn btn-ghost">회원 관리로</Link>
      </section>
    );
  }

  const bound = updateMemberAction.bind(null, id);

  return (
    <section>
      <h1 className="adm-h1">회원정보 정정 — {member.name}</h1>
      <MemberEditForm
        action={bound}
        member={{ ...member, birth_date: wallDateInput(member.birth_date) }}
      />
    </section>
  );
}
