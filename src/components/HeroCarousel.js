"use client";

import { useEffect, useState } from "react";

// 대표 이미지 좌우 슬라이드(자동 회전) 히어로. 이미지·문구는 관리자에서 편집.
const FALLBACK = ["/uploads/hall-left.jpg"];

// 문구는 세 층이다.
//   상단 문구(eyebrow) — 짧고 강한 한마디. 석간주로 크게.
//   제목(title)        — 가장 큰 글자.
//   소개 문구(lede)    — 부제. 작고 다른 색으로 받쳐 준다.
export default function HeroCarousel({ images, eyebrow = "", title = "", lede = "" }) {
  const imgs = images && images.length ? images : FALLBACK;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (imgs.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % imgs.length), 4500);
    return () => clearInterval(t);
  }, [imgs.length]);

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
          {imgs.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              className={idx === i ? "on" : ""}
              aria-label={`${idx + 1}번째 이미지`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
