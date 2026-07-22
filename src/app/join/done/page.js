import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule, LotusMark } from "@/components/Icons";

export const metadata = { title: "가입 신청 완료 | 응선사" };

export default function JoinDone() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />
      <section className="blk">
        <div className="wrap" style={{ maxWidth: "620px", textAlign: "center" }}>
          <LotusMark size={90} opacity={0.5} />
          <h2 style={{ fontFamily: "var(--font-title)", fontSize: "30px", fontWeight: 700, margin: "14px 0 14px" }}>
            가입 신청이 완료되었습니다
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "17.5px", lineHeight: 1.85 }}>
            종무소 승인 후 로그인하여 이용하실 수 있습니다.<br />
            승인까지 다소 시간이 걸릴 수 있습니다.
          </p>
          <p style={{ marginTop: "26px" }}>
            <Link className="btn btn-primary" href="/">홈으로</Link>
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
