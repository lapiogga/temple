"use client";

import { useEffect } from "react";

// 스크롤 진입 시 .reveal 요소에 .in 을 부여하는 관찰자. 렌더 출력은 없음.
// 안전망: 관찰자가 놓치는 경우(해시 점프·비정상 스크롤 등)에도
// 콘텐츠가 영구히 숨지 않도록 일정 시간 후 모두 표시한다.
export default function Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 0.06}s`;
      io.observe(el);
    });
    const fallback = setTimeout(() => {
      els.forEach((el) => el.classList.add("in"));
    }, 2500);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return null;
}
