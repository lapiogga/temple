"use client";

import { deleteAlbumAction } from "./actions";

// 앨범 삭제(사진 포함). 확인 후 제출.
export default function DeleteAlbumButton({ id, title }) {
  return (
    <form
      action={deleteAlbumAction}
      onSubmit={(e) => {
        if (!confirm(`"${title}" 앨범과 사진을 모두 삭제할까요?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="adm-link-btn danger">앨범 삭제</button>
    </form>
  );
}
