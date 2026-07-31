import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

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

// sharp 가 알아본 실제 형식 → 확장자. file.type 은 브라우저가 보낸 자기신고라
// 믿을 수 없다(확장자만 바꿔도 원하는 값이 온다). 저장할 이름은 내용으로 정한다.
const FORMAT_EXT = { jpeg: "jpg", png: "png", webp: "webp", gif: "gif" };

// 긴 변 상한.
//
// 왜 줄이는가: 종무소가 휴대폰으로 찍어 올리기 시작하면 한 장이 3~5MB · 3000~4000px 가
// 된다. 사진 2000장이면 원본만 8GB 이고, 이미지 백업은 전체 백업 순간 점유가 원본의
// 4배라 32GB 가 된다(로드맵 §3-E 디스크 상한). 화면에서 가장 크게 쓰이는 자리가
// 히어로 배경인데 그것도 1600px 이면 넉넉하다.
//
// 왜 next/image 가 아닌가: 이 저장소는 nginx 가 /uploads/ 를 디스크에서 직접 서빙한다.
// next/image 의 최적화는 Next 자신의 요청 핸들러를 거치는데, 그 핸들러는 public/ 목록을
// 기동 시 1회만 스캔해 캐시하므로 **기동 이후 올라온 파일은 404 다**(격리 빌드로 실증,
// 로드맵 §3-C 11). 즉 하필 관리자가 올린 사진에서만 깨진다. 저장 시점에 줄여 두면
// nginx 가 그 결과를 그대로 내보내므로 그 함정을 아예 타지 않는다.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 82;

// File(web) → 리사이즈·재압축 후 저장, 공개 URL 반환. 실패 시 throw.
export async function saveImage(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new Error("이미지 파일을 선택하세요.");
  }
  // 자기신고 형식으로 1차 거르기(사용자에게 빠른 안내를 주기 위한 것일 뿐이다).
  if (!ALLOWED[file.type]) throw new Error("지원하지 않는 형식입니다. (jpg/png/webp/gif)");
  if (file.size > MAX_BYTES) throw new Error("이미지는 8MB 이하만 가능합니다.");

  const buf = Buffer.from(await file.arrayBuffer());

  // 내용으로 형식을 확정한다. 여기서 걸리면 이미지가 아니다.
  let meta;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    throw new Error("이미지를 읽을 수 없습니다. 파일이 손상되지 않았는지 확인해 주세요.");
  }
  const ext = FORMAT_EXT[meta.format];
  if (!ext) throw new Error("지원하지 않는 형식입니다. (jpg/png/webp/gif)");

  const out = await shrink(buf, meta);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), out);
  return `/uploads/${name}`;
}

// 줄이고 다시 압축한다. 줄일 필요가 없거나 오히려 커지면 원본을 그대로 쓴다.
async function shrink(buf, meta) {
  // 움직이는 GIF 는 건드리지 않는다. sharp 로 다시 쓰면 기본값이 첫 프레임만 남기고,
  // animated:true 로 살려도 프레임 수·색상표에 따라 되레 커지는 경우가 흔하다.
  // 애니메이션은 사진이 아니라 이 사이트에서 큰 용량을 만드는 축이 아니다.
  if (meta.format === "gif") return buf;

  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);

  // rotate() 를 인자 없이 부르면 EXIF 방향을 실제 픽셀에 적용하고 그 태그를 지운다.
  // 휴대폰 사진이 눕는 문제가 여기서 해결되고, 덤으로 EXIF 가 통째로 빠진다 —
  // 촬영 위치(GPS)가 사진에 실려 공개되는 것을 막는다(개인정보 처리방침 §8 안전성 확보).
  let t = sharp(buf).rotate();
  if (longest > MAX_EDGE) {
    t = t.resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true });
  }

  if (meta.format === "jpeg") t = t.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  else if (meta.format === "png") t = t.png({ compressionLevel: 9 });
  else if (meta.format === "webp") t = t.webp({ quality: JPEG_QUALITY });

  let out;
  try {
    out = await t.toBuffer();
  } catch {
    // 재압축에 실패하면 원본을 저장한다. 사진을 잃는 것보다 낫다.
    return buf;
  }
  // 이미 잘 압축된 파일은 다시 쓰면 커질 수 있다. 그럴 때는 원본이 정답이다.
  return out.length < buf.length ? out : buf;
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
