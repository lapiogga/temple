import { requireSession } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { listMembers } from "@/lib/members";
import { formatDateCompact, formatWallDateCompact } from "@/lib/format";
import {
  approveMemberAction,
  rejectMemberAction,
  suspendMemberAction,
  resetMemberPasswordAction,
} from "./actions";

const GENDER = { male: "남", female: "여", other: "기타" };
const STATUS = { approved: "승인", pending: "대기", rejected: "거절", suspended: "정지" };

// 가입일은 '언제 일어났는가' 라 KST, 생년월일은 시각 없는 DATE 라 변환을 태우지 않는다.
const fmt = (v) => (v ? formatDateCompact(v) : "");
const fmtBirth = (v) => (v ? formatWallDateCompact(v) : "");

export default async function MembersAdmin() {
  await requireSession();
  const members = await listMembers();
  const pending = members.filter((m) => m.status === "pending").length;

  return (
    <section>
      <h1 className="adm-h1">회원 관리</h1>
      <p style={{ color: "var(--n-fg-3)", marginBottom: "16px" }}>
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
                <th>닉네임</th>
                <th>아이디</th>
                <th>휴대폰</th>
                <th>성별</th>
                <th>생년월일</th>
                <th>가입일</th>
                <th>상태</th>
                <th className="adm-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.nickname ?? "-"}</td>
                  <td>{m.login_id}</td>
                  <td>{m.phone ? formatPhone(m.phone) : "-"}</td>
                  <td>{GENDER[m.gender] ?? "-"}</td>
                  <td>{fmtBirth(m.birth_date)}</td>
                  <td>{fmt(m.created_at)}</td>
                  <td>
                    <span className={`adm-badge ${m.status === "approved" ? "on" : "off"}`}>
                      {STATUS[m.status] ?? m.status}
                    </span>
                    {m.must_reset_password && (
                      <>
                        {" "}
                        <span
                          className="adm-badge off"
                          title="회원이 가입정보 확인 후 새 비밀번호를 정해야 로그인됩니다"
                        >
                          비번 재설정 대기
                        </span>
                      </>
                    )}
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
                    {!m.must_reset_password && (
                      <form action={resetMemberPasswordAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="adm-link-btn" type="submit">비번 초기화</button>
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
