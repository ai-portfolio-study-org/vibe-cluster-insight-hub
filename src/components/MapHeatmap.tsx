import { useEffect, useRef, useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MapHeatmapProps {
  data: Array<{
    region: string;
    lat: number;
    lng: number;
    score: number;
  }>;
  onRegionClick?: (region: string) => void;
  selectedIndustry?: string;
}

interface CargoStation {
  name: string;
  lat: number;
  lng: number;
  type: "시멘트" | "컨테이너" | "석탄" | "철강" | "유류" | "광석";
}

interface RouteData {
  path: [number, number][];
  distance?: number;
  duration?: number;
  isDetailed: boolean;
  total_distance?: number;
  total_duration?: number;
  estimated_arrival_time?: string;
  fuel_cost?: number;
  toll_fee?: number;
  total_cost?: number;
  traffic_level?: string;
  congested_areas?: string[];
  traffic_conditions?: {
    average_speed?: number;
    main_roads?: string[];
    expected_delay?: number;
  };
  route_summary?: string;
  waypoints?: Array<{
    name: string;
    lat: number;
    lng: number;
    type: "start" | "via" | "end";
  }>;
  route_details?: Record<string, unknown>;
}

interface RouteOption {
  id: string;
  name: string;
  start: [number, number];
  goal: [number, number];
  vias: [number, number][];
  description: string;
  category: "container" | "cement" | "steel";
}

// Polyline에 routeId 속성을 추가하는 인터페이스
interface RoutePolyline extends naver.maps.Polyline {
  routeId?: string;
}

// 경로 옵션들 정의 (카테고리별로 분류)
const routeOptions: RouteOption[] = [
  // 컨테이너 수송 경로
  {
    id: "route1",
    name: "경로 1",
    start: [37.324, 126.823],
    goal: [35.073, 128.819],
    vias: [[36.329, 127.427]],
    description: "오봉 ICD → 대전 → 부산 신항",
    category: "container",
  },
  {
    id: "route2",
    name: "경로 2",
    start: [37.34, 126.92],
    goal: [35.073, 128.819],
    vias: [],
    description: "오봉 ICD → 부산 신항",
    category: "container",
  },
  {
    id: "route3",
    name: "경로 3",
    start: [35.99, 126.705],
    goal: [35.073, 128.819],
    vias: [[36.329, 127.427]],
    description: "군산항 → 대전 → 부산 신항",
    category: "container",
  },
  // 시멘트 수송 경로
  {
    id: "route4",
    name: "경로 4",
    start: [37.435, 129.166],
    goal: [37.582, 126.894],
    vias: [[37.136, 128.198]],
    description: "삼척 → 제천 → 수색",
    category: "cement",
  },
  {
    id: "route5",
    name: "경로 5",
    start: [36.986, 128.36],
    goal: [37.582, 126.894],
    vias: [],
    description: "단양 → 수색",
    category: "cement",
  },
  {
    id: "route6",
    name: "경로 6",
    start: [37.524, 129.114],
    goal: [37.582, 126.894],
    vias: [[37.136, 128.198]],
    description: "동해 → 제천 → 수도권",
    category: "cement",
  },
  // 철강 수송 경로
  {
    id: "route7",
    name: "경로 7",
    start: [34.938, 127.751],
    goal: [37.484, 126.64],
    vias: [[36.911, 126.785]],
    description: "광양제철소 → 당진 → 인천",
    category: "steel",
  },
  {
    id: "route8",
    name: "경로 8",
    start: [36.032, 129.377],
    goal: [37.484, 126.64],
    vias: [],
    description: "포항 → 인천",
    category: "steel",
  },
  {
    id: "route9",
    name: "경로 9",
    start: [35.499, 129.382],
    goal: [35.984, 126.707],
    vias: [],
    description: "울산 → 군산",
    category: "steel",
  },
];

// 업종별 경로 카테고리 매핑
const routeCategories = {
  container: routeOptions.filter((route) => route.category === "container"),
  cement: routeOptions.filter((route) => route.category === "cement"),
  steel: routeOptions.filter((route) => route.category === "steel"),
};

// 경로 포인트 샘플링 함수 (10분의 1로 줄이기)
function samplePath(
  points: [number, number][],
  sampleRate: number = 10
): [number, number][] {
  if (points.length <= 2) return points;

  const sampledPoints: [number, number][] = [];

  // 시작점은 항상 포함
  sampledPoints.push(points[0]);

  // 중간 포인트들을 sampleRate 간격으로 샘플링
  for (let i = sampleRate; i < points.length - sampleRate; i += sampleRate) {
    sampledPoints.push(points[i]);
  }

  // 끝점은 항상 포함
  sampledPoints.push(points[points.length - 1]);

  console.log(
    `경로 샘플링: ${points.length}개 → ${sampledPoints.length}개 포인트`
  );
  return sampledPoints;
}

// 새로운 API 엔드포인트로 경로 데이터 가져오기
async function fetchRouteFromAPI(
  routeOption: RouteOption,
  cache: { [key: string]: RouteData },
  useDetailedAPI: boolean = false
) {
  // 상세 API 호출이 필요한 경우에만 실제 API 호출
  if (useDetailedAPI) {
    // 캐시에 상세 데이터가 있으면 사용
    if (cache[routeOption.id] && cache[routeOption.id].isDetailed) {
      console.log(`캐시된 상세 데이터 사용: ${routeOption.id}`);
      return cache[routeOption.id];
    }

    try {
      console.log(`상세 API 호출: ${routeOption.id}`);
      const response = await fetch("http://localhost:8000/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: routeOption.start,
          goal: routeOption.goal,
          vias: routeOption.vias,
        }),
      });

      if (!response.ok) {
        throw new Error("API 호출 실패");
      }

      const apiResponse = await response.json();
      console.log(`API 응답 구조 확인:`, apiResponse);

      // API 응답 구조에 따라 경로 데이터 추출
      let routeData: RouteData;

      if (
        apiResponse.route &&
        apiResponse.route.trafast &&
        apiResponse.route.trafast[0]
      ) {
        // 네이버 지도 API 응답 구조 (trafast 사용)
        const rawPath = apiResponse.route.trafast[0].path.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );

        // 경로 샘플링 적용 (10분의 1로 줄이기)
        const sampledPath = samplePath(rawPath, 10);

        // 새로운 API 응답 정보들 추출
        routeData = {
          path: sampledPath,
          isDetailed: true,
          total_distance: apiResponse.total_distance,
          total_duration: apiResponse.total_duration,
          estimated_arrival_time: apiResponse.estimated_arrival_time,
          fuel_cost: apiResponse.fuel_cost,
          toll_fee: apiResponse.toll_fee,
          total_cost: apiResponse.total_cost,
          traffic_level: apiResponse.traffic_level,
          congested_areas: apiResponse.congested_areas,
          traffic_conditions: apiResponse.traffic_conditions,
          route_summary: apiResponse.route_summary,
          waypoints: apiResponse.waypoints,
          route_details: apiResponse.route_details,
        };
      } else if (
        apiResponse.route &&
        apiResponse.route.traoptimal &&
        apiResponse.route.traoptimal[0]
      ) {
        // 네이버 지도 API 응답 구조 (traoptimal 사용)
        const rawPath = apiResponse.route.traoptimal[0].path.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );

        // 경로 샘플링 적용
        const sampledPath = samplePath(rawPath, 10);

        routeData = {
          path: sampledPath,
          isDetailed: true,
          total_distance: apiResponse.total_distance,
          total_duration: apiResponse.total_duration,
          estimated_arrival_time: apiResponse.estimated_arrival_time,
          fuel_cost: apiResponse.fuel_cost,
          toll_fee: apiResponse.toll_fee,
          total_cost: apiResponse.total_cost,
          traffic_level: apiResponse.traffic_level,
          congested_areas: apiResponse.congested_areas,
          traffic_conditions: apiResponse.traffic_conditions,
          route_summary: apiResponse.route_summary,
          waypoints: apiResponse.waypoints,
          route_details: apiResponse.route_details,
        };
      } else if (apiResponse.path) {
        // 직접 path가 있는 경우
        const sampledPath = samplePath(apiResponse.path, 10);
        routeData = {
          path: sampledPath,
          isDetailed: true,
          total_distance: apiResponse.total_distance,
          total_duration: apiResponse.total_duration,
          estimated_arrival_time: apiResponse.estimated_arrival_time,
          fuel_cost: apiResponse.fuel_cost,
          toll_fee: apiResponse.toll_fee,
          total_cost: apiResponse.total_cost,
          traffic_level: apiResponse.traffic_level,
          congested_areas: apiResponse.congested_areas,
          traffic_conditions: apiResponse.traffic_conditions,
          route_summary: apiResponse.route_summary,
          waypoints: apiResponse.waypoints,
          route_details: apiResponse.route_details,
        };
      } else {
        // 기본 mock 데이터 사용
        console.warn(
          `경로 데이터를 찾을 수 없어 mock 데이터 사용: ${routeOption.id}`
        );
        routeData = {
          path: [routeOption.start, ...routeOption.vias, routeOption.goal] as [
            number,
            number
          ][],
          isDetailed: true,
        };
      }

      console.log(`추출된 상세 경로 데이터:`, routeData);
      return routeData;
    } catch (error) {
      console.error("경로 데이터 가져오기 실패:", error);
      // 에러 시 mock 데이터 사용
      const mockRouteData: RouteData = {
        path: [routeOption.start, ...routeOption.vias, routeOption.goal] as [
          number,
          number
        ][],
        isDetailed: true,
      };
      return mockRouteData;
    }
  } else {
    // 초기 표시용 mock 데이터 (3개 포인트)
    console.log(`Mock 데이터 사용: ${routeOption.id}`);
    const mockRouteData: RouteData = {
      path: [routeOption.start, ...routeOption.vias, routeOption.goal] as [
        number,
        number
      ][],
      isDetailed: false,
    };
    return mockRouteData;
  }
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

