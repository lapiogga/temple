import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

// 이미지 업로드 저장(로컬 public/uploads). 운영자 전용 액션에서만 호출.
// S3 전환 시 이 파일만 교체하면 된다.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

// File(web) → 저장 후 공개 URL 반환. 실패 시 throw.
export async function saveImage(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new Error("이미지 파일을 선택하세요.");
  }
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("지원하지 않는 형식입니다. (jpg/png/webp/gif)");
  if (file.size > MAX_BYTES) throw new Error("이미지는 8MB 이하만 가능합니다.");

  const buf = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

// 첨부파일(이미지 + 문서). 실행 가능 형식(html/svg/js)은 허용하지 않음.
const ATTACH_EXT = [
  "jpg", "jpeg", "png", "webp", "gif",
  "pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",
];
const ATTACH_MAX_BYTES = 20 * 1024 * 1024; // 20MB

function extFromName(name) {
  const m = /\.([a-z0-9]{1,8})$/i.exec(name || "");
  const e = m ? m[1].toLowerCase() : "";
  return ATTACH_EXT.includes(e) ? e : null;
}

// File(web) → 저장 후 { url, filename, mime, size } 반환. 실패 시 throw.
export async function saveAttachment(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new Error("첨부파일을 선택하세요.");
  }
  const ext = ALLOWED[file.type] ?? extFromName(file.name);
  if (!ext) {
    throw new Error("지원하지 않는 파일 형식입니다. (이미지·pdf·hwp·doc·xls·ppt·txt)");
  }
  if (file.size > ATTACH_MAX_BYTES) {
    throw new Error("첨부파일은 20MB 이하만 가능합니다.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const stored = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, stored), buf);
  return {
    url: `/uploads/${stored}`,
    filename: (file.name || `첨부.${ext}`).slice(0, 200),
    mime: file.type || null,
    size: file.size,
  };
}

// 업로드 파일 삭제. url 은 saveImage/saveAttachment 가 돌려준 "/uploads/<name>" 형식이다.
//
// 경로를 그대로 믿지 않는다. DB 에 들어 있는 값이라 해도 ../ 가 섞이면 uploads
// 밖의 파일을 지울 수 있으므로, 파일명만 뽑아 UPLOAD_DIR 안으로 다시 붙인다.
export async function deleteUpload(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return false;
  const base = path.basename(url);
  if (!base || base === "." || base === "..") return false;
  const target = path.join(UPLOAD_DIR, base);
  // 정규화 후에도 UPLOAD_DIR 안인지 확인한다.
  if (path.dirname(path.resolve(target)) !== path.resolve(UPLOAD_DIR)) return false;
  try {
    await unlink(target);
    return true;
  } catch (err) {
    if (err?.code !== "ENOENT") console.error("업로드 파일 삭제 실패:", url, err.message);
    return false;
  }
}
