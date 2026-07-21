import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listNotices } from "@/lib/notices";

export default async function AdminHome() {
  await requireSession();
  const notices = await listNotices({ includeUnpublished: true });
  const publishedCount = notices.filter((n) => n.published).length;

  return (
    <section>
      <h1 className="adm-h1">대시보드</h1>
      <div className="adm-cards">
        <div className="adm-card">
          <div className="adm-card-n">{notices.length}</div>
          <div className="adm-card-l">전체 소식</div>
        </div>
        <div className="adm-card">
          <div className="adm-card-n">{publishedCount}</div>
          <div className="adm-card-l">공개 중</div>
        </div>
      </div>
      <p className="adm-quick">
        <Link className="btn btn-primary" href="/admin/notices">
          소식 관리로 이동
        </Link>
      </p>
    </section>
  );
}
