import qrcode from "qrcode-generator";

// 링크 하나를 QR 격자로 바꾼다.
//
// 반환은 <svg> 문자열이 아니라 좌표(path 의 d)다. 라이브러리에 createSvgTag 가 있지만
// 그것을 쓰면 만들어진 마크업을 dangerouslySetInnerHTML 로 심어야 한다 — 색을 토큰으로
// 주지도 못하고(fill 이 문자열에 박혀 나온다) 위험한 통로를 하나 더 여는 셈이다.
// 좌표만 넘기고 그리는 것은 호출 쪽 JSX 가 한다.
//
// 오류정정 M(15%) 은 인쇄물 없이 화면으로만 보여 줄 때의 통상값이다. 더 올리면 같은
// 주소라도 격자가 촘촘해져 작은 화면에서 되레 안 읽힌다.
//
// 여백(quiet zone)은 규격이 요구하는 4모듈을 그대로 둔다. 좁히면 QR 이 커 보이지만
// 스캐너가 격자의 경계를 못 찾는다 — 화면에서 아껴 봐야 몇 px 이라 줄일 이유가 없다.
const MARGIN = 4;

export function qrPath(text) {
  const q = qrcode(0, "M"); // 0 = 자료 길이에 맞춰 형식 자동 선택
  q.addData(text);
  q.make();

  const n = q.getModuleCount();
  // 어두운 칸마다 1×1 사각형을 이어 붙인 하나의 path. 칸마다 <rect> 를 두면 요소가
  // 수백 개가 되는데, 한 path 로 묶으면 DOM 은 하나이고 결과는 같다.
  let d = "";
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (q.isDark(r, c)) d += `M${c + MARGIN},${r + MARGIN}h1v1h-1z`;
    }
  }
  return { size: n + MARGIN * 2, d };
}
