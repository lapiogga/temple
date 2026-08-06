import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import MapView from "@/components/MapView";
import { SITE } from "@/content/site";
import { getSection } from "@/lib/site-content";
import { GIVING_PROVIDERS } from "@/content/giving";
import { qrPath } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const metadata = { title: `오시는 길 | ${SITE.name}` };

export default async function VisitPage() {
  const v = await getSection("visit");

  // 디지털 시주 — 관리자가 주소를 넣은 창구만 그린다.
  // QR 격자는 서버에서 계산해 좌표만 내려보낸다. 클라이언트 번들이 늘지 않고
  // 외부 QR 이미지 서비스에 방문자 주소를 흘리지도 않는다.
  // giving 키가 없는 옛 저장값이 있으므로 ?? {} 로 받는다(lib/site-content.js 주석).
  const giving = GIVING_PROVIDERS
    .map((p) => ({ ...p, url: (v.giving ?? {})[p.key] }))
    .filter((p) => p.url)
    .map((p) => ({ ...p, qr: qrPath(p.url) }));
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
              {giving.length > 0 ? (
                <div className="giving">
                  <div className="giving-head">디지털 시주</div>
                  <ul className="giving-list">
                    {giving.map((p) => (
                      <li key={p.key}>
                        {/* 카드 전체가 링크다. 휴대폰에서는 QR 을 자기 화면에 대고 찍을 수
                            없으니 눌러서 바로 열 수 있어야 한다 — QR 만 두면 정작 결제
                            수단을 손에 쥔 방문자가 쓰지 못한다. */}
                        <a className="giving-card" href={p.url} target="_blank" rel="noopener noreferrer">
                          <svg
                            className="qr"
                            viewBox={`0 0 ${p.qr.size} ${p.qr.size}`}
                            role="img"
                            aria-label={`${p.label} 송금 QR 코드`}
                          >
                            <rect className="qr-bg" width={p.qr.size} height={p.qr.size} />
                            <path className="qr-fg" d={p.qr.d} />
                          </svg>
                          <span className="giving-name">{p.label}로 송금</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="note-small">
                    ※ 카메라로 QR 을 찍어 주세요. 휴대폰으로 보고 계시면 눌러서 바로 열 수 있습니다.
                  </p>
                </div>
              ) : (
                <p className="note-small">※ 온라인 결제는 추후 도입 예정입니다.</p>
              )}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
