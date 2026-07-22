import { requireSession } from "@/lib/session";
import AlbumForm from "../AlbumForm";
import { createAlbumAction } from "../actions";

export default async function NewAlbum() {
  await requireSession();
  return (
    <section>
      <h1 className="adm-h1">새 앨범</h1>
      <AlbumForm action={createAlbumAction} submitLabel="앨범 만들기" />
    </section>
  );
}
