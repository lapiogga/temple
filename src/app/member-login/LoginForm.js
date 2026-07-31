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
      {/* 안내를 '실패 전체' 에 붙인다. 예전에는 초기화 대기 계정일 때만 따로 띄웠는데,
          그러면 비밀번호를 몰라도 그 계정의 존재와 상태를 알아낼 수 있었다.
          문구가 늘 같으면 아무것도 새지 않으면서, 종무소가 초기화해 준 회원도
          여기서 갈 곳을 찾는다. */}
      {state?.error ? (
        <div className="adm-form-err" role="alert">
          <p style={{ marginBottom: "var(--sp-m)" }}>{state.error}</p>
          <p style={{ marginBottom: "var(--sp-m)" }}>
            종무소에서 비밀번호를 초기화해 드린 경우에도 같은 문구가 나옵니다. 그때는
            가입할 때 적으신 휴대폰 번호와 생년월일로 새 비밀번호를 정하실 수 있습니다.
          </p>
          {/* 문장 속 링크는 눈에 띄지 않아 버튼으로 둔다. */}
          <Link className="btn btn-primary" href="/member-login/reset">
            새 비밀번호 설정하기 →
          </Link>
        </div>
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
