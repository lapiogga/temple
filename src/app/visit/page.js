import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import MapView from "@/components/MapView";
import { SITE } from "@/content/site";
import { getSection } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const metadata = { title: `오시는 길 | ${SITE.name}` };

export default async function VisitPage() {
  const v = await getSection("visit");
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap">

          <div className="foot-grid">
            <div>
              <PageHead title="오시는 길" ki="Visit" back={{ href: "/", label: "홈으로" }} />
              <MapView />
              <div className="info-lines">
                <div><b>주소</b>　{v.addressFull}</div>
                <div><b>대중교통·주차</b>　{[v.transit, v.parking].filter(Boolean).join(" · ") || "안내 준비 중입니다."}</div>
                <div style={{ marginTop: "6px" }}>
                  <a href={v.mapUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--brand)", fontWeight: "var(--fw-semibold)" }}>
                    지도 앱에서 길찾기 →
                  </a>
                </div>
              </div>
            </div>
            <div className="donate">
              <PageHead title="후원 안내" ki="Donation" className="sec-head-sub" />
              <p style={{ fontSize: "var(--fs-300)", color: "var(--n-fg-3)" }}>
                여러분의 정성은 도량을 가꾸고 이웃과 나누는 데 쓰입니다.
              </p>
              {v.donation ? (
                <div className="acct">
                  <div style={{ color: "var(--n-fg-3)", fontSize: "var(--fs-200)", marginBottom: "2px" }}>후원 계좌</div>
                  <b>{v.donation.bank} {v.donation.account}</b><br />예금주 : {v.donation.holder}
                </div>
              ) : (
                <div className="acct">
                  <b>후원 안내 준비 중</b><br />계좌 안내는 곧 등록될 예정입니다.
                </div>
              )}
              <p className="note-small">※ 온라인 결제는 추후 도입 예정입니다.</p>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
