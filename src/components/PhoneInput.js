"use client";

import { useState } from "react";
import { digitsOnly, formatPhone } from "@/lib/phone";

// 하이픈이 자동으로 붙는 휴대폰 입력. 사용자가 '-' 를 직접 넣을 수 없다.
// 화면에는 010-1234-5678 로 보이지만, 폼으로 전송되는 값은 숫자만이다
// (보이는 칸과 별개로 같은 이름의 hidden 을 둔다).
export default function PhoneInput({
  name = "phone",
  defaultValue = "",
  required = false,
  id,
  className,
  onChangeDigits,
}) {
  const [digits, setDigits] = useState(digitsOnly(defaultValue));

  function handle(e) {
    // 무엇을 붙여 넣든 숫자만 남긴다. '-' 를 눌러도 반영되지 않는다.
    const d = digitsOnly(e.target.value).slice(0, 11);
    setDigits(d);
    onChangeDigits?.(d);
  }

  return (
    <>
      <input
        id={id}
        className={className}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={formatPhone(digits)}
        onChange={handle}
        placeholder="010-1234-5678"
        maxLength={13}
        required={required}
        aria-describedby={id ? `${id}-hint` : undefined}
      />
      {/* 서버로는 숫자만 보낸다. DB 에도 숫자만 들어간다. */}
      <input type="hidden" name={name} value={digits} />
    </>
  );
}
