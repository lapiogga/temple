// 응선사(應禪寺) 사이트 콘텐츠 — 확정 사실만 기입.
// 미확정 항목은 null → 화면에서 '준비 중'으로 처리(가짜 정보 노출 금지).
// 출처·근거: docs/05_응선사_콘텐츠_자료.md (국가유산포털·위키백과 등)

export const SITE = {
  name: "응선사",
  hanja: "應禪寺",
  order: "대한불교조계종",
  abbot: "수암스님",
  regionLabel: "서울 부암동",
  addressFull: "서울특별시 종로구 백석동길 227 (부암동)",
  // 지도: 외부 지도 검색으로 대체(카카오맵 SDK 임베드는 8월 1차)
  mapUrl:
    "https://map.naver.com/p/search/" +
    encodeURIComponent("응선사 서울 종로구 백석동길 227"),
  mapAddress: "서울 종로구 백석동길 227", // 카카오 지오코딩용 도로명
  lat: 37.5976, // 부암동 백석동길 일대(폴백 지도 중심)
  lng: 126.9662,
  youtubeUrl: "https://youtube.com/channel/UCR_Iq4KsFmcL8Vv-booJhSA",
  youtubeName: "살며 생각하며, 응선사",

  // 미확정(준비 중) — 확정 값을 채우면 화면에 자동 노출된다.
  phone: null,
  email: null,
  transit: null, // 대중교통 안내
  parking: null, // 주차 안내
  donation: null, // { bank, account, holder }
};

// 가람 중창기(연대기) — 확정 사실 기반. 상세 창건 연혁은 준비 중.
export const HISTORY = [
  {
    yr: "1914 · 산신도 조성",
    title: "대웅전 산신도 조성",
    desc: "「응선사 대웅전 산신도」가 조성되었습니다(원 안양암 봉안). 뒷날 응선사로 옮겨 모셨으며, 2003년 서울특별시 문화재자료 제14호로 지정되었습니다.",
  },
  {
    yr: "근·현대 · 가람 정비",
    title: "대웅전과 도량 정비",
    desc: "현재의 대웅전을 비롯한 가람을 오늘의 모습으로 정비하였습니다. 대웅전에는 지장·석가·관음 삼존불을 모셨습니다.",
  },
  {
    yr: "오늘 · 도심 속 산사",
    title: "백사실 계곡 곁의 도량",
    desc: "부암동 백사실 계곡 가까이에서 도심 속 산사의 고요를 이어갑니다.",
  },
];
