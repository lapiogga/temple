"use client";

import { useState } from "react";
import { DharmaWheel } from "@/components/Icons";
import { SITE } from "@/content/site";

// 대메뉴(그룹) + 하위 항목. 스크롤해도 상단 고정.
const MENU = [
  {
    label: "응선사 소개",
    items: [
      { href: "/about/greeting", label: "주지스님 인삿말" },
      { href: "/about/history", label: "연혁" },
      { href: "/about/sansindo", label: "산신도" },
      { href: "/about/guide", label: "안내도" },
      { href: "/about/teaching", label: "법문-살며 생각하며" },
      { href: "/about/hyusim-tapjeon", label: "휴심선원(탑전)" },
      { href: "/about/hyusim-jirisan", label: "휴심선원(지리산 휴심)" },
      // 길 안내는 소개 성격이 아니라 실무 정보라 소메뉴 맨 아래에 둔다
      { href: "/visit", label: "오시는 길" },
    ],
  },
  {
    label: "안내/정보",
    items: [
      { href: "/notices", label: "공지사항" },
      { href: "/events", label: "법회·행사" },
      { href: "/gallery", label: "갤러리" },
      { href: "/board", label: "게시판" },
      { href: "/qna", label: "묻고답하기" },
      { href: SITE.youtubeUrl, label: "유튜브 법문", external: true },
    ],
  },
  {
    label: "회원정보",
    items: [{ href: "/join", label: "회원 가입" }],
  },
];

export default function SiteHeaderNav({ auth }) {
  const [menuOpen, setMenuOpen] = useState(false); // 모바일 드로어
  const [openGroup, setOpenGroup] = useState(null); // 열린 대메뉴 index

  const closeAll = () => {
    setMenuOpen(false);
    setOpenGroup(null);
  };

  return (
    <header className="nav">
      {/* 최상단: 타이틀 · 홈 · 로그인 */}
      <div className="topbar">
        <div className="wrap topbar-in">
          <a className="brand" href="/#top" onClick={closeAll}>
            <DharmaWheel />
            <span className="name">{SITE.name}</span>
          </a>
          {/* 로그인 상태를 그대로 비춘다. 예전에는 세션과 무관하게 늘 '로그인/관리자'
              였고, 그래서 운영자로 로그인한 채 공개 화면으로 나오면 관리자 모드가
              풀린 것처럼 보이고 관리 화면으로 돌아갈 길도 없었다. */}
          <div className="top-actions">
            <a className="top-link" href="/" onClick={closeAll}>홈</a>
            {auth?.admin ? (
              <a className="top-admin" href="/admin" onClick={closeAll}>관리자 화면</a>
            ) : auth?.member ? (
              <>
                <a className="top-link" href="/mypage" onClick={closeAll}>내 정보</a>
                <span className="top-who">{auth.memberName}</span>
              </>
            ) : (
              <>
                <a className="top-login" href="/member-login" onClick={closeAll}>로그인</a>
                <a className="top-admin" href="/login" onClick={closeAll}>관리자</a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 대메뉴 바(드롭다운) */}
      <div className="mainbar">
        <div className="wrap mainbar-in">
          <button
            className="hmb"
            aria-label="메뉴"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`gnb${menuOpen ? " open" : ""}`} aria-label="주 메뉴">
            {MENU.map((g, i) => (
              <div
                key={g.label}
                className={`gnb-group${openGroup === i ? " open" : ""}`}
                onMouseEnter={() => setOpenGroup(i)}
                onMouseLeave={() => setOpenGroup((o) => (o === i ? null : o))}
              >
                <button
                  className="gnb-top"
                  aria-expanded={openGroup === i}
                  onClick={() => setOpenGroup((o) => (o === i ? null : i))}
                >
                  {g.label}
                  <i className="caret" aria-hidden>▾</i>
                </button>
                <div className="gnb-sub">
                  {g.items.map((it) =>
                    it.external ? (
                      <a key={it.href} href={it.href} target="_blank" rel="noopener noreferrer" onClick={closeAll}>
                        {it.label} ↗
                      </a>
                    ) : (
                      <a key={it.href} href={it.href} onClick={closeAll}>
                        {it.label}
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
