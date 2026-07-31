"use client";

import { useState } from "react";
import PhotoLightbox from "@/components/PhotoLightbox";

// 앨범 사진 격자. 누르면 뷰어가 열린다.
// 서버 컴포넌트에서 사진 배열만 넘겨 받는다.
export default function PhotoGrid({ photos = [], albumTitle = "" }) {
  const [open, setOpen] = useState(null); // 열린 사진 index

  return (
    <>
      <div className="photo-grid">
        {photos.map((p, i) => (
          <figure className="reveal" key={p.id}>
            <button
              type="button"
              className="photo-open"
              onClick={() => setOpen(i)}
              aria-label={`${p.caption || albumTitle} 크게 보기`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt={p.caption ?? albumTitle} />
            </button>
            {p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>

      {open !== null && (
        <PhotoLightbox photos={photos} startIndex={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
