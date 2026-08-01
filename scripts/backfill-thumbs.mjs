// 이미 올라온 이미지의 썸네일을 만들어 둔다.
//
// 썸네일은 2026-08-01 에 도입했다. 그 전에 올라온 파일은 썸네일이 없어 화면이 원본으로
// 떨어진다(lib/thumb.js). 동작에는 문제가 없지만 느린 채로 남으므로 한 번 채워 준다.
//
// 사용:  node scripts/backfill-thumbs.mjs [--dry]
//   운영에서 돌릴 때는 체크아웃 안에서 그 사용자로 실행할 것(파일 소유자가 바뀌면
//   다음 업로드가 못 쓴다).  runuser -u ubuntu -- node scripts/backfill-thumbs.mjs
//
// 이미 있는 썸네일은 건드리지 않는다. 여러 번 돌려도 안전하다.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const THUMB_DIR = path.join(UPLOAD_DIR, "thumb");
const EDGE = 480;
const QUALITY = 72;
const DRY = process.argv.includes("--dry");

if (!fs.existsSync(UPLOAD_DIR)) {
  console.error(`업로드 디렉터리가 없다: ${UPLOAD_DIR}`);
  console.error("체크아웃 안에서 실행할 것.");
  process.exit(1);
}
if (!DRY) fs.mkdirSync(THUMB_DIR, { recursive: true });

const files = fs
  .readdirSync(UPLOAD_DIR, { withFileTypes: true })
  .filter((d) => d.isFile())
  .map((d) => d.name);

let made = 0, skipped = 0, failed = 0, srcBytes = 0, thumbBytes = 0;

for (const name of files) {
  const src = path.join(UPLOAD_DIR, name);
  const dst = path.join(THUMB_DIR, name);
  if (fs.existsSync(dst)) { skipped++; continue; }

  let meta;
  try {
    meta = await sharp(src).metadata();
  } catch {
    // 이미지가 아닌 파일(첨부 pdf·hwp 등)이 같은 디렉터리에 있다. 조용히 건너뛴다.
    skipped++;
    continue;
  }

  if (DRY) { made++; continue; }
  try {
    let t = sharp(src).rotate().resize(EDGE, EDGE, { fit: "inside", withoutEnlargement: true });
    if (meta.format === "jpeg") t = t.jpeg({ quality: QUALITY, mozjpeg: true });
    else if (meta.format === "png") t = t.png({ compressionLevel: 9, palette: true });
    else if (meta.format === "webp") t = t.webp({ quality: QUALITY });
    const buf = await t.toBuffer();
    fs.writeFileSync(dst, buf);
    made++;
    srcBytes += fs.statSync(src).size;
    thumbBytes += buf.length;
  } catch (err) {
    console.error(`  실패: ${name} — ${err.message}`);
    failed++;
  }
}

console.log(`${DRY ? "[모의] " : ""}대상 ${files.length}개 · 생성 ${made} · 건너뜀 ${skipped} · 실패 ${failed}`);
if (made && !DRY) {
  console.log(
    `원본 ${(srcBytes / 1048576).toFixed(1)}MB → 썸네일 ${(thumbBytes / 1048576).toFixed(1)}MB ` +
      `(${Math.round((1 - thumbBytes / srcBytes) * 100)}% 감소)`
  );
}
