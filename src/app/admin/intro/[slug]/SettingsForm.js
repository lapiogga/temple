"use client";

import { useFormState, useFormStatus } from "react-dom";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}

export default function SettingsForm({ action, category }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="adm-form" style={{ maxWidth: "100%" }}>
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}
      {state?.ok ? <p className="adm-form-ok">{state.ok}</p> : null}
      <input type="hidden" name="id" value={category.id} />

      <div className="ev-grid">
        <label className="adm-field">
          <span>이름 (대메뉴·화면 제목)</span>
          <input name="label" defaultValue={category.label} maxLength={30} required />
        </label>
        <label className="adm-field">
          <span>목록 형식</span>
          <select name="layout" defaultValue={category.layout}>
            <option value="list">목록 (표)</option>
            <option value="card">카드 (갤러리식, 첫 이미지가 썸네일)</option>
          </select>
        </label>
        <label className="adm-field">
          <span>주소 (고정)</span>
          <input value={`/about/${category.slug}`} readOnly disabled />
        </label>
      </div>
      <div className="adm-form-actions">
        <Submit />
      </div>
    </form>
  );
}
