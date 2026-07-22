"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addPhotoAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "업로드 중…" : "사진 추가"}
    </button>
  );
}

// 사진 업로드 폼(파일 → 서버 액션에서 저장). albumId 를 바인딩.
export default function PhotoUpload({ albumId }) {
  const action = addPhotoAction.bind(null, albumId);
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="adm-form" encType="multipart/form-data">
      {state?.error ? (
        <p className="adm-form-err" role="alert">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="adm-form-ok" role="status">사진이 추가되었습니다.</p>
      ) : null}

      <label className="adm-field">
        <span>이미지 (jpg/png/webp/gif · 8MB 이하)</span>
        <input name="image" type="file" accept="image/*" required />
      </label>

      <label className="adm-field">
        <span>설명 (선택)</span>
        <input name="caption" maxLength={200} placeholder="사진 설명" />
      </label>

      <div className="adm-form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
