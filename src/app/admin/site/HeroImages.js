"use client";

import { useEffect, useRef, useState } from "react";

const MAX = 10;

// 히어로 배경 이미지 관리.
//
// 예전에는 "/uploads/hall-left.jpg" 같은 경로를 textarea 에 직접 적었다. 파일을
// 어딘가에 먼저 올려 두고 경로를 알아내야 했으므로 사실상 개발자만 쓸 수 있었다.
// 갤러리 사진 등록과 같은 방식으로 바꾼다 — 끌어다 놓기, 썸네일 확인, 개별 빼기.
//
// 저장은 SectionForm 한 번으로 끝난다. 이 컴포넌트는 폼에 실릴 값만 들고 있다.
//   · 남길 기존 이미지 → hidden input name="images" (순서대로)
//   · 새로 올릴 파일   → file input name="newImages"
// 업로드/삭제를 각각 따로 실행하지 않는 이유: 중간에 폼을 벗어나면 이미지 목록과
// 문구가 서로 다른 시점의 상태로 남는다. 한 번의 저장으로 묶으면 그 틈이 없다.
export default function HeroImages({ initial = [] }) {
  const [kept, setKept] = useState(initial);
  const [picked, setPicked] = useState([]); // { file, url(미리보기) }
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);

  const total = kept.length + picked.length;

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const room = MAX - total;
    if (room <= 0) {
      setNotice(`배경 이미지는 최대 ${MAX}장까지 등록할 수 있습니다.`);
      return;
    }
    setNotice(files.length > room ? `${MAX}장까지만 담았습니다.` : "");
    setPicked((prev) => [
      ...prev,
      ...files.slice(0, room).map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    ]);
  };

  const move = (i, d) =>
    setKept((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const dropPicked = (i) =>
    setPicked((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, k) => k !== i);
    });

  // 고른 파일을 file input 에 실어 준다. 끌어다 놓은 것도 함께 가야 하므로
  // DataTransfer 로 FileList 를 다시 만든다(input.files 는 직접 못 넣는다).
  // 제출 시점이 아니라 목록이 바뀔 때마다 맞춰 둔다 — 폼의 onSubmit 을 가로채면
  // 이 컴포넌트가 부모 폼의 구조를 알아야 해서 결합이 생긴다.
  useEffect(() => {
    const dt = new DataTransfer();
    picked.forEach((p) => dt.items.add(p.file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }, [picked]);

  return (
    <div className="adm-field hero-imgs">
      <span>배경 이미지 ({total}/{MAX}장 · 좌우로 넘어가며 표시됩니다)</span>

      {notice ? <p className="adm-form-err" role="alert">{notice}</p> : null}

      {kept.length > 0 && (
        <ul className="hero-imglist">
          {kept.map((url, i) => (
            <li key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" />
              <input type="hidden" name="images" value={url} />
              <div className="hero-imgbtns">
                <button type="button" className="adm-link-btn" disabled={i === 0}
                  onClick={() => move(i, -1)} aria-label="앞으로">←</button>
                <button type="button" className="adm-link-btn" disabled={i === kept.length - 1}
                  onClick={() => move(i, 1)} aria-label="뒤로">→</button>
                <button type="button" className="adm-link-btn danger"
                  onClick={() => setKept((p) => p.filter((_, k) => k !== i))}>빼기</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        className={`photo-drop${dragging ? " on" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); }
        }}
        aria-label="배경 이미지 고르기"
      >
        <b>이미지를 끌어다 놓거나 눌러서 고르세요</b>
        <span>jpg · png · webp · gif / 장당 8MB 이하 / 모두 합쳐 최대 {MAX}장</span>
        {picked.length > 0 && <span className="photo-drop-count">{picked.length}장 새로 담김</span>}
      </div>

      <input
        ref={inputRef}
        name="newImages"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {picked.length > 0 && (
        <ul className="hero-imglist new">
          {picked.map((p, i) => (
            <li key={p.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" />
              <div className="hero-imgbtns">
                <span className="hero-imgnew">새로 추가</span>
                <button type="button" className="adm-link-btn danger" onClick={() => dropPicked(i)}>빼기</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {total === 0 && (
        <p className="adm-form-err" role="alert">
          이미지가 하나도 없으면 기본 이미지 한 장으로 표시됩니다.
        </p>
      )}
    </div>
  );
}
