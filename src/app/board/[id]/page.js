import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { getPost, BOARD_LABEL } from "@/lib/posts";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export async function generateMetadata({ params }) {
  const id = parseId(params.id);
  if (!id) return { title: `게시판 | ${SITE.name}` };
  let p = null;
  try { p = await getPost(id); } catch { p = null; }
  return { title: p ? `${p.title} | ${SITE.name}` : `게시판 | ${SITE.name}` };
}

export default async function PostDetail({ params }) {
  const id = parseId(params.id);
  if (!id) notFound();
  let p = null;
  try { p = await getPost(id); } catch (err) { console.error("글 조회 실패:", err); }
  if (!p || !p.published) notFound();

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />
      <article className="blk">
        <div className="wrap" style={{ maxWidth: "760px" }}>
          <Link className="more" href="/board">← 게시판</Link>
          <div style={{ marginTop: "18px" }}>
            <span className="post-badge" style={{ fontSize: "14px" }}>{BOARD_LABEL[p.board] ?? ""}</span>
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 700, lineHeight: 1.3, margin: "6px 0 8px" }}>
            {p.title}
          </h1>
          <div style={{ color: "var(--ink-soft)", fontSize: "15px", marginBottom: "22px" }}>
            {p.author_name} · {fmt(p.created_at)}
          </div>
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: p.body }} />
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
