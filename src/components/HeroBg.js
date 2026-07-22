"use client";

import { useEffect, useState } from "react";

// 히어로 배경 자동 회전(크로스페이드). 텍스트 가독성을 위해 위에 한지 베일을 덮는다.
const IMAGES = [
  "/uploads/hall-left.jpg",
  "/uploads/hall-right.jpg",
  "/uploads/entrance-1.jpg",
  "/uploads/samjonbul.jpg",
];

export default function HeroBg() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (IMAGES.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hero-bg" aria-hidden="true">
      {IMAGES.map((src, idx) => (
        <div
          key={src}
          className={`hero-bg-img${idx === i ? " on" : ""}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className="hero-bg-veil" />
    </div>
  );
}
