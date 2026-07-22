import { requireSession } from "@/lib/session";
import { listMembers } from "@/lib/members";
import { approveMemberAction, rejectMemberAction, suspendMemberAction } from "./actions";

const GENDER = { male: "남", female: "여", other: "기타" };
const STATUS = { approved: "승인", pending: "대기", rejected: "거절", suspended: "정지" };

function fmt(v) {
  if (!v) return "";
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default async function MembersAdmin() {
  await requireSession();
  const members = await listMembers();
  const pending = members.filter((m) => m.status === "pending").length;

  return (
    <section>
      <h1 className="adm-h1">회원 관리</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: "16px" }}>
        승인 대기 <b>{pending}</b>명 · 전체 {members.length}명
      </p>

      {members.length === 0 ? (
        <p className="adm-empty">가입한 회원이 없습니다.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>성명</th>
                <th>아이디</th>
                <th>휴대폰</th>
                <th>성별</th>
                <th>생년월일</th>
                <th>가입일</th>
                <th>상태</th>
                <th className="adm-th-actions">승인</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.login_id}</td>
                  <td>{m.phone ?? "-"}</td>
                  <td>{GENDER[m.gender] ?? "-"}</td>
                  <td>{fmt(m.birth_date)}</td>
                  <td>{fmt(m.created_at)}</td>
                  <td>
                    <span className={`adm-badge ${m.status === "approved" ? "on" : "off"}`}>
                      {STATUS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="adm-actions">
                    {m.status !== "approved" && (
                      <form action={approveMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="adm-link-btn" type="submit">승인</button>
                      </form>
                    )}
                    {m.status === "pending" && (
                      <form action={rejectMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="adm-link-btn danger" type="submit">거절</button>
                      </form>
                    )}
                    {m.status === "approved" && (
                      <form action={suspendMemberAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="adm-link-btn danger" type="submit">정지</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
