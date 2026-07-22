"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/content/site";
import OsmMap from "@/components/OsmMap";

// 카카오 지도. NEXT_PUBLIC_KAKAO_MAP_KEY 가 있을 때만 렌더된다(MapView 가 분기).
// 도로명 주소를 지오코딩해 마커를 찍고, 실패 시 지정 좌표로 폴백.
const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

export default function KakaoMap() {
  const ref = useRef(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!KEY || !ref.current) return;
    let cancelled = false;

    const init = () => {
      const kakao = window.kakao;
      if (!kakao || !kakao.maps) return setErr(true);
      kakao.maps.load(() => {
        if (cancelled || !ref.current) return;
        const center = new kakao.maps.LatLng(SITE.lat, SITE.lng);
        const map = new kakao.maps.Map(ref.current, { center, level: 3 });

        const place = (lat, lng) => {
          const pos = new kakao.maps.LatLng(lat, lng);
          map.setCenter(pos);
          const marker = new kakao.maps.Marker({ position: pos });
          marker.setMap(map);
          const iw = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:13px;white-space:nowrap;">${SITE.name}</div>`,
          });
          iw.open(map, marker);
        };

        if (kakao.maps.services) {
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.addressSearch(SITE.mapAddress, (res, status) => {
            if (status === kakao.maps.services.Status.OK && res[0]) {
              place(res[0].y, res[0].x);
            } else {
              place(SITE.lat, SITE.lng);
            }
          });
        } else {
          place(SITE.lat, SITE.lng);
        }
      });
    };

    if (window.kakao && window.kakao.maps) {
      init();
      return () => {
        cancelled = true;
      };
    }

    const id = "kakao-maps-sdk";
    let s = document.getElementById(id);
    if (!s) {
      s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=services`;
      document.head.appendChild(s);
    }
    s.addEventListener("load", init);
    s.addEventListener("error", () => setErr(true));

    return () => {
      cancelled = true;
    };
  }, []);

  // 카카오 로드 실패(도메인 미등록 403 등) 시 OSM 지도로 폴백 — 지도는 항상 보인다.
  if (err) return <OsmMap />;

  return (
    <div
      ref={ref}
      className="mapbox"
      style={{ padding: 0, display: "block" }}
      aria-label={`${SITE.name} 지도`}
    />
  );
}
