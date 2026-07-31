import Link from "next/link";

// 화면 왼쪽 위 '돌아가기'. 모든 공개 화면이 같은 자리·같은 모양을 쓴다.
//
// 예전에는 화면마다 달랐다 — 목록 화면은 제목 줄 안(.sec-head)에 있어 오른쪽에
// 붙었고, 상세 화면은 제목 위에 있어 왼쪽이었으며, 아예 없는 화면도 많았다.
// 읽는 순서(위 → 아래, 왼쪽 → 오른쪽)에 맞게 제목 위 왼쪽으로 모은다.
//
// 규칙
//   목록·최상위 화면 → 홈으로
//   상세 화면        → 그 글이 속한 목록으로
export default function BackLink({ href = "/", label = "홈으로" }) {
  return (
    <Link className="back-link" href={href}>
      <span aria-hidden>←</span> {label}
    </Link>
  );
}
