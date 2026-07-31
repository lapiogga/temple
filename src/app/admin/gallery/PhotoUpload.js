"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addPhotosAction } from "./actions";

const MAX = 15;

function SubmitButton({ count }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || count === 0}>
      {pending ? "올리는 중…" : count === 0 ? "사진을 고르세요" : `${count}장 올리기`}
    </button>
  );
}

// 사진 여러 장을 한 번에 올린다.
//
// 예전에는 파일 하나를 고르고 '사진 추가' 를 누르는 것을 반복해야 했다. 한 앨범에
// 수십 장을 넣는 일이 흔한데 그 방식으로는 감당이 안 된다. 바뀐 점:
//  · 파일 선택창에서 여러 장을 한 번에 고른다(최대 15장)
//  · 창을 열지 않고 끌어다 놓아도 된다
//  · 고른 사진이 바로 썸네일로 보이고, 잘못 고른 것은 개별로 뺄 수 있다
//  · 설명은 사진마다 따로 적을 수 있고 비워 둬도 된다
//
// 고르자마자 자동 업로드하지 않은 이유: 잘못 고른 것을 빼거나 설명을 적을 틈이
// 없어진다. 대신 고르는 즉시 확인되므로 '추가하기' 를 반복할 일은 사라진다.
export default function PhotoUpload({ albumId }) {
  const action = addPhotosAction.bind(null, albumId);
  const [state, formAction] = useFormState(action, {});
  // { file, url(미리보기), caption }
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const picked = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (picked.length === 0) return;
    setItems((prev) => {
      const room = MAX - prev.length;
      if (room <= 0) {
        setNotice(`한 번에 최대 ${MAX}장까지 올릴 수 있습니다.`);
        return prev;
      }
      const take = picked.slice(0, room);
      setNotice(picked.length > room ? `${MAX}장까지만 담았습니다. 나머지는 다음에 올려 주세요.` : "");
      return [...prev, ...take.map((f) => ({ file: f, url: URL.createObjectURL(f), caption: "" }))];
    });
  };

  const removeAt = (i) =>
    setItems((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, k) => k !== i);
    });

  const setCaption = (i, v) =>
    setItems((prev) => prev.map((it, k) => (k === i ? { ...it, caption: v } : it)));

  // 전송 직전에 고른 파일을 input 에 실어 준다. 끌어다 놓은 것도 함께 가야 하므로
  // DataTransfer 로 FileList 를 다시 만든다(input.files 는 직접 못 넣는다).
  const onSubmit = () => {
    const dt = new DataTransfer();
    items.forEach((it) => dt.items.add(it.file));
    if (inputRef.current) inputRef.current.files = dt.files;
  };

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      className="adm-form adm-form-wide"
      encType="multipart/form-data"
    >
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}
      {state?.warn ? <p className="adm-form-err" role="alert">{state.warn}</p> : null}
      {state?.ok && !state?.warn ? (
        <p className="adm-form-ok" role="status">사진 {state.added}장을 등록했습니다.</p>
      ) : null}
      {notice ? <p className="adm-form-err" role="alert">{notice}</p> : null}

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
        aria-label="사진 고르기"
      >
        <b>사진을 끌어다 놓거나 눌러서 고르세요</b>
        <span>jpg · png · webp · gif / 장당 8MB 이하 / 한 번에 최대 {MAX}장</span>
        {items.length > 0 && <span className="photo-drop-count">{items.length}장 담김</span>}
      </div>

      {/* 실제 전송용. 화면에는 위 영역만 보인다. */}
      <input
        ref={inputRef}
        name="images"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {items.length > 0 && (
        <ul className="photo-picked">
          {items.map((it, i) => (
            <li key={it.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt="" />
              <input
                name="captions"
                value={it.caption}
                onChange={(e) => setCaption(i, e.target.value)}
                maxLength={200}
                placeholder="설명 (선택)"
                aria-label={`${i + 1}번째 사진 설명`}
              />
              <button type="button" className="adm-link-btn danger" onClick={() => removeAt(i)}>
                빼기
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="adm-form-actions">
        <SubmitButton count={items.length} />
        {items.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              items.forEach((it) => URL.revokeObjectURL(it.url));
              setItems([]);
              setNotice("");
            }}
          >
            모두 비우기
          </button>
        )}
      </div>
    </form>
  );
}
