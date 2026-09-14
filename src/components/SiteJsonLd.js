import { SITE } from "@/content/site";

// 구조화 데이터(JSON-LD) — 검색엔진에 "이 사이트는 서울 종로구 부암동에 있는 절이다"
// 를 기계가 읽는 형태로 알린다.
//
// '응선사' 는 흔한 말이 아니라 이름만으로도 걸릴 수 있지만, '부암동 응선사'·'서울
// 응선사' 처럼 **지역 + 이름** 으로 찾는 경우가 문제다. 본문 글자만으로는 검색엔진이
// 그 지역과 이 절을 묶지 못한다. 주소를 이렇게 명시하면 지역 질의에 연결된다.
//
// 확정된 사실만 넣는다(site.js 머리말과 같은 원칙).
//  · 좌표(lat/lng)는 넣지 않았다 — site.js 에 '부암동 백석동길 일대 폴백 중심' 이라고
//    적힌 근사값이다. 구조화 데이터의 좌표는 지도에 핀으로 찍히므로 근사값을 올리면
//    엉뚱한 자리를 가리킨다. 실측 좌표를 확인하면 geo 를 추가하는 편이 지역 검색에 낫다.
//  · 전화·이메일·배례 시간도 site.js 에서 아직 null 이라 뺐다.
export default function SiteJsonLd() {
  const temple = {
    "@context": "https://schema.org",
    "@type": "BuddhistTemple",
    "@id": `${SITE.url}/#temple`,
    name: SITE.name,
    alternateName: [SITE.hanja, `${SITE.regionLabel} ${SITE.name}`],
    url: SITE.url,
    description:
      "서울 종로구 부암동 백사실 계곡 곁의 도심 속 산사. 대한불교조계종 사찰로, 대웅전에 서울특별시 문화재자료 제14호 산신도를 모시고 있습니다.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "백석동길 227",
      addressLocality: "종로구",
      addressRegion: "서울특별시",
      addressCountry: "KR",
    },
    ...(SITE.youtubeUrl ? { sameAs: [SITE.youtubeUrl] } : {}),
  };

  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: `${SITE.name}(${SITE.hanja})`,
    inLanguage: "ko-KR",
    publisher: { "@id": `${SITE.url}/#temple` },
  };

  // dangerouslySetInnerHTML 로 넣는 이유: JSX 로 넣으면 React 가 따옴표를 HTML
  // 엔티티로 바꿔 JSON 이 깨진다. 값은 전부 이 저장소 안의 상수라 외부 입력이 없다.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([temple, site]) }}
    />
  );
}
