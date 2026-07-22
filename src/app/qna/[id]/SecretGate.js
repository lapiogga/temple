"use client";

import { useFormState, useFormStatus } from "react-dom";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "확인 중…" : "열람"}
    </button>
  );
}

function fmtIso(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`;
}

export default function SecretGate({ action }) {
  const [state, formAction] = useFormState(action, {});

  if (state?.ok) {
    const q = state.q;
    return (
      <div>
        <h1 className="serif" style={{ fontSize: "clamp(24px,4vw,32px)", fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>
          {q.title}
        </h1>
        <div style={{ color: "var(--ink-soft)", fontSize: "15px", marginBottom: "22px" }}>
          {q.authorName} · {fmtIso(q.createdAt)}
        </div>
        <div style={{ whiteSpace: "pre-line", fontSize: "17px", lineHeight: 1.8, color: "var(--ink)" }}>{q.body}</div>
        {q.answer && (
          <div className="qna-answer">
            <div className="a-label">🙏 답변</div>
            <div style={{ whiteSpace: "pre-line", fontSize: "16.5px", lineHeight: 1.8 }}>{q.answer}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-card">
      <p style={{ marginBottom: "14px", color: "var(--ink-soft)" }}>🔒 비밀글입니다. 열람 비밀번호를 입력하세요.</p>
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
