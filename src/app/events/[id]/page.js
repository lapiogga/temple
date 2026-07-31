import Link from "next/link";
import BackLink from "@/components/BackLink";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
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
function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}. ${mm}. ${dd}.`;
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

      <article className="screen top">
        <div className="wrap wide">
          <div className="head-back"><BackLink href="/events" label="법회·행사" /></div>
          {/* 정해진 틀(표): 타이틀·일시·내용·작성자·작성일·첨부자료 */}
          <table className="detail-table">
            <tbody>
              <tr>
                <th scope="row">타이틀</th>
                <td>
                  {KIND_LABEL[e.kind] && <span className="ev-kind">{KIND_LABEL[e.kind]}</span>}
                  <span className="detail-title">{e.title}</span>
                </td>
              </tr>
              <tr>
                <th scope="row">일시</th>
                <td>{when || "-"}</td>
              </tr>
              <tr>
                <th scope="row">내용</th>
                <td className="detail-body">{e.description || "-"}</td>
              </tr>
              <tr>
                <th scope="row">작성자</th>
                <td>종무소</td>
              </tr>
              <tr>
                <th scope="row">작성일</th>
                <td>{fmtDate(e.created_at)}</td>
              </tr>
              <tr>
                <th scope="row">첨부자료</th>
                <td>
                  {attachments.length > 0 ? (
                    <ul className="attach-list">
                      {attachments.map((a) => (
                        <li key={a.id}>
                          <a href={a.file_url} target="_blank" rel="noopener noreferrer">{a.filename}</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: "var(--n-fg-3)" }}>첨부파일 없음</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <SiteFooter />
    </>
  );
}
