"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/;

function SubmitButton({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || disabled}>
      {pending ? "등록 중…" : "등록"}
    </button>
  );
}

export default function QnaWriteForm({ action }) {
  const [state, formAction] = useFormState(action, {});
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [secret, setSecret] = useState(false);

  const sendCode = () => {
    if (!PHONE_RE.test(phone)) { alert("휴대폰 번호를 정확히 입력하세요."); return; }
    setSentCode(String(Math.floor(100000 + Math.random() * 900000)));
    setCodeSent(true); setVerified(false); setCodeInput("");
  };
  const verify = () => {
    if (sentCode && codeInput.trim() === sentCode) setVerified(true);
    else alert("인증번호가 일치하지 않습니다.");
  };

  return (
    <form action={formAction} className="auth-card auth-wide">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      <label className="auth-field"><span>이름</span>
        <input name="authorName" maxLength={50} required />
      </label>

      <div className="auth-field">
        <span>휴대폰 본인인증</span>
        <div className="phone-row">
          <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" maxLength={13} required />
          <button type="button" className="btn btn-ghost btn-sm" onClick={sendCode}>인증번호 발송</button>
        </div>
        {codeSent && !verified && (
          <>
            <div className="phone-row" style={{ marginTop: "8px" }}>
              <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="인증번호 6자리" maxLength={6} inputMode="numeric" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={verify}>확인</button>
            </div>
            <p className="demo-note">데모 인증번호: <b>{sentCode}</b> (실서비스에서는 문자로 발송)</p>
          </>
        )}
        {verified && <p className="verified-note">✓ 본인인증 완료</p>}
        <input type="hidden" name="phoneVerified" value={verified ? "true" : "false"} />
      </div>

      <label className="auth-field"><span>제목</span>
        <input name="title" maxLength={200} required />
      </label>

      <label className="auth-field"><span>내용</span>
        <textarea name="body" rows={8} maxLength={10000} required className="qna-textarea" />
      </label>

      <div className="agree-box">
        <label className="agree-row">
          <input type="checkbox" name="isSecret" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
          <span>비밀글로 작성 (작성자와 관리자만 열람)</span>
        </label>
        {secret && (
          <label className="auth-field" style={{ marginTop: "10px", marginBottom: 0 }}>
            <span>비밀글 비밀번호 (숫자 6자 이상)</span>
            <input name="secretCode" type="password" inputMode="numeric" maxLength={20} placeholder="열람용 비밀번호" />
          </label>
        )}
      </div>

      <div className="auth-actions">
        <SubmitButton disabled={!verified} />
        <Link href="/qna" className="btn btn-ghost">취소</Link>
      </div>
      {!verified && <p className="demo-note">휴대폰 본인인증 후 등록할 수 있습니다.</p>}
    </form>
  );
}
