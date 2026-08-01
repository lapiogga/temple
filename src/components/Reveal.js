"use client";

import { useEffect } from "react";

// 스크롤 진입 시 .reveal 요소에 .in 을 부여하는 관찰자. 렌더 출력은 없음.
//
// 왜 MutationObserver 까지 두는가 —
// 예전에는 마운트 때 querySelectorAll 로 목록을 한 번 붙잡았다. 그런데 쪽 넘김(Pager)은
// <Link> 라 소프트 내비게이션이고, Next 는 페이지 세그먼트의 React key 를 '검색 파라미터를
// 뺀' 값으로 준다(next/dist/client/components/layout-router.js:447 —
// createRouterCacheKey(preservedSegment, true)). 그래서 ?page=1 ↔ ?page=2 는 키가 같아
// 이 컴포넌트가 리마운트되지 않는다. 새로 그려진 .reveal 요소는 아무도 관찰하지 않아
// opacity:0 인 채로 영영 남는다 — 2026-08-01 에 갤러리에서 실제로 목록이 사라졌다.
// 아래 안전망도 마운트 때의 목록을 가둬 두고 있어서 구제하지 못했다.
// 라우터 사정을 묻지 않도록 "DOM 에 새 .reveal 이 붙으면 관찰한다" 로 바꾼다.
// 같은 이유로 갤러리 가름막(전체/일반/회원전용)과 게시판·공지·문의 목록도 함께 풀린다.
export default function Reveal() {
  useEffect(() => {
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

    let fallback;
    let queued = false;

    function scan() {
      queued = false;
      let added = 0;
      document.querySelectorAll(".reveal").forEach((el) => {
        // 이미 걸어 둔 요소는 건너뛴다. 쪽을 넘기면 DOM 노드 자체가 새로 생기므로
        // 이 표시도 함께 사라진다 — 새 목록은 다시 관찰 대상이 된다.
        if (el.dataset.revealSeen) return;
        el.dataset.revealSeen = "1";
        el.style.transitionDelay = `${(added % 3) * 0.06}s`;
        io.observe(el);
        added += 1;
      });

      // 안전망: 관찰자가 놓치는 경우(해시 점프·비정상 스크롤 등)에도 콘텐츠가 영구히
      // 숨지 않도록 일정 시간 뒤 모두 표시한다. 새 요소가 들어왔을 때만 다시 건다 —
      // 무관한 DOM 변경마다 시한을 미루면 안전망이 영영 안 터진다.
      if (added > 0) {
        clearTimeout(fallback);
        fallback = setTimeout(() => {
          document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
        }, 2500);
      }
    }

    scan();

    // childList 만 본다. .in 부여·transitionDelay·data-reveal-seen 은 모두 속성 변경이라
    // 여기로 되돌아오지 않는다(되먹임 없음). 한 번의 렌더가 여러 변경을 내므로 한 박자 모은다.
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      setTimeout(scan, 0);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return null;
}
