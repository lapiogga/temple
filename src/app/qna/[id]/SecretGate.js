"use client";

import { useFormState, useFormStatus } from "react-dom";
import QnaView from "./QnaView";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "확인 중…" : "열람"}
    </button>
  );
}

export default function SecretGate({ action }) {
  const [state, formAction] = useFormState(action, {});

  if (state?.ok) {
    const q = state.q;
    return (
      <QnaView
        title={q.title}
        authorName={q.authorName}
        createdAt={q.createdAt}
        body={q.body}
        answer={q.answer}
        answeredAt={q.answeredAt}
      />
    );
  }

  return (
    <div className="auth-card">
      <p style={{ marginBottom: "14px", color: "var(--n-fg-3)" }}>🔒 비밀글입니다. 열람 비밀번호를 입력하세요.</p>
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}
      <form action={formAction}>
        <label className="auth-field"><span>비밀번호</span>
          <input name="code" type="password" inputMode="numeric" required />
        </label>
        <Btn />
      </form>
    </div>
  );
}
