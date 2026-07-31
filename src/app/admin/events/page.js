import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listAllEvents } from "@/lib/events";
import { formatWallDateTimeFull, formatWallDate } from "@/lib/format";
import DeleteButton from "./DeleteButton";

const KIND = { regular: "정기법회", event: "행사" };

// starts_at·recurrence_until 은 관리자가 친 벽시계라 UTC 로 고정해 꺼낸다
// (lib/format.js 머리말).
const fmt = (v) => (v ? formatWallDateTimeFull(v) : "");
const fmtDay = (v) => (v ? formatWallDate(v) : "");

export default async function EventsAdmin() {
  await requireSession();
  const events = await listAllEvents();

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">법회·행사 관리</h1>
        <Link className="btn btn-primary" href="/admin/events/new">+ 새 일정</Link>
      </div>

      {events.length === 0 ? (
        <p className="adm-empty">등록된 일정이 없습니다. 새 일정을 추가해 보세요.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>제목</th>
                <th>일정</th>
                <th>반복</th>
                <th className="adm-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{KIND[e.kind] ?? e.kind}</td>
                  <td className="adm-title-cell">
                    <Link href={`/admin/events/${e.id}/edit`}>{e.title}</Link>
                  </td>
                  <td>{e.recurrence ? e.when_text ?? "" : e.starts_at ? fmt(e.starts_at) : e.when_text ?? ""}</td>
                  <td>
                    {e.recurrence ? (
                      <span className="ev-rep">
                        반복
                        <em>
                          {e.starts_at ? fmtDay(e.starts_at) : "제한 없음"}
                          {" ~ "}
                          {e.recurrence_until ? fmtDay(e.recurrence_until) : "종료일 없음"}
                        </em>
                      </span>
                    ) : (
                      <span className="ev-once">1회</span>
                    )}
                  </td>
                  <td className="adm-actions">
                    <Link className="adm-link-btn" href={`/admin/events/${e.id}/edit`}>수정</Link>
                    <DeleteButton id={e.id} title={e.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
