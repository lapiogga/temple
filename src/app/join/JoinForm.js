"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import PhoneInput from "@/components/PhoneInput";
import { isValidPhone } from "@/lib/phone";
import { checkAvailabilityAction } from "./check-actions";

// 아이디·닉네임 중복 확인 칸.
//
// 예전에는 다 채워 제출한 뒤에야 "이미 쓰이는 아이디" 를 알았다. 되돌아와 다시 채우는
// 것이 사용자 몫이었다. 옆에서 미리 확인하게 한다.
//
// 확인한 뒤에 값을 고치면 결과를 지운다 — "확인됨" 표시를 켜 둔 채 다른 값을 넣으면
// 확인하지 않은 값이 확인된 것처럼 보인다.
function CheckField({ kind, name, label, hint, children, ...inputProps }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    try {
      setResult(await checkAvailabilityAction(kind, value));
    } catch {
      setResult({ ok: false, message: "확인 중 오류가 발생했습니다." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-field">
      <span>{label}</span>
      <div className="check-row">
        <input
          name={name}
          value={value}
          onChange={(e) => { setValue(e.target.value); setResult(null); }}
          {...inputProps}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={check} disabled={busy || !value.trim()}>
          {busy ? "확인 중…" : "중복 확인"}
        </button>
      </div>
      {hint && <em className="check-hint">{hint}</em>}
      {result && (
        <p className={result.ok ? "check-ok" : "check-no"} role="status">
          {result.ok ? "✓ " : "✗ "}{result.message}
        </p>
      )}
      {children}
    </div>
  );
}

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
            <CheckField
              kind="loginId"
              name="loginId"
              label="아이디"
              minLength={4}
              maxLength={30}
              required
              placeholder="영문·숫자·_ 4자 이상"
            />
            <label className="auth-field"><span>비밀번호</span>
              <input name="password" type="password" minLength={8} maxLength={72} required placeholder="8자 이상" />
            </label>
            <label className="auth-field"><span>성명 (실명 · 비공개)</span>
              <input name="name" maxLength={50} required />
            </label>
            <CheckField
              kind="nickname"
              name="nickname"
              label="닉네임 (게시판 표시명)"
              hint="법명(法名)을 쓰셔도 됩니다. 실명은 공개되지 않습니다."
              maxLength={30}
              required
              placeholder="게시판 표시명"
            />
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
