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
      {state?.needsReset ? (
        <p className="adm-form-err" role="alert">
          종무소에서 이 계정의 비밀번호를 초기화했습니다. 가입할 때 적으신 휴대폰 번호와
          생년월일을 확인한 뒤 새 비밀번호를 정해 주세요.{" "}
          <Link href={`/member-login/reset?loginId=${encodeURIComponent(state.loginId)}`}>
            새 비밀번호 설정하기 →
          </Link>
        </p>
      ) : null}
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
        {/* /find-account 는 아직 서버액션이 없는 껍데기다. 종무소가 초기화해 준
            계정은 이 경로로 새 비밀번호를 정할 수 있다. */}
        <Link href="/member-login/reset">비밀번호 재설정</Link>
      </div>
    </form>
  );
}
