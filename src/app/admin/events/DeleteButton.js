"use client";

import { deleteEventAction } from "./actions";

export default function DeleteButton({ id, title }) {
  return (
    <form
      action={deleteEventAction}
      onSubmit={(e) => {
        if (!confirm(`"${title}" 일정을 삭제할까요?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="adm-link-btn danger">삭제</button>
    </form>
  );
}
