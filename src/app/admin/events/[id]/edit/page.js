import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getEvent, listAttachments } from "@/lib/events";
import EventForm from "../../EventForm";
import AttachmentUpload from "../../AttachmentUpload";
import { updateEventAction, deleteAttachmentAction } from "../../actions";

function fmtSize(n) {
  if (!n) return "";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

export default async function EditEvent({ params }) {
  await requireSession();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const e = await getEvent(id);
  if (!e) notFound();
  const attachments = await listAttachments(id);
  const bound = updateEventAction.bind(null, id);

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">일정 수정</h1>
        <Link className="btn btn-ghost" href="/admin/events">← 목록</Link>
      </div>

      <EventForm action={bound} initial={e} submitLabel="저장" />

      <h2 className="adm-h1" style={{ fontSize: "20px", marginTop: "30px" }}>첨부파일 추가</h2>
      <AttachmentUpload eventId={id} />

      <h2 className="adm-h1" style={{ fontSize: "20px", marginTop: "30px" }}>
        첨부 {attachments.length}개
      </h2>
      {attachments.length === 0 ? (
        <p className="adm-empty">첨부파일이 없습니다.</p>
      ) : (
        <ul className="attach-list">
          {attachments.map((a) => (
            <li key={a.id}>
              <a href={a.file_url} target="_blank" rel="noopener noreferrer">{a.filename}</a>
              <span className="sz">{fmtSize(a.size)}</span>
              <form action={deleteAttachmentAction}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="eventId" value={id} />
                <button type="submit" className="adm-link-btn danger">삭제</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
