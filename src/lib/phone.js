// 휴대폰 번호 표기 통일.
//
// DB 에는 숫자만 저장한다. 하이픈을 섞어 저장하면 "010-1234-5678" 과
// "01012345678" 이 서로 다른 값이 되어, 본인 확인처럼 값을 대조하는 자리에서
// 사람 눈에는 같은데 코드에는 다른 상황이 생긴다.
// 화면에 보일 때만 하이픈을 넣는다.

export function digitsOnly(v) {
  return String(v ?? "").replace(/\D/g, "");
}

// 01012345678 → 010-1234-5678 / 0101234567 → 010-123-4567
// 자리수가 안 맞으면 넣은 만큼만 끊어 준다(입력 중간 상태).
export function formatPhone(v) {
  const d = digitsOnly(v).slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// 저장 직전 검사. 010·011·016·017·018·019 로 시작하는 10~11자리만 받는다.
export function isValidPhone(v) {
  return /^01[016789]\d{7,8}$/.test(digitsOnly(v));
}
