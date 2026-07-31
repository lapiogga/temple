"use client";

import { deleteNoticeAction } from "./actions";

// 삭제는 되돌릴 수 없으므로 제출 전 확인.
export default function DeleteButton({ id, title }) {
  return (
    <form
      action={deleteNoticeAction}
      onSubmit={(e) => {
        if (!confirm(`"${title}" 공지사항을 삭제할까요?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="adm-link-btn danger">
        삭제
      </button>
    </form>
  );
}
