import BackLink from "@/components/BackLink";

// 화면 머리 — 제목 줄 하나로 끝낸다.
//
// 예전에는 세 줄이었다.
//     ← 홈으로
//     NOTICE
//     공지사항
// 영문 키커와 돌아가기가 각각 한 줄씩 차지해 본문이 그만큼 아래로 밀렸고,
// 목록이 길어지면 페이지를 넘길 때마다 그 세 줄을 다시 지나쳐야 했다.
// 이제 영문명은 한글 제목 옆 괄호로 붙이고, 돌아가기는 같은 줄 오른쪽에 둔다.
//
//   props
//     title  한글 제목
//     ki     영문명. 괄호는 여기서 붙이므로 "Notice" 처럼 알맹이만 넘긴다.
//     back   { href, label } — 없으면 돌아가기를 그리지 않는다(본문 안 소제목).
//     children  오른쪽에 함께 놓을 것(글쓰기 버튼 등). 돌아가기 왼쪽에 온다.
export default function PageHead({ title, ki, back, className = "", children }) {
  const hasAside = !!(children || back);
  return (
    <div className={`sec-head${className ? ` ${className}` : ""}`}>
      <h2>
        {title}
        {ki ? <span className="ki">({ki})</span> : null}
      </h2>
      {hasAside && (
        <div className="sec-head-aside">
          {children}
          {back ? <BackLink href={back.href} label={back.label} /> : null}
        </div>
      )}
    </div>
  );
}
