import { query } from "@/lib/db";
import { GREETING, HISTORY, SANSINDO } from "@/content/about";
import { SITE } from "@/content/site";

// 홈페이지 편집 콘텐츠 — DB(site_content) 값 우선, 없으면 아래 코드 기본값 폴백.
export const CONTENT_DEFAULTS = {
  hero: {
    eyebrow: "백사실 계곡 곁, 도심 속 산사",
    title: "응선사 (應禪寺)",
    lede: "부암동 백사실 계곡 곁 도심 속 산사. 대웅전에는 서울특별시 문화재자료 제14호 「대웅전 산신도」를 모십니다.",
    images: [
      "/uploads/hall-left.jpg",
      "/uploads/entrance-1.jpg",
      "/uploads/corridor-1.jpg",
      "/uploads/samjonbul.jpg",
      "/uploads/hall-right.jpg",
    ],
  },
  greeting: {
    isDraft: GREETING.isDraft,
    paragraphs: GREETING.paragraphs,
    sign: GREETING.sign,
  },
  history: HISTORY, // [{ yr, title, desc }]
  sansindo: {
    heritage: SANSINDO.heritage,
    year: SANSINDO.year,
    summary: SANSINDO.summary,
    detail: SANSINDO.detail ?? [],
  },
  visit: {
    addressFull: SITE.addressFull,
    transit: SITE.transit,
    parking: SITE.parking,
    mapUrl: SITE.mapUrl,
    donation: SITE.donation, // { bank, account, holder } | null
  },
};

export const CONTENT_SECTIONS = [
  { key: "hero", label: "초기화면 히어로" },
  { key: "greeting", label: "주지스님 인삿말" },
  { key: "history", label: "연혁" },
  { key: "sansindo", label: "대웅전 산신도" },
  { key: "visit", label: "오시는 길" },
];

// 섹션 조회: DB 값 있으면 반환, 없거나 오류면 기본값.
export async function getSection(key) {
  try {
    const { rows } = await query("SELECT value FROM site_content WHERE key = $1", [key]);
    if (rows[0]) return rows[0].value;
  } catch (err) {
    console.error("getSection 실패:", key, err.message);
  }
  return CONTENT_DEFAULTS[key];
}

// 섹션 저장(upsert).
export async function setSection(key, value) {
  await query(
    `INSERT INTO site_content (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}
