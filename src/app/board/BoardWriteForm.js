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

export default function BoardWriteForm({ action, defaultBoard, categories = [], authorName }) {
  const [state, formAction] = useFormState(action, {});
  return (
    // auth-full: 이 폼만 화면 폭을 다 쓴다(.auth-card 기본 460px, .auth-wide 560px).
    <form action={formAction} className="auth-card auth-full">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      {/* 운영자·회원 쿠키가 동시에 살아 있을 수 있어, 어떤 이름으로 올라가는지 먼저 알린다. */}
      {authorName && (
        <p className="find-desc" style={{ marginBottom: "var(--sp-l)" }}>
          작성자 <b>{authorName}</b> 로 등록됩니다.
        </p>
      )}

      <label className="auth-field">
        <span>게시판</span>
        <select name="board" defaultValue={defaultBoard}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
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
