"use client";

import { useEffect, useState } from "react";

// 어느 화면에서든 따라다니는 '제일 위로' 버튼.
// 긴 글을 읽고 나서 맨 위로 돌아가려면 스크롤바를 끌어야 했다.
//
// · 조금만 내려가도 뜨면 거슬리므로 한 화면 이상 내려갔을 때만 보인다.
// · 화면 하단 고정 푸터(--foot-h)를 가리지 않게 그 위에 띄운다.
// · 모션 저감 요청 시에는 부드러운 스크롤 대신 즉시 이동한다.
//   (CSS 의 scroll-behavior 와 달리 scrollTo({behavior}) 는 자동으로
//    prefers-reduced-motion 을 따르지 않는다.)
export default function ScrollTop() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      className={`scroll-top${shown ? " on" : ""}`}
      onClick={toTop}
      aria-label="제일 위로"
      // 숨어 있을 때는 키보드 탭 순서와 보조기술에서도 빠져야 한다.
      tabIndex={shown ? 0 : -1}
      aria-hidden={shown ? undefined : true}
    >
      <span aria-hidden>↑</span>
      <span className="scroll-top-label">위로</span>
    </button>
  );
}
