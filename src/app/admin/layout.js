import Link from "next/link";
import { requireSession } from "@/lib/session";
import { logout } from "./actions";
import { DharmaWheel } from "@/components/Icons";
import SiteFooter from "@/components/SiteFooter";
import "./admin.css";

export const metadata = {
  title: "관리자 | 응선사",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin/site", label: "홈페이지" },
  { href: "/admin/notices", label: "공지사항" },
  { href: "/admin/events", label: "법회·행사" },
  { href: "/admin/gallery", label: "갤러리" },
  { href: "/admin/members", label: "회원" },
  { href: "/admin/board", label: "게시판" },
  // '소개 게시판' 은 여기서 뺐다 — 공개 화면의 '응선사 소개' 소메뉴를 이루는 것이
  // 인삿말·연혁·산신도(홈페이지)와 법문·휴심선원(소개 게시판)으로 갈라져 있어
  // 한쪽만 고치고 나머지를 못 찾는 일이 있었다. 지금은 '홈페이지' 한 화면에 모은다.
  { href: "/admin/qna", label: "Q&A" },
];

export default async function AdminLayout({ children }) {
  // 데이터 접근 지점에서 인증 강제(레이아웃 가드). 각 액션도 별도 재검증한다.
  const session = await requireSession();

  return (
    <>
      {/* 홈페이지와 동일한 프레임 — 고정 상단바 + 대메뉴 + 고정 푸터 */}
      <header className="nav">
        <div className="topbar">
          <div className="wrap topbar-in">
            <Link href="/admin" className="brand">
              <DharmaWheel />
              <span className="name">응선사 관리자</span>
            </Link>
            <div className="top-actions">
              <Link className="top-link" href="/" target="_blank" rel="noopener noreferrer">사이트 보기 ↗</Link>
              <span className="adm-who">{session.loginId}</span>
              <form action={logout}>
                <button type="submit" className="top-admin">로그아웃</button>
              </form>
            </div>
          </div>
        </div>
        <div className="mainbar">
          <nav className="wrap mainbar-in adm-mainnav" aria-label="관리 메뉴">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="screen top adm-screen">
        <div className="wrap wide">{children}</div>
      </main>

      <SiteFooter />
    </>
  );
}
