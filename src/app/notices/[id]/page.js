import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { getNotice } from "@/lib/notices";
import { formatDate } from "@/lib/format";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }) {
  const id = parseId(params.id);
  if (!id) return { title: `소식 | ${SITE.name}` };
  let n = null;
  try {
    n = await getNotice(id);
  } catch {
    n = null;
  }
  return { title: n ? `${n.title} | ${SITE.name}` : `소식 | ${SITE.name}` };
}

export default async function NoticeDetail({ params }) {
  const id = parseId(params.id);
  if (!id) notFound();

  let n = null;
  try {
    n = await getNotice(id);
  } catch (err) {
    console.error("소식 조회 실패:", err);
  }
  // 미공개(비공개/초안) 소식은 공개 열람 불가.
  if (!n || !n.published) notFound();

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />

      <article className="blk">
        <div className="wrap" style={{ maxWidth: "760px" }}>
          <Link className="more" href="/notices">← 소식 목록</Link>
          <div
            className="date"
            style={{
              marginTop: "18px",
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            {formatDate(n.published_at)}
          </div>
          <h1
            className="serif"
            style={{
              fontSize: "clamp(24px,4vw,34px)",
              fontWeight: 700,
              lineHeight: 1.3,
              margin: "6px 0 20px",
            }}
          >
            {n.title}
          </h1>
          {n.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={n.cover_url}
              alt={n.title}
              style={{
                width: "100%",
                borderRadius: "var(--radius)",
                border: "1px solid var(--line)",
                marginBottom: "22px",
              }}
            />
          )}
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: n.body }} />
        </div>
      </article>

      <SiteFooter />
    </>
  );
}
