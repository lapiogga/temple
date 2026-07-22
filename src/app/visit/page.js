import SiteHeader from "@/components/SiteHeader";
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
              <div className="sec-head"><div><div className="ki">Visit</div><h2>오시는 길</h2></div></div>
              <MapView />
              <div className="info-lines">
                <div><b>주소</b>　{v.addressFull}</div>
                <div><b>대중교통·주차</b>　{[v.transit, v.parking].filter(Boolean).join(" · ") || "안내 준비 중입니다."}</div>
                <div style={{ marginTop: "6px" }}>
                  <a href={v.mapUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--accent)", fontWeight: 600 }}>
                    지도 앱에서 길찾기 →
                  </a>
                </div>
              </div>
            </div>
            <div className="donate">
              <div className="sec-head"><div><div className="ki">Donation</div><h2 style={{ fontSize: "24px" }}>후원 안내</h2></div></div>
              <p style={{ fontSize: "14.5px", color: "var(--ink-soft)" }}>
                여러분의 정성은 도량을 가꾸고 이웃과 나누는 데 쓰입니다.
              </p>
              {v.donation ? (
                <div className="acct">
                  <div style={{ color: "var(--ink-soft)", fontSize: "13px", marginBottom: "2px" }}>후원 계좌</div>
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
