"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

// 앨범 생성/수정 공용 폼.
export default function AlbumForm({ action, initial = {}, submitLabel = "저장" }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="adm-form">
      {state?.error ? (
        <p className="adm-form-err" role="alert">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="adm-form-ok" role="status">저장되었습니다.</p>
      ) : null}

      <label className="adm-field">
        <span>앨범 제목</span>
        <input name="title" defaultValue={initial.title ?? ""} maxLength={120} required />
      </label>

      <label className="adm-field">
        <span>공개 범위</span>
        <select name="visibility" defaultValue={initial.visibility ?? "public"}>
          <option value="public">공개</option>
          <option value="member">회원 전용(2차)</option>
        </select>
      </label>

      <div className="adm-form-actions">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/gallery" className="btn btn-ghost">목록</Link>
      </div>
    </form>
  );
}
