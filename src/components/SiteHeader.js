"use client";

import { useState } from "react";
import { DharmaWheel } from "@/components/Icons";
import { SITE } from "@/content/site";

const NAV = [
  { href: "/about", label: "소개" },
  { href: "/#news", label: "소식" },
  { href: "/events", label: "법회·행사" },
  { href: "/gallery", label: "갤러리" },
  { href: "/#visit", label: "오시는 길" },
];

// 상단 사이트맵(푸터 바로가기 대체) — 하위 항목까지 포함.
const SITEMAP = [
  { href: "/about", label: "소개" },
  { href: "/about#history", label: "연혁" },
  { href: "/about#sansindo", label: "산신도" },
  { href: "/about#guide", label: "안내도" },
  { href: "/#news", label: "소식" },
  { href: "/events", label: "법회·행사" },
  { href: "/gallery", label: "갤러리" },
  { href: "/board", label: "게시판" },
  { href: "/qna", label: "묻고답하기" },
  { href: "/#visit", label: "오시는 길" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보" },
  { href: "/member-login", label: "로그인" },
  { href: "/join", label: "회원가입" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="nav">
        <div className="wrap row">
          <a className="brand" href="/#top">
            <DharmaWheel />
            <span className="name">
              {SITE.name} <small>{SITE.hanja} · {SITE.regionLabel}</small>
            </span>
          </a>
          <nav className={`menu${menuOpen ? " open" : ""}`}>
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>
                {n.label}
              </a>
            ))}
          </nav>
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
        </div>
      </header>

      <nav className="sitemap" aria-label="사이트맵">
        <div className="wrap sitemap-in">
          {SITEMAP.map((s) => (
            <a key={s.href + s.label} href={s.href}>{s.label}</a>
          ))}
        </div>
      </nav>
    </>
  );
}
