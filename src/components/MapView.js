import KakaoMap from "@/components/KakaoMap";
import OsmMap from "@/components/OsmMap";

// 오시는 길 지도. 카카오 키가 있으면 카카오 지도(실패 시 OSM 폴백), 없으면 OSM.
const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

export default function MapView() {
  if (KEY) return <KakaoMap />;
  return <OsmMap />;
}
