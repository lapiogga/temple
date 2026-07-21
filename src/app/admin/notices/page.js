import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listNotices } from "@/lib/notices";
import { togglePublishAction } from "./actions";
import DeleteButton from "./DeleteButton";

const CATEGORY_LABEL = { notice: "공지", news: "소식" };

function fmtDate(value) {
  const d = new Date(value);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}. ${mm}. ${dd}.`;
}

export default async function NoticesAdmin() {
  await requireSession();
  const notices = await listNotices({ includeUnpublished: true });

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">소식 관리</h1>
        <Link className="btn btn-primary" href="/admin/notices/new">
          + 새 소식
        </Link>
      </div>

      {notices.length === 0 ? (
        <p className="adm-empty">등록된 소식이 없습니다. 새 소식을 작성해 보세요.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>분류</th>
                <th>제목</th>
                <th>게시일</th>
                <th>상태</th>
                <th className="adm-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n) => (
                <tr key={n.id}>
                  <td>
                    {CATEGORY_LABEL[n.category] ?? n.category}
                    {n.is_pinned ? " · 고정" : ""}
                  </td>
                  <td className="adm-title-cell">
                    <Link href={`/admin/notices/${n.id}/edit`}>{n.title}</Link>
                  </td>
                  <td>{fmtDate(n.published_at)}</td>
                  <td>
                    <span className={n.published ? "adm-badge on" : "adm-badge off"}>
                      {n.published ? "공개" : "비공개"}
                    </span>
                  </td>
                  <td className="adm-actions">
                    <form action={togglePublishAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <input
                        type="hidden"
                        name="next"
                        value={(!n.published).toString()}
                      />
                      <button type="submit" className="adm-link-btn">
                        {n.published ? "숨김" : "공개"}
                      </button>
                    </form>
                    <Link
                      href={`/admin/notices/${n.id}/edit`}
                      className="adm-link-btn"
                    >
                      수정
                    </Link>
                    <DeleteButton id={n.id} title={n.title} />
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
