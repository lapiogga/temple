"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : "정정 저장"}
    </button>
  );
}

// 휴대폰은 숫자만 저장한다(가입 폼과 같은 규칙). 화면에는 하이픈을 넣어 보여 준다.
function withHyphen(v) {
  const d = (v ?? "").replace(/\D/g, "");
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
}

export default function MemberEditForm({ action, member }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="adm-form">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      <p className="adm-hint">
        본인이 바꿀 수 없는 값을 종무소가 확인 후 정정하는 자리입니다. 특히 생년월일과
        휴대폰 번호는 회원이 비밀번호를 잊었을 때 본인을 확인하는 근거라, 이 값이 실제와
        다르면 회원이 비밀번호를 되찾을 방법이 없습니다.
      </p>

      <label className="adm-field">
        <span>아이디 (바꿀 수 없음)</span>
        <input value={member.login_id} disabled />
      </label>

      <label className="adm-field">
        <span>성명</span>
        <input name="name" defaultValue={member.name ?? ""} maxLength={50} required />
      </label>

      <label className="adm-field">
        <span>닉네임 (게시판 표시명 · 지난 글도 함께 바뀝니다)</span>
        <input name="nickname" defaultValue={member.nickname ?? ""} maxLength={30} required />
      </label>

      <label className="adm-field">
        <span>생년월일</span>
        <input
          name="birthDate"
          type="date"
          defaultValue={member.birth_date ?? ""}
          min="1900-01-01"
          required
        />
      </label>

      <label className="adm-field">
        <span>성별</span>
        <select name="gender" defaultValue={member.gender ?? "other"}>
          <option value="male">남</option>
          <option value="female">여</option>
          <option value="other">기타</option>
        </select>
      </label>

      <label className="adm-field">
        <span>휴대폰</span>
        <input
          name="phone"
          type="tel"
          defaultValue={withHyphen(member.phone)}
          placeholder="010-1234-5678"
          maxLength={20}
          required
        />
      </label>

      <div className="adm-form-actions">
        <SubmitButton />
        <Link href="/admin/members" className="btn btn-ghost">취소</Link>
      </div>
    </form>
  );
}
