"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import RichEditor from "@/components/RichEditor";

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

  return (
    <form action={formAction} className="adm-form">
      {state?.error ? (
        <p className="adm-form-err" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="adm-field">
        <span>분류</span>
        <select name="category" defaultValue={initial.category ?? "news"}>
          <option value="news">사찰 소식</option>
          <option value="notice">공지사항</option>
        </select>
      </label>

      <label className="adm-field">
        <span>제목</span>
        <input name="title" defaultValue={initial.title ?? ""} maxLength={200} required />
      </label>

      <div className="adm-field">
        <span>본문</span>
        <RichEditor name="body" initialValue={initial.body ?? ""} />
      </div>

      <label className="adm-field">
        <span>대표 이미지 URL (선택 · https)</span>
        <input
          name="coverUrl"
          type="url"
          defaultValue={initial.cover_url ?? ""}
          placeholder="https://…"
          maxLength={500}
        />
      </label>

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
