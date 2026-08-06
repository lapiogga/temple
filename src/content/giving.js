// 디지털 시주(간편송금) 창구 목록.
//
// 이름표와 순서를 여기 한 곳에서 정한다 — 관리자 화면의 입력란과 공개 화면의 카드가
// 같은 목록을 보고 그리므로, 창구를 늘리거나 이름을 고칠 때 이 배열만 만지면 된다.
// 주소(값)는 관리자가 넣는다. 비어 있는 창구는 공개 화면에 나오지 않는다.
//
// lib/site-content.js 가 아니라 여기 있는 이유: 저쪽은 lib/db 를 불러오는 서버 전용
// 모듈이라 "use client" 인 관리자 폼에서 가져다 쓸 수 없다.
//
// placeholder 는 관리자가 어떤 주소를 붙여 넣어야 하는지 알아보라고 두는 예시다.
// 실제로 넣을 주소는 각 앱이 발급해 주는 것을 그대로 붙이면 된다.
export const GIVING_PROVIDERS = [
  { key: "kakaopay", label: "카카오페이", placeholder: "https://qr.kakaopay.com/…" },
  { key: "toss", label: "토스", placeholder: "https://toss.me/…" },
  { key: "naverpay", label: "네이버페이", placeholder: "https://…" },
];
