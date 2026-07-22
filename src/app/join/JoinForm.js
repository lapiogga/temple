"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

function SubmitButton({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || disabled}>
      {pending ? "가입 중…" : "가입 신청"}
    </button>
  );
}

const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/;

export default function JoinForm({ action }) {
  const [state, formAction] = useFormState(action, {});
  const [agreeT, setAgreeT] = useState(false);
  const [agreeP, setAgreeP] = useState(false);
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verified, setVerified] = useState(false);

  const allAgree = agreeT && agreeP;
  const setAll = (v) => { setAgreeT(v); setAgreeP(v); };

  const sendCode = () => {
    if (!PHONE_RE.test(phone)) { alert("휴대폰 번호를 정확히 입력하세요."); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code); setCodeSent(true); setVerified(false); setCodeInput("");
  };
  const verify = () => {
    if (sentCode && codeInput.trim() === sentCode) setVerified(true);
    else alert("인증번호가 일치하지 않습니다.");
  };

  const canSubmit = allAgree && verified;

  return (
    <form action={formAction} className="auth-card auth-wide">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      <div className="agree-box">
        <label className="agree-row" style={{ fontWeight: 700, borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "6px" }}>
          <input type="checkbox" checked={allAgree} onChange={(e) => setAll(e.target.checked)} />
          <span>약관에 모두 동의합니다.</span>
        </label>
        <label className="agree-row">
          <input type="checkbox" name="agreeTerms" checked={agreeT} onChange={(e) => setAgreeT(e.target.checked)} />
          <span><Link href="/terms" target="_blank" className="agree-link">서비스 이용약관</Link>에 동의합니다. (필수)</span>
        </label>
        <label className="agree-row">
          <input type="checkbox" name="agreePrivacy" checked={agreeP} onChange={(e) => setAgreeP(e.target.checked)} />
          <span><Link href="/privacy" target="_blank" className="agree-link">개인정보 보호정책</Link>에 동의합니다. (필수)</span>
        </label>
      </div>

      <label className="auth-field"><span>아이디</span>
        <input name="loginId" minLength={4} maxLength={30} required placeholder="영문·숫자·_ 4자 이상" />
      </label>
      <label className="auth-field"><span>비밀번호</span>
        <input name="password" type="password" minLength={8} maxLength={72} required placeholder="8자 이상" />
      </label>
      <label className="auth-field"><span>성명</span>
        <input name="name" maxLength={50} required />
      </label>
      <label className="auth-field"><span>생년월일</span>
        <input name="birthDate" type="date" required />
      </label>
      <label className="auth-field"><span>성별</span>
        <select name="gender" defaultValue="male">
          <option value="male">남</option>
          <option value="female">여</option>
          <option value="other">기타</option>
        </select>
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
            <p className="demo-note">데모 인증번호: <b>{sentCode}</b> (실서비스에서는 문자로 발송됩니다)</p>
          </>
        )}
        {verified && <p className="verified-note">✓ 본인인증 완료</p>}
        <input type="hidden" name="phoneVerified" value={verified ? "true" : "false"} />
      </div>

      <div className="sns-row">
        <button type="button" className="sns-btn kakao" disabled>카카오로 시작 (준비 중)</button>
        <button type="button" className="sns-btn naver" disabled>네이버로 시작 (준비 중)</button>
      </div>

      <div className="auth-actions">
        <SubmitButton disabled={!canSubmit} />
        <Link href="/member-login" className="btn btn-ghost">로그인</Link>
      </div>
      {!canSubmit && (
        <p className="demo-note">약관 동의와 휴대폰 본인인증을 완료하면 가입 신청이 가능합니다.</p>
      )}
    </form>
  );
}
