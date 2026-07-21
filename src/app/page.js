"use client";

import { useEffect, useState } from "react";
import {
  DharmaWheel, LotusMark, MountainRidge, DancheongDefs, DancheongRule,
  LanternIcon, BellIcon, PinIcon, PhotoIcon, LotusPlaceholder, MoktakPlaceholder,
} from "@/components/Icons";

// ── 콘텐츠 데이터 (추후 PostgreSQL 조회로 교체) ─────────────────────────
const NEWS = [
  { date: "2026. 07. 20.", title: "여름 산사 음악회 회향", art: "photo",
    excerpt: "경내에서 열린 산사 음악회가 많은 신도님과 함께 원만히 회향되었습니다. 함께해 주셔서 감사합니다." },
  { date: "2026. 07. 08.", title: "백중 우란분재 봉행 안내", art: "lotus",
    excerpt: "조상 천도와 효를 기리는 백중 우란분재를 봉행합니다. 위패 접수 일정과 절차를 안내드립니다." },
  { date: "2026. 06. 30.", title: "초하루 법회 및 방생 법회", art: "moktak",
    excerpt: "매월 음력 초하루 법회와 함께 생명 존중의 방생 법회를 봉행합니다. 많은 동참 바랍니다." },
];
const REGULAR = [
  { t: "일요 가족법회", v: "일요일 10:00" },
  { t: "초하루 법회", v: "음력 매월 1일" },
  { t: "지장재일 법회", v: "음력 매월 18일" },
  { t: "관음재일 법회", v: "음력 매월 24일" },
];
const EVENTS = [
  { t: "백중 우란분재", v: "음력 7. 15." },
  { t: "여름 안거 회향", v: "8. 15." },
  { t: "동지 팥죽 나눔", v: "12. 21." },
  { t: "성도재일 철야정진", v: "음력 12. 8." },
];
const HISTORY = [
  { yr: "1925 · 창건", title: "대웅전 초창", desc: "산자락에 처음 법당을 세워 도량의 기틀을 마련하였습니다." },
  { yr: "1978 · 중창", title: "요사채·범종각 증축", desc: "신도의 정성을 모아 전각을 늘리고 범종을 봉안하였습니다." },
  { yr: "2015 · 중수", title: "단청 보수·경내 정비", desc: "퇴락한 단청을 보수하고 경내를 오늘의 모습으로 가꾸었습니다." },
];

