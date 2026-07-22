import Link from "next/link";

// 페이지네이션 — 기존 쿼리(query)를 보존하며 page 만 교체. 1페이지면 렌더 안 함.
export default function Pager({ basePath, query = {}, page, totalPages }) {
  if (totalPages <= 1) return null;
  const href = (p) => {
    const sp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== "") sp.set(k, String(v));
    });
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav className="pager" aria-label="페이지 이동">
      <Link className="pg-arrow" href={href(Math.max(1, page - 1))} aria-disabled={page === 1} tabIndex={page === 1 ? -1 : 0}>‹</Link>
      {nums.map((n) => (
        <Link key={n} className={`pg-num${n === page ? " on" : ""}`} href={href(n)} aria-current={n === page ? "page" : undefined}>
          {n}
        </Link>
      ))}
      <Link className="pg-arrow" href={href(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages} tabIndex={page === totalPages ? -1 : 0}>›</Link>
    </nav>
  );
}
