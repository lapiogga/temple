import { redirect } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { requireMember } from "@/lib/member-session";
import { getMemberById } from "@/lib/members";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { memberLogout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "내 정보 | 응선사" };

const GENDER = { male: "남", female: "여", other: "기타" };
const STATUS = { approved: "승인", pending: "승인 대기", rejected: "거절", suspended: "정지" };

function fmt(v) {
  if (!v) return "-";
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export default async function MyPage() {
  const session = await requireMember();
  const m = await getMemberById(session.memberId);
  // 발급 후 종무소가 정지/거절했을 수 있으므로 최신 상태 재검증.
  if (!m || m.status !== "approved") redirect("/member-login");

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "560px" }}>
          <div className="sec-head">
            <div><div className="ki">My</div><h2>내 정보</h2></div>
          </div>
          {m ? (
            <div className="mypage-info">
              <dl>
                <dt>아이디</dt><dd>{m.login_id}</dd>
                <dt>성명</dt><dd>{m.name}</dd>
                <dt>닉네임</dt><dd>{m.nickname ?? "-"}</dd>
                <dt>생년월일</dt><dd>{fmt(m.birth_date)}</dd>
                <dt>성별</dt><dd>{GENDER[m.gender] ?? "-"}</dd>
                <dt>휴대폰</dt><dd>{m.phone ? formatPhone(m.phone) : "-"}</dd>
                <dt>상태</dt><dd><span className={`status-badge ${m.status}`}>{STATUS[m.status] ?? m.status}</span></dd>
                <dt>가입일</dt><dd>{fmt(m.created_at)}</dd>
              </dl>
              <form action={memberLogout} style={{ marginTop: "18px" }}>
                <button type="submit" className="btn btn-ghost">로그아웃</button>
              </form>
            </div>
          ) : (
            <p className="adm-empty">회원 정보를 찾을 수 없습니다.</p>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
