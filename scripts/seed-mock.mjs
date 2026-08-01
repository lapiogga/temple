// 개발용 mock 데이터. 쪽 넘김(Pager)을 실제 분량으로 확인하려고 만든다.
//
// 실행:  npm run db:mock          — 넣는다(이미 있으면 지우고 다시 넣는다)
//        npm run db:mock -- --clean   — 전부 지운다
//        npm run db:mock -- --count   — 지금 몇 건 있는지만 본다
//
// ── 두 가지 안전장치 ──────────────────────────────────────────────
//
// 1) 운영 DB 에는 붙지 않는다. DATABASE_URL 의 데이터베이스 이름이 _dev 로 끝나지
//    않으면 그냥 멈춘다. 2026-08-01 에 개발 데이터를 통째로 운영에 옮긴 적이 있어서
//    (pg_dump → psql) 이 스크립트가 운영에 닿을 여지를 아예 없애 둔다.
//
// 2) mock 행은 id 900000 이상에만 넣는다. 지울 때 'id >= 900000' 한 줄이면 되고,
//    무엇이 mock 인지 눈으로도 구분된다. 시퀀스를 건드리지 않으므로 진짜 글은
//    원래 번호를 이어서 쓴다(nextval 이 900000 으로 튀지 않는다).
//
//    ※ 그래도 개발 데이터를 운영으로 옮길 일이 생기면 --clean 을 먼저 돌릴 것.
//      pg_dump 는 이 행들도 같이 담는다.
//
// 사진은 새로 만들지 않고 public/uploads 에 이미 있는 파일을 돌려 쓴다. 썸네일이
// 이미 있는 파일이라 썸네일 경로까지 그대로 시험된다.
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

// 비밀글 mock 의 비밀번호. 시험하는 사람이 실제로 열어 볼 수 있어야 하므로
// 가짜 문자열이 아니라 진짜 해시를 넣는다.
const SECRET_CODE = "1234";
const BASE = 900000; // mock 행의 id 시작점

const argv = process.argv.slice(2);
const CLEAN_ONLY = argv.includes("--clean");
const COUNT_ONLY = argv.includes("--count");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL 환경변수가 없습니다. (.env 확인)");
  process.exit(1);
}