function NewsArt({ art }) {
  if (art === "lotus") return <LotusPlaceholder />;
  if (art === "moktak") return <MoktakPlaceholder />;
  return <PhotoIcon />;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.14 }
    );
    const els = document.querySelectorAll(".reveal");
    els.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 0.06}s`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const nav = [
    { href: "#news", label: "소식" },
    { href: "#schedule", label: "법회·행사" },
    { href: "#history", label: "중창기" },
    { href: "#visit", label: "오시는 길" },
  ];

  return (
    <>
      <DancheongDefs />

      {/* NAV */}
      <header className="nav">
        <div className="wrap row">
          <a className="brand" href="#top">
            <DharmaWheel />
            <span className="name">○○사 <small>○○산 · 大韓佛敎</small></span>
          </a>
          <nav className={`menu${menuOpen ? " open" : ""}`}>
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}</a>
            ))}
            <a href="#visit" className="serif" style={{ color: "var(--accent)", fontWeight: 700 }}
              onClick={() => setMenuOpen(false)}>후원</a>
          </nav>
          <button className="hmb" aria-label="메뉴" onClick={() => setMenuOpen((v) => !v)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="top">
        <div className="wrap">
          <LotusMark className="hero-lotus" />
          <div className="inner">
            <span className="eyebrow">마음을 쉬어가는 곳</span>
            <h1>산자락에 깃든<br />천년의 <em>고요</em>,<br />○○사에 오신 것을 환영합니다</h1>
            <p className="lede">계절마다 다른 얼굴로 맞이하는 도량입니다. 정기 법회와 사찰 소식, 그리고 오랜 중창의 발자취를 함께 나눕니다.</p>
            <div className="btns">
              <a className="btn btn-primary" href="#schedule"><LanternIcon /> 법회 안내</a>
              <a className="btn btn-ghost" href="#visit"><PinIcon /> 오시는 길</a>
            </div>
          </div>
        </div>
        <MountainRidge className="hero-ridge" />
      </section>
      <DancheongRule height={14} />

      {/* 다음 법회 / 공지 */}
      <div className="wrap">
        <div className="highlight">
          <div className="hcard accent reveal">
            <span className="tag"><LanternIcon size={16} /> 다음 정기법회</span>
            <h3>일요 가족법회</h3>
            <div className="when">매주 일요일 오전 10:00 · 대웅전</div>
            <p className="desc">사시예불과 법문, 공양이 이어집니다. 처음 오시는 분도 편안히 함께하실 수 있습니다.</p>
          </div>
          <div className="hcard teal reveal">
            <span className="tag"><BellIcon size={16} /> 공지</span>
            <h3 style={{ fontSize: "18px" }}>여름 안거 회향 안내</h3>
            <div className="when" style={{ fontWeight: 500, color: "var(--ink-soft)", fontSize: "14px" }}>
              2026. 8. 15. 오전 10시 · 회향 법회 및 대중공양
            </div>
          </div>
        </div>
      </div>

      {/* 소식 */}
      <section className="blk" id="news">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">Notice</div><h2>사찰 소식</h2></div>
            <a className="more" href="#">소식 전체 보기 →</a>
          </div>
          <div className="news">
            {NEWS.map((n) => (
              <article className="ncard reveal" key={n.title}>
                <div className="ph"><NewsArt art={n.art} /></div>
                <div className="body">
                  <div className="date">{n.date}</div>
                  <h3>{n.title}</h3>
                  <p>{n.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 법회·행사 */}
      <section className="blk bg-soft" id="schedule">
        <div className="wrap">
          <div className="sec-head reveal"><div><div className="ki">Dharma</div><h2>법회 · 행사 안내</h2></div></div>
          <div className="schedule">
            <div className="panel reveal">
              <h3><LanternIcon size={22} /> 정기 법회</h3>
              <ul className="plist">
                {REGULAR.map((r) => (
                  <li key={r.t}><span className="t">{r.t}</span><span className="v">{r.v}</span></li>
                ))}
              </ul>
            </div>
            <div className="panel reveal">
              <h3><BellIcon size={22} /> 다가오는 행사</h3>
              <ul className="plist">
                {EVENTS.map((e) => (
                  <li key={e.t}><span className="t">{e.t}</span><span className="v">{e.v}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 중창기 */}
      <section className="blk" id="history">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">History</div><h2>가람 중창기</h2></div>
            <a className="more" href="#">중창기 전체 보기 →</a>
          </div>
          <p className="reveal" style={{ color: "var(--ink-soft)", maxWidth: "60ch", marginBottom: "22px", fontSize: "15.5px" }}>
            여러 대에 걸친 불사와 중창의 발자취입니다. 옛 사진과 기록으로 도량이 지나온 길을 담았습니다.
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

      {/* 오시는 길 / 후원 */}
      <section className="blk bg-soft" id="visit">
        <div className="wrap">
          <div className="foot-grid">
            <div className="reveal">
              <div className="sec-head"><div><div className="ki">Visit</div><h2>오시는 길</h2></div></div>
              <div className="mapbox">
                <div style={{ textAlign: "center", color: "var(--ink-soft)" }}>
                  <PinIcon size={40} />
                  <div style={{ fontSize: "13px", marginTop: "6px" }}>카카오맵 임베드 영역</div>
                </div>
              </div>
              <div className="info-lines">
                <div><b>주소</b>　○○시 ○○구 ○○로 00 (○○동)</div>
                <div><b>대중교통</b>　○○역 3번 출구 · 마을버스 00번 종점 하차</div>
                <div><b>주차</b>　경내 소형 30대 · 법회일 혼잡</div>
              </div>
            </div>
            <div className="donate reveal">
              <div className="sec-head"><div><div className="ki">Donation</div><h2 style={{ fontSize: "24px" }}>후원 안내</h2></div></div>
              <p style={{ fontSize: "14.5px", color: "var(--ink-soft)" }}>여러분의 정성은 도량을 가꾸고 이웃과 나누는 데 쓰입니다.</p>
              <div className="acct">
                <div style={{ color: "var(--ink-soft)", fontSize: "13px", marginBottom: "2px" }}>후원 계좌</div>
                <b>○○은행 000-0000-0000-00</b><br />예금주 : 대한불교 ○○사
              </div>
              <p className="note-small">※ 온라인 결제는 추후 도입 예정입니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site">
        <DancheongRule height={12} />
        <div className="foot-main">
          <div className="wrap">
            <div className="cols">
              <div>
                <div className="name">○○산 ○○사</div>
                <p>마음을 쉬어가는 산중 도량.<br />계절과 함께 정진하는 우리 지역의 절입니다.</p>
              </div>
              <div>
                <h5>바로가기</h5>
                <a href="#news">사찰 소식</a><br /><a href="#schedule">법회·행사</a><br />
                <a href="#history">가람 중창기</a><br /><a href="#visit">오시는 길</a>
              </div>
              <div>
                <h5>연락</h5>
                <p>전화 02-000-0000<br />이메일 temple@example.kr<br />
                  <a href="#" style={{ color: "#d8cdb9", textDecoration: "underline" }}>개인정보처리방침</a></p>
              </div>
            </div>
            <div className="foot-bar">
              <span>© 2026 ○○사. All rights reserved.</span>
              <span>시안(mockup) · 사찰명·일정·계좌·사진은 예시입니다</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
