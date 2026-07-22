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

export default function SiteHeader() {
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
          <div className="top-actions">
            <a className="top-link" href="/" onClick={closeAll}>홈</a>
            <a className="top-login" href="/member-login" onClick={closeAll}>로그인</a>
            <a className="top-admin" href="/login" onClick={closeAll}>관리자</a>
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
