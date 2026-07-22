"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "로그인 중…" : "로그인"}
    </button>
  );
}

export default function LoginForm({ action }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="auth-card">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}
      <label className="auth-field">
        <span>아이디</span>
        <input name="loginId" required autoComplete="username" />
      </label>
      <label className="auth-field">
        <span>비밀번호</span>
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      <div className="auth-actions">
        <SubmitButton />
        <Link href="/join" className="btn btn-ghost">회원가입</Link>
      </div>
      <div className="auth-find">
        <Link href="/find-account?tab=id">아이디 찾기</Link>
        <span className="sep">|</span>
        <Link href="/find-account?tab=pw">비밀번호 찾기</Link>
      </div>
    </form>
  );
}
