import { useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface MapHeatmapProps {
  data: Array<{
    region: string;
    lat: number;
    lng: number;
    score: number;
  }>;
  onRegionClick?: (region: string) => void;
}

interface CargoStation {
  name: string;
  lat: number;
  lng: number;
  type: "시멘트" | "컨테이너" | "석탄" | "철강" | "유류" | "광석";
}

const DIRECTIONS_BASE =
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving";

async function fetchRoute({
  start,
  goal,
  vias = [],
}: {
  start: [number, number];
  goal: [number, number];
  vias?: [number, number][];
}) {
  const coords = [
    `start=${start[1]},${start[0]}`,
    ...vias.map((v, i) => `via=${v[1]},${v[0]}`),
    `goal=${goal[1]},${goal[0]}`,
  ].join("&");
  const url = `${DIRECTIONS_BASE}/15?${coords}&option=trafast`; // 최대 15 via
  const res = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": import.meta.env.VITE_NAVER_MAP_API_KEY_ID,
      "X-NCP-APIGW-API-KEY": import.meta.env.VITE_NAVER_CLIENT_SECRET,
    },
  });
  return res.json();
}

function drawRoute(map, routeJson) {
  const coords = routeJson.route.traoptimal[0].path.map(
    ([lng, lat]) => new window.naver.maps.LatLng(lat, lng)
  );
  return new window.naver.maps.Polyline({
    map,
    path: coords,
    strokeColor: "#10B981",
    strokeOpacity: 0.7,
    strokeWeight: 5,
  });
}
const MapHeatmap = ({ data, onRegionClick }: MapHeatmapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.naver?.maps) return;

    const center = new window.naver.maps.LatLng(36.6351, 127.4914);
    const map = new window.naver.maps.Map(mapRef.current, {
      center,
      zoom: 8,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    const getColorByCargoType = (type: string) => {
      switch (type) {
        case "시멘트":
          return "#6B7280"; // 회색
        case "컨테이너":
          return "#3B82F6"; // 파랑
        case "석탄":
          return "#1F2937"; // 진회색
        case "철강":
          return "#EF4444"; // 빨강
        case "유류":
          return "#F59E0B"; // 주황
        case "광석":
          return "#10B981"; // 초록
        default:
          return "#9CA3AF";
      }
    };

    const polyline = new window.naver.maps.Polyline({
      map: map,
      path: [
        new naver.maps.LatLng(37.365620929135716, 127.1036195755005),
        new naver.maps.LatLng(37.365620929135716, 127.11353302001953),
        new naver.maps.LatLng(37.3606921307849, 127.10452079772949),
        new naver.maps.LatLng(37.36821310838941, 127.10814714431763),
        new naver.maps.LatLng(37.360760351656545, 127.11299657821654),
        new naver.maps.LatLng(37.365620929135716, 127.1036195755005),
      ],
      clickable: true, // 사용자 인터랙션을 받기 위해 clickable을 true로 설정합니다.
      strokeColor: "#5347AA",
      strokeStyle: "longdash",
      strokeOpacity: 0.8,
      strokeWeight: 5,
    });

    map.fitBounds(polyline.getBounds());

    mapInstance.current = map;
    const cargoStations: CargoStation[] = [
      { name: "도담", lat: 36.988, lng: 128.417, type: "시멘트" },
      { name: "입석리", lat: 37.125, lng: 128.5, type: "시멘트" },
      { name: "쌍용", lat: 37.185, lng: 128.345, type: "시멘트" },
      { name: "삼화", lat: 37.549, lng: 129.108, type: "시멘트" },
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
      { name: "부산신항", lat: 35.073, lng: 128.819, type: "컨테이너" },
      // ...
    ];

    const hubs = [
      { region: "부산항", lat: 35.1, lng: 129.1, label: "부산항" },
      { region: "광양항", lat: 34.9, lng: 127.7, label: "광양항" },
      { region: "포항", lat: 36.0, lng: 129.4, label: "포항" },
    ];

    hubs.forEach((hub) => {
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(hub.lat, hub.lng),
        map: map,
        title: hub.label,
        icon: {
          content: `<div style="background:#000;color:#fff;padding:4px 8px;border-radius:6px;">${hub.label}</div>`,
          size: new window.naver.maps.Size(12, 12),
          anchor: new window.naver.maps.Point(12, 12),
        },
      });
    });

    // 히트맵 마커 생성
    data.forEach((item) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(item.lat, item.lng),
        map,
        icon: {
          content: `<div class="heatmap-marker" style="
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: ${getColorByScore(item.score)};
            opacity: 0.7;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
          "></div>`,
          size: new window.naver.maps.Size(20, 20),
          anchor: new window.naver.maps.Point(10, 10),
        },
      });

      cargoStations.forEach((station) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(station.lat, station.lng),
          map: map,
          title: `${station.name} (${station.type})`,
          icon: {
            content: `<div style="
        padding: 4px 6px;
        background: ${getColorByCargoType(station.type)};
        color: white;
        font-size: 12px;
        border-radius: 4px;
        font-weight: bold;">
        ${station.name}
      </div>`,
            anchor: new window.naver.maps.Point(10, 10),
            size: new window.naver.maps.Size(20, 20),
          },
        });
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        onRegionClick?.(item.region);
      });

      markersRef.current.push(marker);
    });

    // 역지오코딩 API - JS SDK 공식 방식
    window.naver.maps.Event.addListener(
      map,
      "click",
      (e: naver.maps.PointerEvent) => {
        const latlng = e.coord;
        window.naver.maps.Service.reverseGeocode(
          {
            coords: latlng,
            orders: `${window.naver.maps.Service.OrderType.LEGAL_CODE},${window.naver.maps.Service.OrderType.ADDR}`,
          },
          (status, response) => {
            if (status !== window.naver.maps.Service.Status.OK) return;
            const result = response.v2.results[0];
            if (result) {
              const sido = result.region.area1.name;
              const sigungu = result.region.area2.name;
              const region = `${sido} ${sigungu}`;
              onRegionClick?.(region);
            }
          }
        );
      }
    );
  }, [data, onRegionClick]);

  useEffect(() => {
    if (!mapRef.current) return;

    const script = document.createElement("script");
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${
      import.meta.env.VITE_NAVER_MAP_API_KEY_ID
    }&submodules=geocoder,drawing`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      initializeMap();
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initializeMap]);

  const getColorByScore = (score: number) => {
    if (score >= 8.0) return "#ef4444";
    if (score >= 6.0) return "#eab308";
    return "#3b82f6";
  };

  return (
    <Card>
      <button
        onClick={async () => {
          const routeData = await fetchRoute({
            start: [37.324, 126.823], // 오봉
            vias: [[35.073, 128.819]], // 부산신항
            goal: [36.988, 128.417], // 도담 (예시)
          });
          console.log("Route data", routeData);
          drawRoute(mapInstance.current, routeData);
        }}
      >
        경로보기
      </button>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          지역별 성장 전망 지도
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div ref={mapRef} className="w-full h-[500px] rounded-lg" />
          <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2 text-sm">
              <Legend color="red-500" label="고성장 (8.0+)" />
              <Legend color="yellow-500" label="안정성장 (6.0~7.9)" />
              <Legend color="blue-500" label="성장필요 (~5.9)" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center space-x-1">
    <div className={`w-3 h-3 bg-${color} rounded`} />
    <span>{label}</span>
  </div>
);

export default MapHeatmap;
