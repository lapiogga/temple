import Link from "next/link";
import { requireSession } from "@/lib/session";
import { logout } from "./actions";
import "./admin.css";

export const metadata = {
  title: "관리자 | ○○사",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  // 데이터 접근 지점에서 인증 강제(레이아웃 가드). 각 액션도 별도 재검증한다.
  const session = await requireSession();

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top-in wrap">
          <Link href="/admin" className="adm-brand serif">
            ○○사 관리자
          </Link>
          <nav className="adm-nav">
            <Link href="/admin/notices">소식</Link>
          </nav>
          <div className="adm-user">
            <span className="adm-who">{session.loginId}</span>
            <form action={logout}>
              <button type="submit" className="adm-logout">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="adm-main wrap">{children}</main>
    </div>
  );
}
