import fs from "node:fs";
import path from "node:path";

// 화면에서 "이 이미지의 썸네일 주소"를 얻는 곳.
//
// 업로드 시점에 /uploads/thumb/<같은이름> 을 만든다(lib/upload.js). 다만 세 경우에
// 썸네일이 없을 수 있다.
//   · 썸네일 도입(2026-08-01) 이전에 올라온 파일 — 백필 전
//   · 썸네일 생성이 실패한 경우(업로드는 막지 않는다)
//   · 외부 https 주소를 그대로 적은 소식 대표 이미지
// 그래서 파일이 실제로 있을 때만 썸네일을 주고, 없으면 원본으로 떨어진다.
// 없는 주소를 내보내면 화면에 깨진 이미지가 뜨는데, 느린 것보다 나쁘다.
//
// 존재 확인은 로컬 디스크 stat 한 번이라 서버 렌더에서 부담이 되지 않는다.
const PUBLIC_DIR = path.join(process.cwd(), "public");

export function thumbSrc(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return url;
  const base = path.basename(url);
  if (!base || base === "." || base === "..") return url;
  const rel = `/uploads/thumb/${base}`;
  try {
    return fs.existsSync(path.join(PUBLIC_DIR, "uploads", "thumb", base)) ? rel : url;
  } catch {
    return url;
  }
}
