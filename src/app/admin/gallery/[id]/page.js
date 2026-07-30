import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getAlbum, listPhotos } from "@/lib/gallery";
import { updateAlbumAction, deletePhotoAction } from "../actions";
import AlbumForm from "../AlbumForm";
import PhotoUpload from "../PhotoUpload";
import DeleteAlbumButton from "../DeleteAlbumButton";

export default async function ManageAlbum({ params }) {
  await requireSession();
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const album = await getAlbum(id);
  if (!album) notFound();
  const photos = await listPhotos(id);
  const updateBound = updateAlbumAction.bind(null, id);

  return (
    <section>
      <div className="adm-head">
        <h1 className="adm-h1">앨범 관리</h1>
        <Link className="btn btn-ghost" href="/admin/gallery">← 목록</Link>
      </div>

      <AlbumForm action={updateBound} initial={album} submitLabel="앨범 정보 저장" />

      <h2 className="adm-h1" style={{ fontSize: "var(--fs-500)", lineHeight: "var(--lh-500)", marginTop: "30px" }}>사진 추가</h2>
      <PhotoUpload albumId={id} />

      <h2 className="adm-h1" style={{ fontSize: "var(--fs-500)", lineHeight: "var(--lh-500)", marginTop: "30px" }}>
        사진 {photos.length}장
      </h2>
      {photos.length === 0 ? (
        <p className="adm-empty">등록된 사진이 없습니다.</p>
      ) : (
        <div className="adm-photo-grid">
          {photos.map((p) => (
            <figure key={p.id} className="adm-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt={p.caption ?? ""} />
              {p.caption && <figcaption>{p.caption}</figcaption>}
              <form action={deletePhotoAction}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="albumId" value={id} />
                <button type="submit" className="adm-link-btn danger">삭제</button>
              </form>
            </figure>
          ))}
        </div>
      )}

      <div style={{ marginTop: "34px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
        <DeleteAlbumButton id={id} title={album.title} />
      </div>
    </section>
  );
}
