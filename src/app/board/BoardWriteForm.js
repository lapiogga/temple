"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import RichEditor from "@/components/RichEditor";

function SubmitButton({ label, pendingLabel }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

// 글 등록·수정 공용 폼.
//
// 수정일 때(postId 가 있을 때) 게시판은 고르지 못하게 고정한다. 게시판을 옮기면
// 카드형/목록형의 사진 요건이 달라지고 소개 게시판은 /about 주소까지 바뀌어서,
// '수정' 한 번에 딸려 오는 일이 너무 많아진다. 옮기는 것은 별개의 일로 둔다.
export default function BoardWriteForm({
  action,
  uploadAction,
  defaultBoard,
  categories = [],
  authorName,
  postId = null,
  initialTitle = "",
  initialBody = "",
  boardLabel = "",
  cancelHref = "/board",
}) {
  const [state, formAction] = useFormState(action, {});
  const isEdit = postId != null;

  return (
    // auth-full: 이 폼만 화면 폭을 다 쓴다(.auth-card 기본 460px, .auth-wide 560px).
    <form action={formAction} className="auth-card auth-full">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      {isEdit && <input type="hidden" name="id" value={postId} />}

      {/* 운영자·회원 쿠키가 동시에 살아 있을 수 있어, 어떤 이름으로 올라가는지 먼저 알린다.
          수정은 작성자를 바꾸지 않으므로 이 안내를 띄우지 않는다. */}
      {!isEdit && authorName && (
        <p className="find-desc" style={{ marginBottom: "var(--sp-l)" }}>
          작성자 <b>{authorName}</b> 로 등록됩니다.
        </p>
      )}

      <label className="auth-field">
        <span>게시판</span>
        {isEdit ? (
          <input value={boardLabel} readOnly disabled />
        ) : (
          <select name="board" defaultValue={defaultBoard}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        )}
      </label>

      <label className="auth-field">
        <span>제목</span>
        <input name="title" maxLength={200} required defaultValue={initialTitle} />
      </label>

      <div className="auth-field">
        <span>본문</span>
        <RichEditor name="body" initialValue={initialBody} uploadAction={uploadAction} />
      </div>

      <div className="auth-actions">
        <SubmitButton
          label={isEdit ? "수정" : "등록"}
          pendingLabel={isEdit ? "수정 중…" : "등록 중…"}
        />
        <Link href={cancelHref} className="btn btn-ghost">취소</Link>
      </div>
    </form>
  );
}
