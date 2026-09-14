import { SITE } from "@/content/site";
import { listNotices } from "@/lib/notices";
import { listAlbums } from "@/lib/gallery";
import { listAllEvents } from "@/lib/events";

// sitemap.xml — 검색엔진에 "이 사이트에 어떤 주소가 있는지" 를 한 번에 알린다.
//
// 네이버·구글 모두 사이트맵을 제출하면 첫 수집이 빨라진다. 특히 새 도메인은 링크가
// 걸린 곳이 없어 로봇이 스스로 찾아오지 못한다 — 사이트맵이 사실상 유일한 입구다.
//
// DB 를 읽으므로 매 요청 새로 만든다. 정적 생성으로 두면 공지를 올려도 사이트맵에는
// 며칠 뒤에야 나타난다(빌드 시점에 박힌다).
export const dynamic = "force-dynamic";

// 로그인해야 보이는 화면과 개인 화면은 넣지 않는다(robots.js 의 disallow 와 같은 기준).
// 게시판·Q&A 도 뺀다 — 회원이 쓴 글이라 검색결과에 실명·연락처가 실릴 수 있다.
const STATIC = [
  ["", 1.0, "daily"],
  ["/about/greeting", 0.8, "monthly"],
  ["/about/history", 0.7, "yearly"],
  ["/about/sansindo", 0.8, "yearly"],
  ["/about/pagoda", 0.6, "yearly"],
  ["/about/teaching", 0.6, "yearly"],
  ["/about/guide", 0.6, "monthly"],
  ["/about/hyusim-jirisan", 0.5, "yearly"],
  ["/events", 0.9, "weekly"],
  ["/notices", 0.9, "daily"],
  ["/gallery", 0.7, "weekly"],
  ["/visit", 0.8, "monthly"],
  ["/privacy", 0.2, "yearly"],
  ["/terms", 0.2, "yearly"],
  ["/email-policy", 0.2, "yearly"],
];

// 조회가 실패해도 사이트맵 전체가 500 이 되면 안 된다. 정적 주소만이라도 나가야
// 첫 수집이 걸린다 — 사이트맵이 통째로 죽으면 로봇은 재시도까지 한참을 기다린다.
async function safe(fn, label) {
  try {
    return await fn();
  } catch (err) {
    console.error(`사이트맵 ${label} 조회 실패:`, err);
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();
  const urls = STATIC.map(([path, priority, changeFrequency]) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const [notices, albums, events] = await Promise.all([
    safe(() => listNotices(), "공지"),
    // 회원 전용 앨범은 로봇이 못 보므로 넣지 않는다(publicOnly).
    safe(() => listAlbums({ publicOnly: true }), "갤러리"),
    safe(() => listAllEvents(), "법회·행사"),
  ]);

  notices.forEach((n) => {
    urls.push({
      url: `${SITE.url}/notices/${n.id}`,
      lastModified: n.published_at ? new Date(n.published_at) : now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });
  albums.forEach((a) => {
    urls.push({
      url: `${SITE.url}/gallery/${a.id}`,
      lastModified: a.created_at ? new Date(a.created_at) : now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  });
  events.forEach((e) => {
    urls.push({
      url: `${SITE.url}/events/${e.id}`,
      lastModified: e.created_at ? new Date(e.created_at) : now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  });

  return urls;
}
