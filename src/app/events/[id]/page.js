import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { getEvent, listAttachments } from "@/lib/events";
import { SITE } from "@/content/site";

export const dynamic = "force-dynamic";

const KIND_LABEL = { regular: "정기법회", event: "행사" };

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
function fmtDateTime(startsAt) {
  const d = new Date(startsAt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const time = hh === "00" && mi === "00" ? "" : ` ${hh}:${mi}`;
  return `${d.getFullYear()}. ${mm}. ${dd}.${time}`;
}

export async function generateMetadata({ params }) {
  const id = parseId(params.id);
  if (!id) return { title: `법회·행사 | ${SITE.name}` };
  let e = null;
  try {
    e = await getEvent(id);
  } catch {
    e = null;
  }
  return { title: e ? `${e.title} | ${SITE.name}` : `법회·행사 | ${SITE.name}` };
}

export default async function EventDetail({ params }) {
  const id = parseId(params.id);
  if (!id) notFound();

  let e = null;
  try {
    e = await getEvent(id);
  } catch (err) {
    console.error("행사 조회 실패:", err);
  }
  if (!e) notFound();

  let attachments = [];
  try {
    attachments = await listAttachments(id);
  } catch (err) {
    console.error("첨부 조회 실패:", err);
  }

  const when = e.starts_at ? fmtDateTime(e.starts_at) : e.when_text;

  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <DancheongRule height={12} />

      <article className="blk">
        <div className="wrap" style={{ maxWidth: "760px" }}>
          <Link className="more" href="/events">← 법회·행사</Link>
          <div style={{ marginTop: "18px" }}>
            <span className="ev-kind" style={{ fontSize: "13px" }}>{KIND_LABEL[e.kind] ?? ""}</span>
          </div>
          <h1
            className="serif"
            style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 700, lineHeight: 1.3, margin: "6px 0 10px" }}
          >
            {e.title}
          </h1>
          {when && (
            <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "16px", marginBottom: "20px" }}>
              {when}
            </div>
          )}
          {e.description && (
            <div style={{ fontSize: "17px", lineHeight: 1.8, color: "var(--ink)", whiteSpace: "pre-line" }}>
              {e.description}
            </div>
          )}

          {attachments.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <h2 style={{ fontFamily: "var(--font-title)", fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>
                첨부파일
              </h2>
              <ul className="attach-list">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer">{a.filename}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>

      <SiteFooter />
    </>
  );
}
