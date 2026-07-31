"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import PhoneInput from "@/components/PhoneInput";
import { isValidPhone } from "@/lib/phone";

function SubmitButton({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending || disabled}>
      {pending ? "가입 중…" : "가입 신청"}
    </button>
  );
}

// 약관 스크롤 메모창: 끝까지 스크롤하면 동의 체크가 활성·자동 선택된다.
function AgreeScroll({ title, text, name, checked, onChange }) {
  const boxRef = useRef(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  // 내용이 짧아 스크롤이 필요 없으면 곧바로 동의 허용.
  useEffect(() => {
    const el = boxRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 4) setReachedEnd(true);
  }, [text]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (!reachedEnd && el.scrollHeight - el.scrollTop - el.clientHeight <= 4) {
      setReachedEnd(true); // 끝까지 스크롤 → 체크박스 활성화(직접 클릭해서 동의)
    }
  };

  return (
    <div className="agree-scroll">
      <div className="agree-scroll-head">{title} <span>(필수)</span></div>
      <div className="agree-scroll-box" ref={boxRef} onScroll={handleScroll}>
        {text || "약관 내용을 불러오지 못했습니다."}
      </div>
      <label className={`agree-row${reachedEnd ? "" : " is-locked"}`}>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          disabled={!reachedEnd}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          위 {title}을(를) 모두 읽었으며 이에 동의합니다.
          {!reachedEnd && <em className="agree-hint"> — 스크롤하여 내용을 끝까지 확인해 주세요.</em>}
        </span>
      </label>
    </div>
  );
}


export default function JoinForm({ action, terms, privacy }) {
  const [state, formAction] = useFormState(action, {});
  const [agreeT, setAgreeT] = useState(false);
  const [agreeP, setAgreeP] = useState(false);
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verified, setVerified] = useState(false);

  const allAgree = agreeT && agreeP;

  const sendCode = () => {
    if (!isValidPhone(phone)) { alert("휴대폰 번호를 정확히 입력하세요."); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code); setCodeSent(true); setVerified(false); setCodeInput("");
  };
  const verify = () => {
    if (sentCode && codeInput.trim() === sentCode) setVerified(true);
    else alert("인증번호가 일치하지 않습니다.");
  };

  const canSubmit = allAgree && verified;

  return (
    <form action={formAction} className="join-form">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}

      {/* 좌(2): 회원 정보 입력 · 우(1): 이용약관·개인정보 */}
      <div className="join-cols">
        <div className="join-left">
          <div className="join-fields2">
            <label className="auth-field"><span>아이디</span>
              <input name="loginId" minLength={4} maxLength={30} required placeholder="영문·숫자·_ 4자 이상" />
            </label>
            <label className="auth-field"><span>비밀번호</span>
              <input name="password" type="password" minLength={8} maxLength={72} required placeholder="8자 이상" />
            </label>
            <label className="auth-field"><span>성명 (실명 · 비공개)</span>
              <input name="name" maxLength={50} required />
            </label>
            <label className="auth-field"><span>닉네임 (게시판 표시명)</span>
              <input name="nickname" maxLength={30} required placeholder="게시판 표시명" />
            </label>
            <label className="auth-field"><span>생년월일</span>
              <input name="birthDate" type="date" required min="1900-01-01" max={new Date().toISOString().slice(0, 10)} />
            </label>
            <label className="auth-field"><span>성별</span>
              <select name="gender" defaultValue="male">
                <option value="male">남</option>
                <option value="female">여</option>
                <option value="other">기타</option>
              </select>
            </label>
          </div>

          <div className="auth-field">
            <span>휴대폰 본인인증</span>
            <div className="phone-row">
              <PhoneInput name="phone" required onChangeDigits={setPhone} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={sendCode}>인증번호 발송</button>
              {codeSent && !verified && (
                <>
                  <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="인증번호 6자리" maxLength={6} inputMode="numeric" />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={verify}>확인</button>
                </>
              )}
            </div>
            {codeSent && !verified && (
              <p className="demo-note">데모 인증번호: <b>{sentCode}</b> (실서비스에서는 문자로 발송됩니다)</p>
            )}
            {verified && <p className="verified-note">✓ 본인인증 완료</p>}
            <input type="hidden" name="phoneVerified" value={verified ? "true" : "false"} />
          </div>

          <div className="sns-row">
            <button type="button" className="sns-btn kakao" disabled>카카오로 시작 (준비 중)</button>
            <button type="button" className="sns-btn naver" disabled>네이버로 시작 (준비 중)</button>
          </div>
        </div>

        <div className="join-right">
          <AgreeScroll title="서비스 이용약관" text={terms} name="agreeTerms" checked={agreeT} onChange={setAgreeT} />
          <AgreeScroll title="개인정보 보호정책" text={privacy} name="agreePrivacy" checked={agreeP} onChange={setAgreeP} />
        </div>
      </div>

      <div className="auth-actions join-actions">
        <SubmitButton disabled={!canSubmit} />
        <Link href="/member-login" className="btn btn-ghost">로그인</Link>
        {!canSubmit && (
          <span className="demo-note" style={{ marginLeft: "6px" }}>약관 동의와 휴대폰 본인인증을 완료하면 가입 신청이 가능합니다.</span>
        )}
      </div>
    </form>
  );
}
