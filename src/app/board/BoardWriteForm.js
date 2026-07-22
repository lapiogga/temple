"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import RichEditor from "@/components/RichEditor";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "등록 중…" : "등록"}
    </button>
  );
}

export default function BoardWriteForm({ action, defaultBoard = "free" }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="auth-card auth-wide">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      <label className="auth-field">
        <span>게시판</span>
        <select name="board" defaultValue={defaultBoard}>
          <option value="free">자유게시판</option>
          <option value="story">신행수기</option>
        </select>
      </label>

      <label className="auth-field">
        <span>제목</span>
        <input name="title" maxLength={200} required />
      </label>

      <div className="auth-field">
        <span>본문</span>
        <RichEditor name="body" />
      </div>

      <div className="auth-actions">
        <SubmitButton />
        <Link href="/board" className="btn btn-ghost">취소</Link>
      </div>
    </form>
  );
}
