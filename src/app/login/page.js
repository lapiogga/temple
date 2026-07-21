"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "./actions";
import "./login.css";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary login-submit" type="submit" disabled={pending}>
      {pending ? "확인 중…" : "로그인"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, {});

  return (
    <main className="login-wrap">
      <form className="login-card" action={formAction}>
        <h1 className="serif">운영자 로그인</h1>
        <p className="login-sub">사찰 홈페이지 관리자</p>

        {state?.error ? (
          <p className="login-err" role="alert">
            {state.error}
          </p>
        ) : null}

        <label className="login-field">
          <span>아이디</span>
          <input name="loginId" autoComplete="username" required autoFocus />
        </label>
        <label className="login-field">
          <span>비밀번호</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>

        <SubmitButton />
      </form>
    </main>
  );
}
