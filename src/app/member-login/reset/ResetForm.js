"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "설정 중…" : "새 비밀번호 설정"}
    </button>
  );
}

export default function ResetForm({ action, defaultLoginId = "" }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="auth-card auth-wide">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      <p className="find-desc">
        종무소가 비밀번호를 초기화해 드린 계정만 이 화면에서 새 비밀번호를 정할 수 있습니다.
        가입할 때 적으신 <b>휴대폰 번호</b>와 <b>생년월일</b>로 본인 확인을 합니다.
      </p>

      <label className="auth-field">
        <span>아이디</span>
        <input name="loginId" defaultValue={defaultLoginId} maxLength={30} required autoComplete="username" />
      </label>
      <label className="auth-field">
        <span>휴대폰 번호</span>
        <input name="phone" maxLength={20} required placeholder="010-1234-5678" inputMode="tel" />
      </label>
      <label className="auth-field">
        <span>생년월일</span>
        <input name="birthDate" type="date" required />
      </label>
      <label className="auth-field">
        <span>새 비밀번호 (8자 이상)</span>
        <input name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" />
      </label>
      <label className="auth-field">
        <span>새 비밀번호 확인</span>
        <input name="passwordConfirm" type="password" minLength={8} maxLength={72} required autoComplete="new-password" />
      </label>

      <div className="auth-actions">
        <SubmitButton />
        <Link href="/member-login" className="btn btn-ghost">취소</Link>
      </div>
    </form>
  );
}