// 새로운 API 데이터로 경로 그리기
function drawRouteFromAPI(
  map: naver.maps.Map,
  routeData: RouteData,
  color: string,
  routeOption?: RouteOption,
  onRouteClick?: (route: RouteOption, data: RouteData) => void
): RoutePolyline | null {
  if (!routeData?.path) {
    console.error("경로 데이터가 없습니다:", routeData);
    return null;
  }

  console.log(
    `경로 그리기 시작: ${routeOption?.id}, 포인트 수: ${routeData.path.length}`
  );

  const coords = routeData.path.map(
    ([lat, lng]) => new window.naver.maps.LatLng(lat, lng)
  );

  console.log(`좌표 변환 완료: ${coords.length}개 포인트`);

  // 경로 포인트에 마커 추가 (시작점, 끝점, 경유점만)
  if (routeOption) {
    // 시작점 마커
    const startCoord = routeData.path[0];
    const startPosition = new window.naver.maps.LatLng(
      startCoord[0],
      startCoord[1]
    );
    new window.naver.maps.Marker({
      position: startPosition,
      map,
      title: "시작",
      icon: {
        content: `<div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #4CAF50;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        size: new window.naver.maps.Size(12, 12),
        anchor: new window.naver.maps.Point(6, 6),
      },
    });

    // 경유점 마커들
    if (routeOption.vias && routeOption.vias.length > 0) {
      routeOption.vias.forEach((via, index) => {
        const viaPosition = new window.naver.maps.LatLng(via[0], via[1]);
        new window.naver.maps.Marker({
          position: viaPosition,
          map,
          title: `경유${index + 1}`,
          icon: {
            content: `<div style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background-color: #FF9800;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            size: new window.naver.maps.Size(12, 12),
            anchor: new window.naver.maps.Point(6, 6),
          },
        });
      });
    }

    // 끝점 마커
    const endCoord = routeData.path[routeData.path.length - 1];
    const endPosition = new window.naver.maps.LatLng(endCoord[0], endCoord[1]);
    new window.naver.maps.Marker({
      position: endPosition,
      map,
      title: "도착",
      icon: {
        content: `<div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #F44336;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        size: new window.naver.maps.Size(12, 12),
        anchor: new window.naver.maps.Point(6, 6),
      },
    });
  }

  const polyline = new window.naver.maps.Polyline({
    map,
    path: coords,
    strokeColor: color,
    strokeOpacity: 0.8,
    strokeWeight: 4,
    strokeStyle: "solid",
    clickable: true, // 클릭 가능하도록 설정
  });

  console.log(`경로 그리기 완료: ${routeOption?.id}, 색상: ${color}`);

  // 경로에 고유 식별자 추가
  if (routeOption) {
    (polyline as RoutePolyline).routeId = routeOption.id;
  }

  // 경로 클릭 이벤트 추가
  if (routeOption && onRouteClick) {
    window.naver.maps.Event.addListener(polyline, "click", () => {
      onRouteClick(routeOption, routeData);
    });
  }

  return polyline as RoutePolyline;
}

const MapHeatmap = ({
  data,
  onRegionClick,
  selectedIndustry,
}: MapHeatmapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routePolylines, setRoutePolylines] = useState<RoutePolyline[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(
    routeOptions[0]
  );
  const [selectedCategory, setSelectedCategory] = useState<
    "container" | "cement" | "steel" | null
  >(null);
  const [clickedRouteData, setClickedRouteData] = useState<{
    route: RouteOption;
    data: RouteData;
  } | null>(null);
  const [currentRedRouteId, setCurrentRedRouteId] = useState<string | null>(
    null
  );
  const [routeDataCache, setRouteDataCache] = useState<{
    [key: string]: RouteData;
  }>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

    // selectedIndustry가 있으면 자동으로 경로 표시
    if (selectedIndustry) {
      const industryToCategory: {
        [key: string]: "container" | "cement" | "steel";
      } = {
        biotech: "container",
        it: "container",
        semiconductor: "container",
        automotive: "steel",
        machinery: "steel",
        steel: "steel",
        cement: "cement",
      };

      const category = industryToCategory[selectedIndustry];
      if (category) {
        setSelectedCategory(category);
        // 지도 초기화 완료 후 경로 표시
        setTimeout(() => {
          handleShowCategoryRoutes(category);
        }, 1000);
      }
    }
  }, [data, onRegionClick, selectedIndustry]);

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

  // 경로 클릭 핸들러
  const handleRouteClick = async (route: RouteOption, routeData: RouteData) => {
    if (!mapInstance.current) return;

    setIsLoadingRoute(true);

    try {
      // 기존의 모든 빨간색 경로 제거 (하나만 유지하기 위해)
      const redPolylines = routePolylines.filter(
        (polyline) => polyline.getOptions().strokeColor === "#FF6B6B"
      );
      redPolylines.forEach((polyline) => polyline.setMap(null));

      // 전체 경로가 없다면 먼저 표시
      const categoryPolylines = routePolylines.filter(
        (polyline) => polyline.getOptions().strokeColor === "#9CA3AF"
      );

      if (categoryPolylines.length === 0) {
        await handleShowCategoryRoutes(route.category);
      }

      // 클릭된 경로의 상세 데이터 가져오기
      const detailedRouteData = await fetchRouteFromAPI(
        route,
        routeDataCache,
        true
      ); // 상세 API 사용

      // 클릭된 경로 데이터 상태 업데이트
      setClickedRouteData({
        route: route,
        data: detailedRouteData,
      });

      // 빨간색으로 강조된 경로 그리기
      const result = drawRouteFromAPI(
        mapInstance.current,
        detailedRouteData,
        "#FF6B6B",
        route,
        handleRouteClick
      ); // 빨간색, 클릭 가능

      if (result) {
        setRoutePolylines((prev) => [...prev, result]);
        // 현재 빨간색 경로 ID 업데이트
        setCurrentRedRouteId(route.id);
      }

      // 경로의 경계를 계산하여 지도 뷰 조정
      if (detailedRouteData.path && detailedRouteData.path.length > 0) {
        console.log("경로가 성공적으로 그려졌습니다:", detailedRouteData.path);
      }
    } catch (error) {
      console.error("경로 표시 실패:", error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // 카테고리별 모든 경로 표시 (회색으로 기본 표시)
  const handleShowCategoryRoutes = async (
    category: "container" | "cement" | "steel"
  ) => {
    if (!mapInstance.current) return;

    setIsLoadingRoute(true);

    try {
      // 기존 경로들을 지도에서 제거
      routePolylines.forEach((polyline) => {
        console.log("기존 경로 제거");
        polyline.setMap(null);
      });

      // 상태 초기화
      setRoutePolylines([]);
      setClickedRouteData(null); // 클릭된 경로 데이터 초기화
      setCurrentRedRouteId(null); // 현재 빨간색 경로 ID 초기화

      const categoryRoutes = routeCategories[category];
      const newPolylines: RoutePolyline[] = [];
      const newCache: { [key: string]: RouteData } = {};

      // 카테고리의 모든 경로를 순차적으로 표시 (회색)
      for (const route of categoryRoutes) {
        const routeData = await fetchRouteFromAPI(route, routeDataCache, false); // Mock 데이터 사용

        // 캐시에 저장
        newCache[route.id] = routeData;

        const result = drawRouteFromAPI(
          mapInstance.current,
          routeData,
          "#9CA3AF",
          route,
          handleRouteClick
        ); // 회색, 클릭 가능
        if (result) {
          newPolylines.push(result);
        }
      }

      // 경로 상태 업데이트
      setRoutePolylines(newPolylines);

      // 초기 로드가 완료되면 캐시 상태 업데이트
      if (isInitialLoad) {
        setRouteDataCache(newCache);
        setIsInitialLoad(false);
      }

      console.log(
        `${category} 카테고리 경로 ${newPolylines.length}개 표시 완료`
      );
    } catch (error) {
      console.error("경로 표시 실패:", error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // 단일 경로 표시 (기존 함수)
  const handleShowRoute = async () => {
    if (!mapInstance.current) return;

    setIsLoadingRoute(true);

    try {
      // 기존의 모든 빨간색 경로 제거 (하나만 유지하기 위해)
      const redPolylines = routePolylines.filter(
        (polyline) => polyline.getOptions().strokeColor === "#FF6B6B"
      );
      redPolylines.forEach((polyline) => polyline.setMap(null));

      // 전체 경로가 없다면 먼저 표시
      const categoryPolylines = routePolylines.filter(
        (polyline) => polyline.getOptions().strokeColor === "#9CA3AF"
      );

      if (categoryPolylines.length === 0) {
        await handleShowCategoryRoutes(selectedRoute.category);
      }

      // 선택된 경로의 상세 데이터 가져오기
      const detailedRouteData = await fetchRouteFromAPI(
        selectedRoute,
        routeDataCache,
        true
      ); // 상세 API 사용

      // 선택된 경로 데이터 상태 업데이트
      setClickedRouteData({
        route: selectedRoute,
        data: detailedRouteData,
      });

      const result = drawRouteFromAPI(
        mapInstance.current,
        detailedRouteData,
        "#FF6B6B",
        selectedRoute,
        handleRouteClick
      ); // 빨간색, 클릭 가능

      if (result) {
        setRoutePolylines((prev) => [...prev, result]);
        // 현재 빨간색 경로 ID 업데이트
        setCurrentRedRouteId(selectedRoute.id);
      }

      // 경로의 경계를 계산하여 지도 뷰 조정
      if (detailedRouteData.path && detailedRouteData.path.length > 0) {
        console.log("경로가 성공적으로 그려졌습니다:", detailedRouteData.path);
      }
    } catch (error) {
      console.error("경로 표시 실패:", error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            지역별 성장 전망 지도
            {selectedIndustry &&
              (selectedIndustry.includes("컨테이너") ||
                selectedIndustry.includes("물류") ||
                selectedIndustry.includes("시멘트") ||
                selectedIndustry.includes("건설") ||
                selectedIndustry.includes("철강") ||
                selectedIndustry.includes("제철")) && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-800 hover:bg-green-200"
                >
                  {selectedIndustry.includes("컨테이너") ||
                  selectedIndustry.includes("물류")
                    ? "컨테이너 수송 경로"
                    : selectedIndustry.includes("시멘트") ||
                      selectedIndustry.includes("건설")
                    ? "시멘트 수송 경로"
                    : selectedIndustry.includes("철강") ||
                      selectedIndustry.includes("제철")
                    ? "철강 수송 경로"
                    : "수송 경로"}
                  표시
                </Badge>
              )}
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={selectedRoute.id}
              onValueChange={(value) => {
                const route = routeOptions.find((r) => r.id === value);
                if (route) setSelectedRoute(route);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="경로 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="container"
                  disabled
                  className="font-semibold text-gray-500"
                >
                  🚢 컨테이너 수송 경로
                </SelectItem>
                {routeCategories.container.map((route) => (
                  <SelectItem key={route.id} value={route.id} className="ml-4">
                    {route.description}
                  </SelectItem>
                ))}
                <SelectItem
                  value="cement"
                  disabled
                  className="font-semibold text-gray-500"
                >
                  🧱 시멘트 수송 경로
                </SelectItem>
                {routeCategories.cement.map((route) => (
                  <SelectItem key={route.id} value={route.id} className="ml-4">
                    {route.description}
                  </SelectItem>
                ))}
                <SelectItem
                  value="steel"
                  disabled
                  className="font-semibold text-gray-500"
                >
                  🏗️ 철강 수송 경로
                </SelectItem>
                {routeCategories.steel.map((route) => (
                  <SelectItem key={route.id} value={route.id} className="ml-4">
                    {route.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleShowRoute}
              disabled={isLoadingRoute}
              className="flex items-center space-x-2"
              size="sm"
            >
              <Route className="w-4 h-4" />
              <span>{isLoadingRoute ? "경로 계산 중..." : "경로 강조"}</span>
            </Button>
            <Button
              onClick={() => handleShowCategoryRoutes(selectedRoute.category)}
              disabled={isLoadingRoute}
              className="flex items-center space-x-2"
              size="sm"
              variant="outline"
            >
              <Route className="w-4 h-4" />
              <span>
                {isLoadingRoute ? "경로 계산 중..." : "전체 경로 표시"}
              </span>
            </Button>
          </div>
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

          {/* 컨테이너 수송 경로 안내 */}
          {selectedIndustry &&
            (selectedIndustry.includes("컨테이너") ||
              selectedIndustry.includes("물류") ||
              selectedIndustry.includes("시멘트") ||
              selectedIndustry.includes("건설") ||
              selectedIndustry.includes("철강") ||
              selectedIndustry.includes("제철")) &&
            routePolylines.length === 0 && (
              <div className="absolute top-4 left-4 bg-blue-50 p-3 rounded-lg shadow-lg max-w-xs border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 text-blue-800">
                  📍 수송 경로 안내
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  {selectedIndustry.includes("컨테이너") ||
                  selectedIndustry.includes("물류")
                    ? "컨테이너 수송 경로"
                    : selectedIndustry.includes("시멘트") ||
                      selectedIndustry.includes("건설")
                    ? "시멘트 수송 경로"
                    : selectedIndustry.includes("철강") ||
                      selectedIndustry.includes("제철")
                    ? "철강 수송 경로"
                    : "수송 경로"}
                  를 자동으로 표시합니다.
                </p>
                <div className="text-xs text-blue-600">
                  <div>• 시작점: 초록색 마커</div>
                  <div>• 경유점: 주황색 마커</div>
                  <div>• 도착점: 빨간색 마커</div>
                </div>
              </div>
            )}

          {/* 경로 정보 표시 */}
          {routePolylines.length > 0 && (
            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
              <h4 className="font-semibold text-sm mb-2">
                {routePolylines.length > 1 ? "표시된 경로들" : "현재 경로"}
              </h4>
              {routePolylines.length === 1 ? (
                <>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {selectedRoute.category === "container" && "🚢 컨테이너"}
                      {selectedRoute.category === "cement" && "🧱 시멘트"}
                      {selectedRoute.category === "steel" && "🏗️ 철강"}
                    </span>
                    <span className="text-xs text-gray-600">
                      {selectedRoute.description}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>
                        시작: [{selectedRoute.start[0].toFixed(3)},{" "}
                        {selectedRoute.start[1].toFixed(3)}]
                      </span>
                    </div>
                    {selectedRoute.vias.map((via, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>
                          경유{index + 1}: [{via[0].toFixed(3)},{" "}
                          {via[1].toFixed(3)}]
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>
                        도착: [{selectedRoute.goal[0].toFixed(3)},{" "}
                        {selectedRoute.goal[1].toFixed(3)}]
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {selectedRoute.category === "container" && "🚢 컨테이너"}
                      {selectedRoute.category === "cement" && "🧱 시멘트"}
                      {selectedRoute.category === "steel" && "🏗️ 철강"}
                    </span>
                    <span className="text-xs text-gray-600">
                      {routePolylines.length}개 경로 표시
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedRoute.category === "container" &&
                      "오봉 ICD, 군산항 등 주요 컨테이너 수송 경로"}
                    {selectedRoute.category === "cement" &&
                      "삼척, 단양, 동해 등 시멘트 수송 경로"}
                    {selectedRoute.category === "steel" &&
                      "광양제철소, 포항, 울산 등 철강 수송 경로"}
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    경로를 클릭하면 해당 경로만 빨간색으로 강조됩니다.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 클릭된 경로 API 결과 표시 */}
          {clickedRouteData && (
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-sm border border-green-200 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-sm mb-2 text-green-800">
                📍 상세 경로 정보
              </h4>
              <div className="space-y-3 text-xs">
                {/* 기본 경로 정보 */}
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-medium text-blue-800 mb-1">
                    기본 정보
                  </div>
                  <div className="space-y-1 text-blue-700">
                    <div>경로: {clickedRouteData.route.description}</div>
                    {clickedRouteData.data.total_distance && (
                      <div>
                        총 거리:{" "}
                        {(clickedRouteData.data.total_distance / 1000).toFixed(
                          1
                        )}
                        km
                      </div>
                    )}
                    {clickedRouteData.data.total_duration && (
                      <div>
                        총 소요시간:{" "}
                        {Math.floor(clickedRouteData.data.total_duration / 60)}
                        분
                      </div>
                    )}
                    {clickedRouteData.data.estimated_arrival_time && (
                      <div>
                        예상 도착:{" "}
                        {clickedRouteData.data.estimated_arrival_time}
                      </div>
                    )}
                    {clickedRouteData.data.route_summary && (
                      <div>요약: {clickedRouteData.data.route_summary}</div>
                    )}
                  </div>
                </div>

                {/* 비용 정보 */}
                {(clickedRouteData.data.fuel_cost ||
                  clickedRouteData.data.toll_fee ||
                  clickedRouteData.data.total_cost) && (
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-medium text-green-800 mb-1">
                      비용 정보
                    </div>
                    <div className="space-y-1 text-green-700">
                      {clickedRouteData.data.fuel_cost && (
                        <div>
                          연료비:{" "}
                          {clickedRouteData.data.fuel_cost.toLocaleString()}원
                        </div>
                      )}
                      {clickedRouteData.data.toll_fee && (
                        <div>
                          통행료:{" "}
                          {clickedRouteData.data.toll_fee.toLocaleString()}원
                        </div>
                      )}
                      {clickedRouteData.data.total_cost && (
                        <div className="font-semibold">
                          총 비용:{" "}
                          {clickedRouteData.data.total_cost.toLocaleString()}원
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 교통 정보 */}
                {(clickedRouteData.data.traffic_level ||
                  clickedRouteData.data.congested_areas ||
                  clickedRouteData.data.traffic_conditions) && (
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="font-medium text-yellow-800 mb-1">
                      교통 정보
                    </div>
                    <div className="space-y-1 text-yellow-700">
                      {clickedRouteData.data.traffic_level && (
                        <div className="flex items-center">
                          <span>교통 상황: </span>
                          <span
                            className={`ml-1 px-1 rounded text-xs ${
                              clickedRouteData.data.traffic_level === "원활"
                                ? "bg-green-200 text-green-800"
                                : clickedRouteData.data.traffic_level === "보통"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-red-200 text-red-800"
                            }`}
                          >
                            {clickedRouteData.data.traffic_level}
                          </span>
                        </div>
                      )}
                      {clickedRouteData.data.traffic_conditions
                        ?.average_speed && (
                        <div>
                          평균 속도:{" "}
                          {
                            clickedRouteData.data.traffic_conditions
                              .average_speed
                          }
                          km/h
                        </div>
                      )}
                      {clickedRouteData.data.traffic_conditions
                        ?.expected_delay && (
                        <div>
                          예상 지연:{" "}
                          {
                            clickedRouteData.data.traffic_conditions
                              .expected_delay
                          }
                          분
                        </div>
                      )}
                      {clickedRouteData.data.congested_areas &&
                        clickedRouteData.data.congested_areas.length > 0 && (
                          <div>
                            <div>혼잡 구간:</div>
                            <ul className="ml-2 list-disc">
                              {clickedRouteData.data.congested_areas.map(
                                (area, index) => (
                                  <li key={index}>{area}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* 경유지 정보 */}
                {clickedRouteData.data.waypoints &&
                  clickedRouteData.data.waypoints.length > 0 && (
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="font-medium text-purple-800 mb-1">
                        경유지
                      </div>
                      <div className="space-y-1 text-purple-700">
                        {clickedRouteData.data.waypoints.map(
                          (waypoint, index) => (
                            <div key={index} className="flex items-center">
                              <span
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  waypoint.type === "start"
                                    ? "bg-green-500"
                                    : waypoint.type === "via"
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                                }`}
                              ></span>
                              <span>
                                {waypoint.name ||
                                  `${waypoint.type} (${waypoint.lat.toFixed(
                                    3
                                  )}, ${waypoint.lng.toFixed(3)})`}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* 경로 포인트 수 */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-800 mb-1">
                    기술 정보
                  </div>
                  <div className="text-gray-700">
                    경로 포인트 수: {clickedRouteData.data.path?.length || 0}개
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedCategory) {
                      handleShowCategoryRoutes(selectedCategory);
                    }
                  }}
                  className="w-full mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  전체 경로 다시 표시
                </button>
              </div>
            </div>
          )}
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
