import { SITE } from "@/content/site";

// OpenStreetMap 임베드(키 불필요). 카카오 키가 없거나 카카오 로드 실패 시 폴백 지도.
export default function OsmMap() {
  const { lat, lng, name } = SITE;
  const d = 0.004;
  const src =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${lng - d},${lat - d},${lng + d},${lat + d}` +
    `&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="mapbox" style={{ padding: 0, display: "block", overflow: "hidden" }}>
      <iframe
        title={`${name} 위치`}
        src={src}
        loading="lazy"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    </div>
  );
}
