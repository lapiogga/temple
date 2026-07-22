"use client";

import Link from "next/link";
import { useState } from "react";

const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/;

export default function FindAccountForm({ initialTab }) {
  const [tab, setTab] = useState(initialTab === "pw" ? "pw" : "id");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sentCode, setSentCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verified, setVerified] = useState(false);

  const reset = () => {
    setCodeSent(false);
    setSentCode("");
    setCodeInput("");
    setVerified(false);
  };
  const switchTab = (t) => { setTab(t); reset(); };

  const sendCode = () => {
    if (!name.trim()) { alert("성명을 입력하세요."); return; }
    if (!PHONE_RE.test(phone)) { alert("휴대폰 번호를 정확히 입력하세요."); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentCode(code); setCodeSent(true); setVerified(false); setCodeInput("");
  };
  const verify = () => {
    if (sentCode && codeInput.trim() === sentCode) setVerified(true);
    else alert("인증번호가 일치하지 않습니다.");
  };

  return (
    <div className="auth-card">
      <div className="find-tabs">
        <button type="button" className={`find-tab${tab === "id" ? " on" : ""}`} onClick={() => switchTab("id")}>
          아이디 찾기
        </button>
        <button type="button" className={`find-tab${tab === "pw" ? " on" : ""}`} onClick={() => switchTab("pw")}>
          비밀번호 찾기
        </button>
      </div>

      <p className="find-desc">
        {tab === "id"
          ? "가입 시 등록한 성명과 휴대폰으로 본인인증하면 아이디를 안내해 드립니다."
          : "가입 시 등록한 성명과 휴대폰으로 본인인증하면 비밀번호 재설정을 안내해 드립니다."}
      </p>

      {!verified ? (
        <>
          <label className="auth-field">
            <span>성명</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="가입 시 등록한 성명" />
          </label>
          <div className="auth-field">
            <span>휴대폰 본인인증</span>
            <div className="phone-row">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" maxLength={13} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={sendCode}>인증번호 발송</button>
            </div>
            {codeSent && (
              <>
                <div className="phone-row" style={{ marginTop: "8px" }}>
                  <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="인증번호 6자리" maxLength={6} inputMode="numeric" />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={verify}>확인</button>
                </div>
                <p className="demo-note">데모 인증번호: <b>{sentCode}</b> (실서비스에서는 문자로 발송됩니다)</p>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="find-result">
          <p className="verified-note">✓ 본인인증 완료</p>
          {tab === "id" ? (
            <p className="demo-note">
              회원님의 <b>아이디</b>는 등록된 휴대폰(문자)으로 안내됩니다.<br />
              리뷰 초안 단계에서는 문자 발송이 연동되지 않았습니다.
            </p>
          ) : (
            <p className="demo-note">
              <b>비밀번호 재설정</b> 링크가 등록된 휴대폰(문자)으로 발송됩니다.<br />
              리뷰 초안 단계에서는 문자 발송이 연동되지 않았습니다.
            </p>
          )}
        </div>
      )}

      <div className="auth-actions" style={{ marginTop: "18px" }}>
        <Link href="/member-login" className="btn btn-ghost">로그인으로</Link>
      </div>
    </div>
  );
}
