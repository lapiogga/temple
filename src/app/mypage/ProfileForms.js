"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  updateNicknameAction,
  updatePhoneAction,
  updatePasswordAction,
  withdrawAction,
} from "./actions";

function SubmitButton({ label, busy = "저장 중…", variant = "btn-primary" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn ${variant}`} disabled={pending}>
      {pending ? busy : label}
    </button>
  );
}

// 액션이 돌려주는 { error } / { ok, message } 를 같은 자리에 보여 준다.
function Result({ state }) {
  if (state?.error) return <p className="adm-form-err" role="alert">{state.error}</p>;
  if (state?.ok && state.message) return <p className="adm-form-ok" role="status">{state.message}</p>;
  return null;
}

export default function ProfileForms({ nickname, phone }) {
  const [nickState, nickAction] = useFormState(updateNicknameAction, {});
  const [phoneState, phoneAction] = useFormState(updatePhoneAction, {});
  const [pwState, pwAction] = useFormState(updatePasswordAction, {});
  const [wdState, wdAction] = useFormState(withdrawAction, {});
  // 탈퇴는 실수로 열리면 안 되는 자리라 접어 둔다.
  const [wdOpen, setWdOpen] = useState(false);

  return (
    <div className="mypage-edit">
      <section className="mypage-card">
        <h2>닉네임</h2>
        <p className="mypage-help">게시판에 보이는 이름입니다. 바꾸면 지난 글의 표시명도 함께 바뀝니다.</p>
        <form action={nickAction}>
          <Result state={nickState} />
          <label className="auth-field">
            <span>새 닉네임</span>
            <input name="nickname" defaultValue={nickname ?? ""} required maxLength={30} />
          </label>
          <SubmitButton label="닉네임 바꾸기" />
        </form>
      </section>

      <section className="mypage-card">
        <h2>휴대폰 번호</h2>
        <p className="mypage-help">
          비밀번호를 잊으셨을 때 본인 확인에 쓰는 번호입니다. 그래서 바꿀 때 현재 비밀번호를 확인합니다.
        </p>
        <form action={phoneAction}>
          <Result state={phoneState} />
          <label className="auth-field">
            <span>새 휴대폰 번호</span>
            <input name="phone" type="tel" defaultValue={phone ?? ""} required inputMode="numeric" />
          </label>
          <label className="auth-field">
            <span>현재 비밀번호</span>
            <input name="currentPassword" type="password" required autoComplete="current-password" />
          </label>
          <SubmitButton label="휴대폰 번호 바꾸기" />
        </form>
      </section>

      <section className="mypage-card">
        <h2>비밀번호</h2>
        <form action={pwAction}>
          <Result state={pwState} />
          <label className="auth-field">
            <span>현재 비밀번호</span>
            <input name="currentPassword" type="password" required autoComplete="current-password" />
          </label>
          <label className="auth-field">
            <span>새 비밀번호 (8자 이상)</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <label className="auth-field">
            <span>새 비밀번호 확인</span>
            <input name="passwordConfirm" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <SubmitButton label="비밀번호 바꾸기" />
        </form>
      </section>

      <section className="mypage-card danger">
        <h2>회원 탈퇴</h2>
        <p className="mypage-help">
          탈퇴하면 성명·닉네임·생년월일·성별·휴대폰 번호를 지웁니다. 되돌릴 수 없습니다.
          이미 쓰신 글은 지워지지 않고 작성자만 &lsquo;탈퇴한 회원&rsquo; 으로 바뀝니다.
          글도 함께 지우고 싶으시면 탈퇴하기 전에 종무소로 알려 주세요.
        </p>
        {wdOpen ? (
          <form action={wdAction}>
            <Result state={wdState} />
            <label className="auth-field">
              <span>현재 비밀번호</span>
              <input name="currentPassword" type="password" required autoComplete="current-password" />
            </label>
            <label className="auth-field">
              <span>확인 — 아래 칸에 &lsquo;탈퇴합니다&rsquo; 를 그대로 입력해 주세요</span>
              <input name="confirm" required placeholder="탈퇴합니다" />
            </label>
            <div className="auth-actions">
              <SubmitButton label="탈퇴합니다" busy="처리 중…" variant="btn-danger" />
              <button type="button" className="btn btn-ghost" onClick={() => setWdOpen(false)}>
                그만두기
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setWdOpen(true)}>
            탈퇴 절차 열기
          </button>
        )}
      </section>
    </div>
  );
}
