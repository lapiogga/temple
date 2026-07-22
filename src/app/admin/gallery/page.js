import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listAlbums } from "@/lib/gallery";

export default async function GalleryAdmin() {
  await requireSession();
  const albums = await listAlbums();

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">갤러리 관리</h1>
        <Link className="btn btn-primary" href="/admin/gallery/new">+ 새 앨범</Link>
      </div>

      {albums.length === 0 ? (
        <p className="adm-empty">앨범이 없습니다. 새 앨범을 만들어 보세요.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>앨범</th>
                <th>사진</th>
                <th>공개</th>
                <th className="adm-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((a) => (
                <tr key={a.id}>
                  <td className="adm-title-cell">
                    <Link href={`/admin/gallery/${a.id}`}>{a.title}</Link>
                  </td>
                  <td>{a.photo_count}장</td>
                  <td>
                    <span className={a.visibility === "public" ? "adm-badge on" : "adm-badge off"}>
                      {a.visibility === "public" ? "공개" : "회원"}
                    </span>
                  </td>
                  <td className="adm-actions">
                    <Link className="adm-link-btn" href={`/admin/gallery/${a.id}`}>관리</Link>
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
