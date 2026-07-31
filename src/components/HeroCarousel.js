"use client";

import { useEffect, useState } from "react";

// 모션을 줄여 달라는 설정을 켜 둔 사람인가.
//
// CSS 의 @media(prefers-reduced-motion) 로는 이 캐러셀을 멈출 수 없다. 넘김이
// transition 이 아니라 setInterval 로 상태를 바꾸는 것이라 CSS 가 손댈 대상이 아니다.
// 그래서 자바스크립트로 같은 질의를 읽는다.
//
// 서버 렌더에서는 알 수 없으므로 false 로 시작해 마운트 뒤에 맞춘다. 그동안 자동
// 넘김이 한 번 도는 일은 없다 — 아래 useEffect 가 reduced 를 확인한 뒤에야 타이머를 건다.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

// 대표 이미지 좌우 슬라이드(자동 회전) 히어로. 이미지·문구는 관리자에서 편집.
const FALLBACK = ["/uploads/hall-left.jpg"];

// 문구는 세 층이다.
//   상단 문구(eyebrow) — 짧고 강한 한마디. 석간주로 크게.
//   제목(title)        — 가장 큰 글자.
//   소개 문구(lede)    — 부제. 작고 다른 색으로 받쳐 준다.
export default function HeroCarousel({ images, eyebrow = "", title = "", lede = "" }) {
  const imgs = images && images.length ? images : FALLBACK;
  const [i, setI] = useState(0);
  const reduced = usePrefersReducedMotion();
  // 사람이 직접 멈춘 상태. 모션 저감 설정과는 별개로 둔다 —
  // 설정을 켜지 않은 사람도 멈출 수 있어야 한다(WCAG 2.2.2).
  const [paused, setPaused] = useState(false);
  const running = imgs.length > 1 && !paused && !reduced;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setI((v) => (v + 1) % imgs.length), 4500);
    return () => clearInterval(t);
  }, [running, imgs.length]);

  return (
    <div className="hero-cx">
      <div className="hcx-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {imgs.map((src, idx) => (
          <div key={`${src}-${idx}`} className="hcx-slide" style={{ backgroundImage: `url(${src})` }} />
        ))}
      </div>
      <div className="hcx-veil" />
      <div className="hcx-caption">
        {eyebrow && <p className="hcx-lead">{eyebrow}</p>}
        {title && <h1>{title}</h1>}
        {lede && <p className="hcx-sub">{lede}</p>}
      </div>
      {imgs.length > 1 && (
        <div className="hcx-dots">
          {/* 자동으로 넘어가는 것을 멈출 수 있어야 한다(WCAG 2.2.2 — 5초 넘게 자동으로
              움직이는 것에는 일시정지 수단이 필요하다). 모션 저감 설정을 켠 사람에게는
              애초에 돌지 않으므로 이 버튼도 보이지 않는다. */}
          {!reduced && (
            <button
              type="button"
              className="hcx-pause"
              aria-label={paused ? "자동 넘김 다시 시작" : "자동 넘김 멈춤"}
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? "▶" : "❚❚"}
            </button>
          )}
          {imgs.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              className={idx === i ? "on" : ""}
              aria-label={`${idx + 1}번째 이미지`}
              aria-current={idx === i ? "true" : undefined}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
