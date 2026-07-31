"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 사진을 눌렀을 때 화면 가득 띄우는 뷰어. 확대/축소·이전/다음·닫기.
//
// 조작
//   ← →      이전 / 다음
//   + -      확대 / 축소   0 : 원래 크기
//   Esc      닫기
//   휠·핀치  확대 축소, 확대 상태에서 끌면 이동
//
// 열려 있는 동안 뒤 화면이 같이 스크롤되지 않도록 body 스크롤을 잠근다.
const MIN_Z = 1;
const MAX_Z = 5;

export default function PhotoLightbox({ photos = [], startIndex = 0, onClose }) {
  const [i, setI] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const closeRef = useRef(null);

  const cur = photos[i];
  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const go = useCallback(
    (d) => { setI((v) => (v + d + photos.length) % photos.length); setZoom(1); setPan({ x: 0, y: 0 }); },
    [photos.length]
  );
  const zoomBy = (d) =>
    setZoom((z) => {
      const nz = Math.min(MAX_Z, Math.max(MIN_Z, +(z + d).toFixed(2)));
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") zoomBy(0.5);
      else if (e.key === "-") zoomBy(-0.5);
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 열리면 닫기 버튼으로 초점을 옮겨 키보드 조작이 바로 먹게 한다.
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  if (!cur) return null;

  return (
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={`사진 ${i + 1} / ${photos.length}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="lb-bar">
        <span className="lb-count">{i + 1} / {photos.length}</span>
        <div className="lb-tools">
          <button type="button" onClick={() => zoomBy(-0.5)} aria-label="축소" disabled={zoom <= MIN_Z}>−</button>
          <span className="lb-zoom">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => zoomBy(0.5)} aria-label="확대" disabled={zoom >= MAX_Z}>＋</button>
          <button type="button" onClick={reset} aria-label="원래 크기">100%</button>
          <button type="button" ref={closeRef} onClick={() => onClose?.()} aria-label="닫기">✕</button>
        </div>
      </div>

      <div
        className="lb-stage"
        onWheel={(e) => { zoomBy(e.deltaY < 0 ? 0.25 : -0.25); }}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cur.image_url}
          alt={cur.caption ?? ""}
          draggable={false}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? "grab" : "auto",
          }}
        />
      </div>

      {photos.length > 1 && (
        <>
          <button type="button" className="lb-nav prev" onClick={() => go(-1)} aria-label="이전 사진">‹</button>
          <button type="button" className="lb-nav next" onClick={() => go(1)} aria-label="다음 사진">›</button>
        </>
      )}

      {cur.caption && <p className="lb-caption">{cur.caption}</p>}
    </div>
  );
}
