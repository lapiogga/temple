"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import RichEditor from "@/components/RichEditor";

// 서버(lib/upload.js 의 ALLOWED · MAX_BYTES)와 같은 값이어야 한다.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

// new/edit 공용 폼. action 은 서버 액션(create 또는 id-bound update).
export default function NoticeForm({ action, initial = {}, submitLabel = "저장" }) {
  const [state, formAction] = useFormState(action, {});
  const isNew = initial.id == null;

  // coverUrl 은 '이미 저장돼 있는 값'만 들고 있는다. 새로 고른 파일은 coverFile 로
  // 함께 전송되고 서버가 저장한 뒤 그 경로로 덮어쓴다. 미리보기는 둘 중 하나다.
  const fileRef = useRef(null);
  const [coverUrl, setCoverUrl] = useState(initial.cover_url ?? "");
  const [picked, setPicked] = useState(null); // 새로 고른 파일의 미리보기 URL
  const [notice, setNotice] = useState("");
  const preview = picked ?? (coverUrl || null);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // 안내문에 적은 것을 여기서도 실제로 막는다. 서버까지 갔다가 터지면 이미 폼을
    // 제출한 뒤라 되돌리는 비용이 크다.
    if (!ALLOWED_TYPES.includes(f.type) || f.size > MAX_BYTES) {
      setNotice("jpg · png · webp · gif 형식의 8MB 이하 파일만 올릴 수 있습니다.");
      e.target.value = "";
      setPicked(null);
      return;
    }
    setNotice("");
    setPicked(URL.createObjectURL(f));
  };

  const clearCover = () => {
    setCoverUrl("");
    setPicked(null);
    setNotice("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <form action={formAction} className="adm-form adm-form-wide">
      {state?.error ? (
        <p className="adm-form-err" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="adm-field">
        <span>제목</span>
        <input name="title" defaultValue={initial.title ?? ""} maxLength={200} required />
      </label>

      <div className="adm-field">
        <span>본문</span>
        <RichEditor name="body" initialValue={initial.body ?? ""} />
      </div>

      {/* 대표 이미지.
          예전에는 https 주소를 적는 칸 하나뿐이었다. 파일을 올릴 방법이 없어서
          이미지를 다른 곳에 먼저 올려 둔 사람만 쓸 수 있는 칸이었다 — 종무소에서
          쓰라고 만든 화면인데 사실상 개발자용이었다. 갤러리·히어로와 같은 방식으로
          직접 고르게 바꾼다. 고른 파일은 저장할 때 함께 올라간다. */}
      <div className="adm-field">
        <span>대표 이미지 (선택)</span>
        <input type="hidden" name="coverUrl" value={coverUrl} />
        {preview ? (
          <div className="adm-cover-pick">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="대표 이미지 미리보기" className="adm-cover-thumb" />
            <button type="button" className="adm-link-btn danger" onClick={clearCover}>
              빼기
            </button>
          </div>
        ) : null}
        <input
          ref={fileRef}
          name="coverFile"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onPick}
        />
        <p className="adm-hint">jpg · png · webp · gif / 8MB 이하</p>
        {notice ? <p className="adm-form-err" role="alert">{notice}</p> : null}
      </div>

      <div className="adm-checks">
        <label>
          <input type="checkbox" name="isPinned" defaultChecked={!!initial.is_pinned} /> 상단 고정
        </label>
        <label>
          <input
            type="checkbox"
            name="published"
            defaultChecked={isNew ? true : !!initial.published}
          />{" "}
          공개
        </label>
      </div>

      <div className="adm-form-actions">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/notices" className="btn btn-ghost">
          취소
        </Link>
      </div>
    </form>
  );
}
