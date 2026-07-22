"use client";

import { useEffect, useState } from "react";

// 대표 이미지 좌우 슬라이드(자동 회전) 히어로. 이미지·문구는 관리자에서 편집.
const FALLBACK = ["/uploads/hall-left.jpg"];

export default function HeroCarousel({ images, eyebrow = "", title = "" }) {
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
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <h1>{title}</h1>}
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
