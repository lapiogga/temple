import Link from "next/link";
import {
  LotusMark, MountainRidge, DancheongDefs, DancheongRule,
  LanternIcon, BellIcon, PinIcon, PhotoIcon,
} from "@/components/Icons";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import MapView from "@/components/MapView";
import HeroBg from "@/components/HeroBg";
import { listNotices } from "@/lib/notices";
import { SITE, HISTORY } from "@/content/site";
import { formatDate, excerpt } from "@/lib/format";

// 관리자 소식 등록이 즉시 반영되도록 항상 최신 DB 조회.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 소식은 DB(공개분)에서 조회. 조회 실패해도 페이지는 렌더(소식만 빈 상태).
  let news = [];
  try {
    const rows = await listNotices({ includeUnpublished: false });
    news = rows.slice(0, 3);
  } catch (err) {
    console.error("홈 소식 조회 실패:", err);
  }

  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />

      {/* HERO */}
      <section className="hero" id="top">
        <HeroBg />
        <div className="wrap">
          <LotusMark className="hero-lotus" />
          <div className="inner">
            <span className="eyebrow">백사실 계곡 곁, 도심 속 산사</span>
            <h1>
              서울 부암동,<br />백사실 계곡 곁<br />
              <em>{SITE.name}({SITE.hanja})</em>
            </h1>
            <p className="lede">
              부암동 백사실 계곡 가까이 자리한 도심 속 산사입니다. 대웅전에는
              서울특별시 문화재자료 제14호 「응선사 대웅전 산신도」를 모시고 있습니다.
            </p>
            <div className="btns">
              <a className="btn btn-primary" href="#news"><LanternIcon /> 사찰 소식</a>
              <a className="btn btn-ghost" href="#visit"><PinIcon /> 오시는 길</a>
            </div>
          </div>
        </div>
        <MountainRidge className="hero-ridge" />
      </section>
      <DancheongRule height={14} />

      {/* 하이라이트: 산신도 문화재 · 유튜브 법문 (확정 사실) */}
      <div className="wrap">
        <div className="highlight">
          <div className="hcard accent reveal">
            <span className="tag"><BellIcon size={16} /> 서울특별시 문화재자료 제14호</span>
            <h3>대웅전 산신도</h3>
            <div className="when">1914년 조성 · 대웅전 봉안</div>
            <p className="desc">
              산신과 호랑이, 네 동자를 담은 근대 불화입니다. 응선사가 소장·관리하는
              대표 성보입니다.
            </p>
          </div>
          <div className="hcard teal reveal">
            <span className="tag"><LanternIcon size={16} /> 유튜브 법문</span>
            <h3 style={{ fontSize: "18px" }}>{SITE.youtubeName}</h3>
            <div className="when" style={{ fontWeight: 500, fontSize: "14px" }}>
              <a href={SITE.youtubeUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--accent-2)", fontWeight: 700 }}>
                채널에서 법문 보기 →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 소식 (DB 연동) */}
      <section className="blk blk-motif" id="news">
        <LotusMark className="blk-lotus" size={300} />
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">Notice</div><h2>사찰 소식</h2></div>
            <Link className="more" href="/notices">소식 전체 보기 →</Link>
          </div>
          {news.length === 0 ? (
            <p className="reveal" style={{ color: "var(--ink-soft)" }}>
              곧 새로운 소식을 전해드리겠습니다.
            </p>
          ) : (
            <div className="news">
              {news.map((n) => (
                <Link className="ncard reveal" key={n.id} href={`/notices/${n.id}`}>
                  <div className="ph">
                    {n.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.cover_url} alt={n.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <PhotoIcon />
                    )}
                  </div>
                  <div className="body">
                    <div className="date">{formatDate(n.published_at)}</div>
                    <h3>{n.title}</h3>
                    <p>{excerpt(n.body)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <DancheongRule height={12} />

      {/* 법회·행사 → 캘린더 */}
      <section className="blk bg-soft" id="schedule">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">Dharma</div><h2>법회 · 행사 안내</h2></div>
            <Link className="more" href="/events">캘린더 보기 →</Link>
          </div>
          <div className="panel reveal" style={{ textAlign: "center" }}>
            <h3 style={{ justifyContent: "center" }}><LanternIcon size={22} /> 정기 법회와 행사</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: "15px", marginBottom: "16px" }}>
              정기 법회와 다가오는 행사를 캘린더와 목록으로 확인하실 수 있습니다.
            </p>
            <Link className="btn btn-primary" href="/events"><LanternIcon /> 법회·행사 캘린더</Link>
          </div>
        </div>
      </section>
      <DancheongRule height={12} />

      {/* 가람 중창기 */}
      <section className="blk blk-motif" id="history">
        <LotusMark className="blk-lotus tl" size={320} />
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">History</div><h2>가람 중창기</h2></div>
          </div>
          <p className="reveal" style={{ color: "var(--ink-soft)", maxWidth: "60ch", marginBottom: "22px", fontSize: "15.5px" }}>
            응선사가 지나온 발자취입니다. 대웅전에 모신 산신도는 응선사의 역사를 보여주는
            대표 성보이며, 자세한 창건·중창 연혁은 준비 중입니다.
          </p>
          <div className="timeline">
            {HISTORY.map((h) => (
              <div className="tnode reveal" key={h.yr}>
                <div className="yr">{h.yr}</div>
                <h4>{h.title}</h4>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <DancheongRule height={12} />

      {/* 오시는 길 / 후원 */}
      <section className="blk bg-soft" id="visit">
        <div className="wrap">
          <div className="foot-grid">
            <div className="reveal">
              <div className="sec-head"><div><div className="ki">Visit</div><h2>오시는 길</h2></div></div>
              <MapView />
              <div className="info-lines">
                <div><b>주소</b>　{SITE.addressFull}</div>
                <div><b>대중교통·주차</b>　안내 준비 중입니다.</div>
                <div style={{ marginTop: "6px" }}>
                  <a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--accent)", fontWeight: 600 }}>
                    지도 앱에서 길찾기 →
                  </a>
                </div>
              </div>
            </div>
            <div className="donate reveal">
              <div className="sec-head"><div><div className="ki">Donation</div><h2 style={{ fontSize: "24px" }}>후원 안내</h2></div></div>
              <p style={{ fontSize: "14.5px", color: "var(--ink-soft)" }}>
                여러분의 정성은 도량을 가꾸고 이웃과 나누는 데 쓰입니다.
              </p>
              {SITE.donation ? (
                <div className="acct">
                  <div style={{ color: "var(--ink-soft)", fontSize: "13px", marginBottom: "2px" }}>후원 계좌</div>
                  <b>{SITE.donation.bank} {SITE.donation.account}</b><br />예금주 : {SITE.donation.holder}
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
