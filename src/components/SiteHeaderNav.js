"use client";

import { useEffect, useState } from "react";
import { DharmaWheel } from "@/components/Icons";
import { SITE } from "@/content/site";
import { memberLogout } from "@/app/auth-actions";

// 대메뉴(그룹) + 하위 항목. 스크롤해도 상단 고정.
//
// '응선사 소개' 의 게시판 항목(법문·휴심선원)은 여기 적지 않는다. 이름과 순서가
// DB(board_categories, group_key='intro')에 있고 관리자가 /admin/intro 에서 고친다.
// SiteHeader(서버)가 읽어 introItems 로 넘겨준다 — 아래 buildMenu 참고.
const ABOUT_FIXED = [
  { href: "/about/greeting", label: "주지스님 인삿말" },
  { href: "/about/history", label: "연혁" },
  { href: "/about/sansindo", label: "산신도" },
  { href: "/about/guide", label: "안내도" },
];
// 길 안내는 소개 성격이 아니라 실무 정보라 소메뉴 맨 아래에 둔다
const ABOUT_TAIL = [{ href: "/visit", label: "오시는 길" }];

const MENU = [
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

// DB 에서 온 소개 게시판 항목을 '응선사 소개' 안에 끼워 넣는다.
// 조회가 실패하면 introItems 가 비고, 고정 항목만으로 메뉴가 선다(끊기지 않는다).
function buildMenu(introItems) {
  return [
    { label: "응선사 소개", items: [...ABOUT_FIXED, ...introItems, ...ABOUT_TAIL] },
    ...MENU,
  ];
}

export default function SiteHeaderNav({ auth: initialAuth, introItems = [] }) {
  const menu = buildMenu(introItems);

  // 서버가 준 값은 첫 페인트용 초기값으로만 쓴다.
  //
  // Next 의 Router Cache 때문에 <Link> 이동은 30초, 브라우저 뒤로가기는 만료
  // 없이 옛 화면을 그대로 복원한다. 그래서 로그인/로그아웃 뒤 돌아오면 상단바가
  // 옛 상태로 남는다. 클라이언트 fetch 는 그 캐시를 타지 않으므로, 화면이
  // 되살아나는 시점마다 실제 상태로 덮어쓴다.
  const [auth, setAuth] = useState(initialAuth);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        if (alive) setAuth(d);
      } catch {
        // 네트워크 실패 시에는 서버가 준 초기값을 그대로 둔다.
      }
    };
    sync();
    // pageshow(persisted) 는 bfcache 복원, popstate 는 뒤로/앞으로,
    // focus 는 다른 탭에서 로그인/로그아웃하고 돌아온 경우를 덮는다.
    const onPageShow = (e) => { if (e.persisted) sync(); };
    window.addEventListener("popstate", sync);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", sync);
    return () => {
      alive = false;
      window.removeEventListener("popstate", sync);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const [menuOpen, setMenuOpen] = useState(false); // 모바일 드로어
  const [openGroup, setOpenGroup] = useState(null); // 열린 대메뉴 index

  const closeAll = () => {
    setMenuOpen(false);
    setOpenGroup(null);
  };

  // 상단바와 모바일 드로어가 같은 항목을 쓴다. 좁은 화면에서는 상단바 쪽이 숨고
  // 드로어 안의 것만 보인다(globals.css) — 브랜드명과 같은 줄에 두면 줄바꿈이 났다.
  const actions = (
    <>
      <a className="top-link" href="/" onClick={closeAll}>홈</a>
      {auth?.admin ? (
        <a className="top-admin" href="/admin" onClick={closeAll}>관리자 화면</a>
      ) : auth?.member ? (
        <>
          <span className="top-who">{auth.memberName}</span>
          <a className="top-link" href="/mypage" onClick={closeAll}>내 정보</a>
          {/* 로그아웃은 어느 화면에서든 바로 되게 둔다.
              예전에는 /mypage 안에만 있어 거기까지 들어가야 했다. */}
          <form action={memberLogout}>
            <button type="submit" className="top-admin">로그아웃</button>
          </form>
        </>
      ) : (
        <>
          <a className="top-login" href="/member-login" onClick={closeAll}>로그인</a>
          <a className="top-admin" href="/login" onClick={closeAll}>관리자</a>
        </>
      )}
    </>
  );

  return (
    <header className="nav">
      {/* 본문 바로가기(WCAG 2.4.1 — 블록 건너뛰기).
          대메뉴가 3개 그룹에 소메뉴 17개라, 키보드나 스크린리더로 다니는 사람은
          화면을 옮길 때마다 그 전부를 지나야 본문에 닿는다. 평소에는 보이지 않고
          Tab 을 처음 눌렀을 때만 나타난다. 목표(#main)는 이 헤더 끝에 둔다 —
          거기로 옮기면 다음 Tab 이 곧장 본문으로 들어간다. */}
      <a className="skip-link" href="#main">본문 바로가기</a>

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
          <div className="top-actions">{actions}</div>
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
            {menu.map((g, i) => (
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
            {/* 좁은 화면에서는 상단바 대신 여기서 보인다 */}
            <div className="gnb-actions">{actions}</div>
          </nav>
        </div>
      </div>
      {/* 위 skip-link 가 데려오는 자리. tabIndex=-1 이라야 링크로 이동했을 때
          실제로 포커스가 옮겨 간다(그냥 앵커면 스크롤만 되고 포커스는 안 따라온다). */}
      <span id="main" tabIndex={-1} />
    </header>
  );
}
