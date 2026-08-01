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
              {/*
                격자에는 썸네일, 눌러서 여는 뷰어에는 원본.
                썸네일 주소는 서버가 미리 넣어 준다(thumb_src). 이 컴포넌트는
                "use client" 라 파일 존재를 확인할 수 없기 때문이다.
                loading="lazy" 로 화면 밖 사진은 스크롤할 때 받는다 — 35장짜리 앨범이
                첫 화면에서 전부 내려받는 것을 막는다.
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb_src ?? p.image_url} alt={p.caption ?? albumTitle} loading="lazy" />
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
