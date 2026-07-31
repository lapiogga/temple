import { redirect } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { requireMember } from "@/lib/member-session";
import { getMemberById } from "@/lib/members";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";

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
  // 비밀번호가 초기화된 계정은 새 비밀번호를 정하기 전까지 개인정보를 보여주지 않는다.
  if (m?.must_reset_password) redirect("/member-login/reset");
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
              {/* 로그아웃은 상단바로 옮겼다 — 어느 화면에서든 바로 되어야 하는데
                  예전에는 이 화면 안에만 있었다. (components/SiteHeaderNav.js) */}
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