// ── 안전장치 1 ──
const dbName = decodeURIComponent(
  (process.env.DATABASE_URL.match(/\/([^/?]+)(\?|$)/) || [])[1] || ""
);
if (!dbName.endsWith("_dev")) {
  console.error(`거부: 데이터베이스 이름이 '${dbName}' 이다. 개발(_dev) 이 아니면 돌리지 않는다.`);
  console.error("mock 데이터는 개발에서만 쓴다.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── 재현 가능한 난수 ──
// Math.random 을 쓰면 돌릴 때마다 내용이 달라져 "아까 그 화면" 을 다시 못 본다.
let seed = 20260801;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// ── 문구 재료 ──
const 계절 = ["새해", "정월", "봄", "초여름", "한여름", "가을", "늦가을", "초겨울", "동지"];
const 법회 = [
  "지장재일", "관음재일", "초하루 법회", "보름 법회", "약사재일",
  "우란분절", "부처님오신날", "성도재일", "열반재일", "출가재일",
];
const 행사 = [
  "산문 울력", "김장 울력", "다도 모임", "사경 모임", "108배 정진",
  "템플스테이", "어린이 여름 불교학교", "합창단 연습", "차담회", "발우공양 체험",
];
const 안내류 = [
  "주차 안내", "산문 출입 시간 조정", "공양간 이용 안내", "요사채 보수 공사",
  "진입로 포장 공사", "겨울철 결빙 주의", "태풍 대비 안내", "종무소 휴무",
  "후원 계좌 변경", "홈페이지 점검",
];
const 소회 = [
  "다녀와서", "처음 참여했습니다", "올해도 무사히", "함께해 주셔서 고맙습니다",
  "짧은 기록", "사진 몇 장 올립니다", "다음에도 뵙겠습니다",
];
const 문의류 = [
  "템플스테이 예약", "49재 문의", "천도재 절차", "위패 봉안", "불공 접수",
  "주차 가능 여부", "대중교통 오는 길", "봉사활동 참여", "후원 방법",
  "단체 방문", "사시불공 시간", "유아 동반", "휠체어 접근", "숙박 가능 여부",
];
const 닉 = [
  "연화행", "무애심", "보리수", "청산", "달빛보살", "돌담길", "산아래",
  "하심", "정진행", "솔바람", "구름길", "여여행", "물소리", "빈손",
];
const 성 = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오"];
const 이름 = ["보경", "지원", "현우", "수민", "다연", "정호", "은서", "태윤", "미경", "상현"];

const 본문조각 = [
  "이번 법회는 대웅전에서 오전 10시에 시작합니다.",
  "공양은 법회가 끝난 뒤 공양간에서 함께합니다.",
  "주차 공간이 넉넉하지 않으니 되도록 함께 오시기 바랍니다.",
  "산길이 미끄러울 수 있으니 편한 신발을 신고 오십시오.",
  "자세한 사항은 종무소로 문의해 주시기 바랍니다.",
  "많은 분들이 함께해 주셔서 무사히 회향하였습니다.",
  "우천 시에는 실내에서 진행합니다.",
  "준비물은 따로 없으며 마음만 가지고 오시면 됩니다.",
  "참가 인원이 정해져 있어 미리 접수해 주셔야 합니다.",
  "공사 기간 동안 소음이 있을 수 있는 점 널리 양해 부탁드립니다.",
];
const body = (n = 3) =>
  Array.from({ length: n }, () => pick(본문조각)).join(" ") + "\n\n" + pick(본문조각);

// ── 날짜: 2024-08 부터 2026-07 까지 고르게 흩는다 ──
const D0 = Date.UTC(2024, 7, 1);
const D1 = Date.UTC(2026, 6, 31);
const dateAt = (i, total) => {
  // 최신이 위에 오도록 i 가 클수록 과거로. 같은 날 여러 건이 나오도록 시각도 흩는다.
  const t = D1 - ((D1 - D0) * i) / total - int(0, 36) * 3600 * 1000;
  return new Date(t).toISOString();
};

// ── 재사용할 업로드 이미지 ──
const UP = path.join(process.cwd(), "public", "uploads");
const images = fs.existsSync(UP)
  ? fs
      .readdirSync(UP, { withFileTypes: true })
      .filter((d) => d.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(d.name))
      .map((d) => `/uploads/${d.name}`)
      .sort()
  : [];

const TABLES = [
  "post_images",
  "gallery_photos",
  "gallery_albums",
  "posts",
  "questions",
  "notices",
]; // 지우는 순서 = FK 역순

async function counts(client) {
  const out = [];
  for (const t of TABLES) {
    const { rows } = await client.query(`SELECT count(*)::int c FROM ${t} WHERE id >= $1`, [BASE]);
    out.push([t, rows[0].c]);
  }
  return out;
}

async function clean(client) {
  for (const t of TABLES) {
    await client.query(`DELETE FROM ${t} WHERE id >= $1`, [BASE]);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    if (COUNT_ONLY) {
      console.log(`DB: ${dbName}`);
      for (const [t, c] of await counts(client)) console.log(`  ${t.padEnd(16)} ${c}건`);
      return;
    }

    await client.query("BEGIN");
    await clean(client);

    if (CLEAN_ONLY) {
      await client.query("COMMIT");
      console.log(`mock 데이터를 지웠다. (DB: ${dbName})`);
      return;
    }

    if (images.length === 0) {
      throw new Error("public/uploads 에 이미지가 없다. 사진 mock 을 만들 수 없다.");
    }

    // 회원 글의 작성자는 실제로 있는 승인 회원이어야 한다. 없는 id 를 박아 두면
    // 마이페이지·닉네임 변경 같은 흐름을 시험할 때 엉뚱한 결과가 나온다.
    const { rows: mrows } = await client.query(
      `SELECT id, nickname FROM members WHERE status = 'approved' ORDER BY id LIMIT 1`
    );
    const MEMBER = mrows[0] ?? null;

    const secretHash = await bcrypt.hash(SECRET_CODE, 10);

    // ── 공지 200건 (12/쪽 → 17쪽) ──
    const N = 200;
    for (let i = 0; i < N; i++) {
      const kind = rnd();
      const title =
        kind < 0.45
          ? `${pick(계절)} ${pick(법회)} 봉행 안내`
          : kind < 0.75
            ? `${pick(행사)} 참가 안내`
            : `[안내] ${pick(안내류)}`;
      await client.query(
        `INSERT INTO notices (id, category, title, body, cover_url, is_pinned, visibility, published, published_at, created_at, updated_at)
         VALUES ($1,'notice',$2,$3,$4,$5,$6,true,$7,$7,$7)`,
        [
          BASE + i,
          `${title} (mock ${i + 1})`,
          body(4),
          rnd() < 0.25 ? pick(images) : null,
          i < 3, // 위쪽 3건만 상단 고정 — 고정글이 쪽마다 반복되는지 볼 수 있다
          // 공지의 visibility 는 1차에서 'public' 고정이다
          // (admin/notices/actions.js:81 — 관리자 화면에 고르는 자리가 없다).
          // 회원전용 공지를 만들면 화면으로는 절대 못 만드는 상태를 시험하게 된다.
          "public",
          dateAt(i, N),
        ]
      );
    }

    // ── 게시글 200건 (12/쪽 → 17쪽) ──
    // 분류별로도 쪽이 넘어가도록 자유게시판에 절반을 몰아 준다.
    const boards = [
      ["free", 100],
      ["story", 40],
      ["tower", 25],
      ["teaching", 20],
      ["pagoda", 8],
      ["hyusim-jirisan", 7],
    ];
    let pi = 0;
    let imgId = BASE;
    for (const [board, n] of boards) {
      for (let k = 0; k < n; k++) {
        const id = BASE + pi;
        const admin = board === "teaching" || board === "pagoda" || board === "hyusim-jirisan";
        // 회원이 쓴 글이면 표시명은 반드시 그 회원의 닉네임이어야 한다.
        // 둘을 따로 뽑으면 author_member_id 와 author_name 이 어긋난 행이 생기는데,
        // 그런 상태는 화면으로는 만들 수 없다(닉네임을 바꾸면 지난 글까지 함께 바뀐다).
        const byMember = !admin && MEMBER != null && rnd() < 0.3;
        await client.query(
          `INSERT INTO posts (id, board, title, body, author_member_id, author_name, published, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,true,$7,$7)`,
          [
            id,
            board,
            `${pick(board === "story" ? 소회 : 행사)} ${pick(계절)} 이야기 (mock ${pi + 1})`,
            body(5),
            byMember ? MEMBER.id : null,
            admin ? "관리자" : byMember ? MEMBER.nickname : pick(닉),
            dateAt(pi, 200),
          ]
        );
        // 카드형(pagoda·hyusim-jirisan)은 사진이 반드시 있어야 목록에 그림이 나온다.
        const shots = admin ? int(1, 3) : rnd() < 0.35 ? int(1, 2) : 0;
        for (let s = 0; s < shots; s++) {
          await client.query(
            `INSERT INTO post_images (id, post_id, url, sort_order) VALUES ($1,$2,$3,$4)`,
            [imgId++, id, images[(pi * 3 + s) % images.length], s]
          );
        }
        pi++;
      }
    }

    // ── 문의 200건 (12/쪽 → 17쪽) ──
    for (let i = 0; i < N; i++) {
      const secret = rnd() < 0.35;
      const answered = rnd() < 0.55;
      const at = dateAt(i, N);
      await client.query(
        `INSERT INTO questions (id, title, body, author_name, phone, is_secret, secret_hash, answer, answered_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          BASE + i,
          `${pick(문의류)} 문의드립니다 (mock ${i + 1})`,
          body(2),
          `${pick(성)}${pick(이름)}`,
          `010${int(1000, 9999)}${int(1000, 9999)}`,
          secret,
          secret ? secretHash : null,
          answered ? `문의 주셔서 고맙습니다. ${pick(본문조각)}` : null,
          answered ? at : null,
          at,
        ]
      );
    }

    // ── 갤러리 앨범 60개 (6/쪽 → 10쪽) ──
    // 공개 앨범은 사진이 1장 이상이어야 목록에 나온다(lib/gallery.js 의 HAVING).
    const A = 60;
    let photoId = BASE;
    for (let i = 0; i < A; i++) {
      const id = BASE + i;
      const vis = i % 4 === 3 ? "member" : "public";
      // 첫 앨범 하나는 200장짜리로 만든다 — 앨범 상세 쪽 넘김(24/쪽 → 9쪽) 시험용.
      const big = i === 0;
      await client.query(
        `INSERT INTO gallery_albums (id, title, visibility, created_at) VALUES ($1,$2,$3,$4)`,
        [
          id,
          big
            ? "쪽 넘김 시험용 앨범 (사진 200장 · mock)"
            : `${pick(계절)} ${pick(rnd() < 0.5 ? 법회 : 행사)} (mock ${i + 1})`,
          vis,
          dateAt(i, A),
        ]
      );
      const n = big ? 200 : int(1, 14);
      for (let s = 0; s < n; s++) {
        await client.query(
          `INSERT INTO gallery_photos (id, album_id, image_url, caption, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            photoId++,
            id,
            images[(i * 7 + s) % images.length],
            // 업로드된 사진이 111장뿐이라 200장짜리 앨범은 같은 그림이 돌아온다.
            // 그림만 보면 쪽이 넘어갔는지 알 수 없으므로 번호를 붙여 준다
            // (24장씩이므로 1쪽은 1–24, 2쪽은 25–48 …).
            big ? `${s + 1}번째 사진` : rnd() < 0.4 ? `${pick(계절)} 풍경 ${s + 1}` : null,
            s,
          ]
        );
      }
    }

    await client.query("COMMIT");

    console.log(`mock 데이터를 넣었다. (DB: ${dbName}, id ${BASE} 이상)`);
    for (const [t, c] of await counts(client)) console.log(`  ${t.padEnd(16)} ${c}건`);
    console.log("\n지울 때:  npm run db:mock -- --clean");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("실패:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
