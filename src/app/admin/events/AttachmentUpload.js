"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addAttachmentAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "업로드 중…" : "첨부 추가"}
    </button>
  );
}

export default function AttachmentUpload({ eventId }) {
  const action = addAttachmentAction.bind(null, eventId);
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="adm-form" encType="multipart/form-data">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}
      {state?.ok ? <p className="adm-form-ok" role="status">첨부가 추가되었습니다.</p> : null}

      <label className="adm-field">
        <span>첨부파일 (이미지·pdf·hwp·doc·xls·ppt·txt · 20MB 이하)</span>
        <input name="file" type="file" required />
      </label>

      <div className="adm-form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
