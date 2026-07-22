"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : label}
    </button>
  );
}

// DB timestamptz → datetime-local 입력값("YYYY-MM-DDTHH:mm")
function toLocalInput(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function EventForm({ action, initial = {}, submitLabel = "저장" }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="adm-form">
      {state?.error ? (
        <p className="adm-form-err" role="alert">{state.error}</p>
      ) : null}

      <label className="adm-field">
        <span>구분</span>
        <select name="kind" defaultValue={initial.kind ?? "event"}>
          <option value="event">행사 (날짜 지정 → 캘린더 표시)</option>
          <option value="regular">정기 법회 (반복 · 문구 표시)</option>
        </select>
      </label>

      <label className="adm-field">
        <span>제목</span>
        <input name="title" defaultValue={initial.title ?? ""} maxLength={200} required />
      </label>

      <label className="adm-field">
        <span>표시 일정 문구 (정기 법회용 · 예: 매주 일요일 10:00)</span>
        <input name="whenText" defaultValue={initial.when_text ?? ""} maxLength={120} placeholder="정기 법회는 이 문구로 표시됩니다" />
      </label>

      <label className="adm-field">
        <span>행사 일시 (행사용 · 캘린더에 이 날짜로 표시)</span>
        <input name="startsAt" type="datetime-local" defaultValue={toLocalInput(initial.starts_at)} />
      </label>

      <label className="adm-field">
        <span>설명</span>
        <textarea name="description" defaultValue={initial.description ?? ""} rows={6} />
      </label>

      <label className="adm-field">
        <span>정렬 순서 (작을수록 먼저)</span>
        <input name="sortOrder" type="number" defaultValue={initial.sort_order ?? 0} min={0} max={9999} />
      </label>

      <div className="adm-form-actions">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/events" className="btn btn-ghost">취소</Link>
      </div>
    </form>
  );
}
