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
  type:
    | "시멘트"
    | "컨테이너"
    | "석탄"
    | "철강"
    | "유류"
    | "광석"
    | "공항"
    | "항만"
    | "철도";
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
    major_roads?: string[];
    estimated_delay?: number;
    congestion_level?: string;
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
];

// 업종별 경로 카테고리 매핑
const routeCategories = {
  container: routeOptions.filter((route) => route.category === "container"),
  cement: routeOptions.filter((route) => route.category === "cement"),
  steel: routeOptions.filter((route) => route.category === "steel"),
};

// 업종별 물류 인프라 매핑 정의
const industryInfrastructureMap = {
  biotech: {
    label: "바이오/제약",
    requiredInfrastructure: ["공항", "철도", "컨테이너"],
    locations: [
      { name: "청주국제공항", lat: 36.7166, lng: 127.499, type: "공항" },
      { name: "오송역", lat: 36.6264, lng: 127.3295, type: "철도" },
      { name: "청주역", lat: 36.6425, lng: 127.4911, type: "철도" },
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
    ],
  },
  it: {
    label: "IT/소프트웨어",
    requiredInfrastructure: ["컨테이너", "공항", "철도"],
    locations: [
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
      { name: "청주국제공항", lat: 36.7166, lng: 127.499, type: "공항" },
      { name: "오송역", lat: 36.6264, lng: 127.3295, type: "철도" },
    ],
  },
  semiconductor: {
    label: "반도체/전자",
    requiredInfrastructure: ["항만", "공항", "철도", "컨테이너"],
    locations: [
      { name: "부산신항", lat: 35.073, lng: 128.819, type: "항만" },
      { name: "군산항", lat: 35.9878, lng: 126.7166, type: "항만" },
      { name: "평택항", lat: 36.9852, lng: 126.8475, type: "항만" },
      { name: "청주국제공항", lat: 36.7166, lng: 127.499, type: "공항" },
      { name: "오송역", lat: 36.6264, lng: 127.3295, type: "철도" },
      { name: "청주역", lat: 36.6425, lng: 127.4911, type: "철도" },
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
    ],
  },
  automotive: {
    label: "자동차부품",
    requiredInfrastructure: ["항만", "철도", "컨테이너"],
    locations: [
      { name: "부산신항", lat: 35.073, lng: 128.819, type: "항만" },
      { name: "광양항", lat: 34.9, lng: 127.7, type: "항만" },
      { name: "군산항", lat: 35.9878, lng: 126.7166, type: "항만" },
      { name: "평택항", lat: 36.9852, lng: 126.8475, type: "항만" },
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
      { name: "오송역", lat: 36.6264, lng: 127.3295, type: "철도" },
      { name: "충주역", lat: 36.9906, lng: 127.9257, type: "철도" },
      { name: "음성역", lat: 36.9376, lng: 127.6856, type: "철도" },
    ],
  },
  machinery: {
    label: "기계/정밀",
    requiredInfrastructure: ["철도", "항만", "컨테이너"],
    locations: [
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
      { name: "평택항", lat: 36.9852, lng: 126.8475, type: "항만" },
      { name: "부산신항", lat: 35.073, lng: 128.819, type: "항만" },
      { name: "오송역", lat: 36.6264, lng: 127.3295, type: "철도" },
      { name: "청주역", lat: 36.6425, lng: 127.4911, type: "철도" },
    ],
  },
  steel: {
    label: "철강/금속",
    requiredInfrastructure: ["항만", "철도"],
    locations: [
      { name: "광양항", lat: 34.9, lng: 127.7, type: "항만" },
      { name: "포항", lat: 36.0, lng: 129.4, type: "항만" },
      { name: "울산", lat: 35.499, lng: 129.382, type: "항만" },
      { name: "부산신항", lat: 35.073, lng: 128.819, type: "항만" },
      { name: "인천", lat: 37.484, lng: 126.64, type: "항만" },
      { name: "당진", lat: 36.911, lng: 126.785, type: "철강" },
      { name: "오송역", lat: 36.6264, lng: 127.3295, type: "철도" },
    ],
  },
  cement: {
    label: "시멘트/건자재",
    requiredInfrastructure: ["철도"],
    locations: [
      { name: "도담", lat: 36.988, lng: 128.417, type: "시멘트" },
      { name: "입석리", lat: 37.125, lng: 128.5, type: "시멘트" },
      { name: "쌍용", lat: 37.185, lng: 128.345, type: "시멘트" },
      { name: "삼화", lat: 37.549, lng: 129.108, type: "시멘트" },
      { name: "제천역", lat: 37.1361, lng: 128.1948, type: "철도" },
      { name: "청주역", lat: 36.6425, lng: 127.4911, type: "철도" },
      { name: "충주역", lat: 36.9906, lng: 127.9257, type: "철도" },
    ],
  },
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
        apiResponse.route_details &&
        apiResponse.route_details.route &&
        apiResponse.route_details.route.trafast &&
        apiResponse.route_details.route.trafast[0]
      ) {
        // route_details.route.trafast에서 경로 추출
        const rawPath = apiResponse.route_details.route.trafast[0].path.map(
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
        apiResponse.route_details &&
        apiResponse.route_details.route &&
        apiResponse.route_details.route.traoptimal &&
        apiResponse.route_details.route.traoptimal[0]
      ) {
        // route_details.route.traoptimal에서 경로 추출
        const rawPath = apiResponse.route_details.route.traoptimal[0].path.map(
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
      } else if (
        apiResponse.route &&
        apiResponse.route.trafast &&
        apiResponse.route.trafast[0]
      ) {
        // 기존 구조 (route.trafast)
        const rawPath = apiResponse.route.trafast[0].path.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );

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
      } else if (
        apiResponse.route &&
        apiResponse.route.traoptimal &&
        apiResponse.route.traoptimal[0]
      ) {
        // 기존 구조 (route.traoptimal)
        const rawPath = apiResponse.route.traoptimal[0].path.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );

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
  const [highlightedRoute, setHighlightedRoute] =
    useState<RoutePolyline | null>(null);

  // 🔥 필터링 관련 상태 추가
  const [filteredMarkers, setFilteredMarkers] = useState<naver.maps.Marker[]>(
    []
  );
  const [showInfrastructureFilter, setShowInfrastructureFilter] =
    useState(false);
  const [selectedInfrastructureTypes, setSelectedInfrastructureTypes] =
    useState<string[]>([]);
  const [currentIndustryInfo, setCurrentIndustryInfo] = useState<{
    label: string;
    requiredInfrastructure: string[];
    locations: Array<{
      name: string;
      lat: number;
      lng: number;
      type: string;
    }>;
  } | null>(null);

  // 🔥 커스텀 경로 관련 상태 추가
  const [customStart, setCustomStart] = useState<[number, number] | null>(null);
  const [customGoal, setCustomGoal] = useState<[number, number] | null>(null);
  const [customStartMarker, setCustomStartMarker] =
    useState<naver.maps.Marker | null>(null);
  const [customGoalMarker, setCustomGoalMarker] =
    useState<naver.maps.Marker | null>(null);

  // 🔥 useRef로 최신 상태 값 추적
  const customStartRef = useRef<[number, number] | null>(null);
  const customGoalRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    customStartRef.current = customStart;
  }, [customStart]);

  useEffect(() => {
    customGoalRef.current = customGoal;
  }, [customGoal]);

  // 🔥 커스텀 경로 그리기 함수
  const drawCustomRoute = useCallback(
    async (start: [number, number], goal: [number, number]) => {
      if (!mapInstance.current) return;

      const routeOption: RouteOption = {
        id: "user-custom-route",
        name: "사용자 경로",
        start,
        goal,
        vias: [],
        description: "직접 선택한 경로",
        category: "container",
      };

      try {
        // 기존 경로 제거
        if (highlightedRoute) {
          highlightedRoute.setMap(null);
        }

        const result = await fetchRouteFromAPI(routeOption, {}, true);
        if (!result || !result.path || result.path.length < 2) {
          console.warn("유효하지 않은 경로 데이터:", result);
          return;
        }

        // 상세 경로 정보를 clickedRouteData에 저장
        setClickedRouteData({
          route: routeOption,
          data: result,
        });

        const newRoute = drawRouteFromAPI(
          mapInstance.current,
          result,
          "#FF6B6B",
          routeOption
        );

        if (newRoute) {
          setHighlightedRoute(newRoute);
        }
      } catch (error) {
        console.error("커스텀 경로 요청 실패:", error);
      }
    },
    [highlightedRoute]
  );

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
        case "공항":
          return "#8B5CF6"; // 보라
        case "항만":
          return "#06B6D4"; // 청록
        case "철도":
          return "#F97316"; // 주황
        default:
          return "#9CA3AF";
      }
    };

    const getColorByScore = (score: number) => {
      if (score >= 8.0) return "#ef4444";
      if (score >= 6.0) return "#eab308";
      return "#3b82f6";
    };

    mapInstance.current = map;
    const cargoStations: CargoStation[] = [
      { name: "도담", lat: 36.988, lng: 128.417, type: "시멘트" },
      { name: "입석리", lat: 37.125, lng: 128.5, type: "시멘트" },
      { name: "쌍용", lat: 37.185, lng: 128.345, type: "시멘트" },
      { name: "삼화", lat: 37.549, lng: 129.108, type: "시멘트" },
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
      { name: "부산신항", lat: 35.073, lng: 128.819, type: "컨테이너" },

      // 🔽 추가된 공항
      { name: "청주국제공항", lat: 36.7166, lng: 127.499, type: "공항" },

      // 🔽 추가된 항만
      { name: "평택항", lat: 36.9852, lng: 126.8475, type: "항만" },
      { name: "군산항", lat: 35.9878, lng: 126.7166, type: "항만" },

      // 🔽 추가된 철도역
      { name: "오송역", lat: 36.6264, lng: 127.3295, type: "철도" },
      { name: "청주역", lat: 36.6425, lng: 127.4911, type: "철도" },
      { name: "제천역", lat: 37.1361, lng: 128.1948, type: "철도" },
      { name: "충주역", lat: 36.9906, lng: 127.9257, type: "철도" },
      { name: "음성역", lat: 36.9376, lng: 127.6856, type: "철도" },
    ];

    const hubs = [
      { region: "부산항", lat: 35.1, lng: 129.1, label: "부산항" },
      { region: "광양항", lat: 34.9, lng: 127.7, label: "광양항" },
      { region: "포항", lat: 36.0, lng: 129.4, label: "포항" },
    ];

    // 🔥 업종별 cargoStations와 hubs 필터링
    const getFilteredCargoStations = () => {
      if (!selectedIndustry) return cargoStations;

      const industryKey =
        selectedIndustry as keyof typeof industryInfrastructureMap;
      const industryInfo = industryInfrastructureMap[industryKey];
      if (!industryInfo) return cargoStations;

      // 업종별 locations에 있는 마커들만 필터링
      const requiredLocationNames = industryInfo.locations.map(
        (location) => location.name
      );

      return cargoStations.filter((station) =>
        requiredLocationNames.some(
          (name) => station.name.includes(name) || name.includes(station.name)
        )
      );
    };

    const getFilteredHubs = () => {
      if (!selectedIndustry) return hubs;

      const industryKey =
        selectedIndustry as keyof typeof industryInfrastructureMap;
      const industryInfo = industryInfrastructureMap[industryKey];
      if (!industryInfo) return hubs;

      // 업종별 관련 hubs만 필터링
      const relevantHubNames = industryInfo.locations
        .filter((location) => location.type === "항만")
        .map((location) => location.name);

      return hubs.filter((hub) =>
        relevantHubNames.some(
          (name) => hub.label.includes(name) || name.includes(hub.label)
        )
      );
    };

    const filteredCargoStations = getFilteredCargoStations();
    const filteredHubs = getFilteredHubs();

    // 필터링된 hubs 표시
    filteredHubs.forEach((hub) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(hub.lat, hub.lng),
        map: map,
        title: hub.label,
        icon: {
          content: `<div style="background:#000;color:#fff;padding:4px 8px;border-radius:6px;">${hub.label}</div>`,
          size: new window.naver.maps.Size(12, 12),
          anchor: new window.naver.maps.Point(12, 12),
        },
      });

      // 🔥 hubs 마커 클릭 시 출발지/도착지 설정 (cargoStations와 동일)
      window.naver.maps.Event.addListener(marker, "click", () => {
        const coord: [number, number] = [hub.lat, hub.lng];
        const start = customStartRef.current;
        const goal = customGoalRef.current;

        if (!start && !goal) {
          setCustomStart(coord);
          const startMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(hub.lat, hub.lng),
            map: map,
            title: `출발지: ${hub.label}`,
            icon: {
              content: `<div style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚀 출발지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomStartMarker(startMarker);
        } else if (start && !goal) {
          setCustomGoal(coord);
          const goalMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(hub.lat, hub.lng),
            map: map,
            title: `도착지: ${hub.label}`,
            icon: {
              content: `<div style="background: #F44336; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎯 도착지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomGoalMarker(goalMarker);
          drawCustomRoute(start, coord);
        } else if (!start && goal) {
          setCustomStart(coord);
          const startMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(hub.lat, hub.lng),
            map: map,
            title: `출발지: ${hub.label}`,
            icon: {
              content: `<div style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚀 출발지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomStartMarker(startMarker);
          drawCustomRoute(coord, goal);
        } else {
          const isStart = window.confirm(
            `"${hub.label}"을(를) 어떻게 설정하시겠습니까?\n\n확인: 출발지로 변경\n취소: 도착지로 변경`
          );
          if (isStart) {
            if (customStartMarker) {
              (
                customStartMarker as naver.maps.Marker & {
                  setMap: (map: naver.maps.Map | null) => void;
                }
              ).setMap(null);
            }
            setCustomStart(coord);
            const startMarker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(hub.lat, hub.lng),
              map: map,
              title: `출발지: ${hub.label}`,
              icon: {
                content: `<div style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚀 출발지</div>`,
                size: new window.naver.maps.Size(12, 12),
                anchor: new window.naver.maps.Point(12, 12),
              },
            });
            setCustomStartMarker(startMarker);
            drawCustomRoute(coord, goal);
          } else {
            if (customGoalMarker) {
              (
                customGoalMarker as naver.maps.Marker & {
                  setMap: (map: naver.maps.Map | null) => void;
                }
              ).setMap(null);
            }
            setCustomGoal(coord);
            const goalMarker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(hub.lat, hub.lng),
              map: map,
              title: `도착지: ${hub.label}`,
              icon: {
                content: `<div style="background: #F44336; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎯 도착지</div>`,
                size: new window.naver.maps.Size(12, 12),
                anchor: new window.naver.maps.Point(12, 12),
              },
            });
            setCustomGoalMarker(goalMarker);
            drawCustomRoute(start, coord);
          }
        }
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

      // 🔥 마커 클릭 시 출발지/도착지 설정 (개선된 버전)
      window.naver.maps.Event.addListener(marker, "click", () => {
        const coord: [number, number] = [item.lat, item.lng];

        const start = customStartRef.current;
        const goal = customGoalRef.current;

        if (!start && !goal) {
          // 첫 번째 클릭: 출발지 설정
          setCustomStart(coord);
          const startMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(item.lat, item.lng),
            map: map,
            title: `출발지: ${item.region}`,
            icon: {
              content: `<div style="
                background: #4CAF50;
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🚀 출발지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomStartMarker(startMarker);
        } else if (start && !goal) {
          // 두 번째 클릭: 도착지 설정 및 경로 그리기
          setCustomGoal(coord);
          const goalMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(item.lat, item.lng),
            map: map,
            title: `도착지: ${item.region}`,
            icon: {
              content: `<div style="
                background: #F44336;
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🎯 도착지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomGoalMarker(goalMarker);

          // 즉시 경로 그리기
          drawCustomRoute(start, coord);
        } else if (!start && goal) {
          // 도착지만 있는 경우: 출발지 설정 및 경로 그리기
          setCustomStart(coord);
          const startMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(item.lat, item.lng),
            map: map,
            title: `출발지: ${item.region}`,
            icon: {
              content: `<div style="
                background: #4CAF50;
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🚀 출발지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomStartMarker(startMarker);

          // 즉시 경로 그리기
          drawCustomRoute(coord, goal);
        } else {
          // 출발지와 도착지가 모두 있는 경우: 선택 옵션 제공
          const isStart = window.confirm(
            `"${item.region}"을(를) 어떻게 설정하시겠습니까?\n\n확인: 출발지로 변경\n취소: 도착지로 변경`
          );

          if (isStart) {
            // 출발지로 변경
            if (customStartMarker) {
              (
                customStartMarker as naver.maps.Marker & {
                  setMap: (map: naver.maps.Map | null) => void;
                }
              ).setMap(null);
            }
            setCustomStart(coord);
            const startMarker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(item.lat, item.lng),
              map: map,
              title: `출발지: ${item.region}`,
              icon: {
                content: `<div style="
                  background: #4CAF50;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: bold;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">🚀 출발지</div>`,
                size: new window.naver.maps.Size(12, 12),
                anchor: new window.naver.maps.Point(12, 12),
              },
            });
            setCustomStartMarker(startMarker);

            // 즉시 경로 그리기
            drawCustomRoute(coord, goal);
          } else {
            // 도착지로 변경
            if (customGoalMarker) {
              (
                customGoalMarker as naver.maps.Marker & {
                  setMap: (map: naver.maps.Map | null) => void;
                }
              ).setMap(null);
            }
            setCustomGoal(coord);
            const goalMarker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(item.lat, item.lng),
              map: map,
              title: `도착지: ${item.region}`,
              icon: {
                content: `<div style="
                  background: #F44336;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: bold;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">🎯 도착지</div>`,
                size: new window.naver.maps.Size(12, 12),
                anchor: new window.naver.maps.Point(12, 12),
              },
            });
            setCustomGoalMarker(goalMarker);

            // 즉시 경로 그리기
            drawCustomRoute(start, coord);
          }
        }
      });

      markersRef.current.push(marker);
    });

    // 필터링된 cargoStations 표시
    filteredCargoStations.forEach((station) => {
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

      // 🔥 cargoStations 마커 클릭 시 출발지/도착지 설정 (개선된 버전)
      window.naver.maps.Event.addListener(marker, "click", () => {
        const coord: [number, number] = [station.lat, station.lng];

        const start = customStartRef.current;
        const goal = customGoalRef.current;

        if (!start && !goal) {
          // 첫 번째 클릭: 출발지 설정
          setCustomStart(coord);
          const startMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(station.lat, station.lng),
            map: map,
            title: `출발지: ${station.name}`,
            icon: {
              content: `<div style="
                background: #4CAF50;
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🚀 출발지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomStartMarker(startMarker);
        } else if (start && !goal) {
          // 두 번째 클릭: 도착지 설정 및 경로 그리기
          setCustomGoal(coord);
          const goalMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(station.lat, station.lng),
            map: map,
            title: `도착지: ${station.name}`,
            icon: {
              content: `<div style="
                background: #F44336;
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🎯 도착지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomGoalMarker(goalMarker);

          // 즉시 경로 그리기
          drawCustomRoute(start, coord);
        } else if (!start && goal) {
          // 도착지만 있는 경우: 출발지 설정 및 경로 그리기
          setCustomStart(coord);
          const startMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(station.lat, station.lng),
            map: map,
            title: `출발지: ${station.name}`,
            icon: {
              content: `<div style="
                background: #4CAF50;
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">🚀 출발지</div>`,
              size: new window.naver.maps.Size(12, 12),
              anchor: new window.naver.maps.Point(12, 12),
            },
          });
          setCustomStartMarker(startMarker);

          // 즉시 경로 그리기
          drawCustomRoute(coord, goal);
        } else {
          // 출발지와 도착지가 모두 있는 경우: 선택 옵션 제공
          const isStart = window.confirm(
            `"${station.name} (${station.type})"을(를) 어떻게 설정하시겠습니까?\n\n확인: 출발지로 변경\n취소: 도착지로 변경`
          );

          if (isStart) {
            // 출발지로 변경
            if (customStartMarker) {
              (
                customStartMarker as naver.maps.Marker & {
                  setMap: (map: naver.maps.Map | null) => void;
                }
              ).setMap(null);
            }
            setCustomStart(coord);
            const startMarker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(station.lat, station.lng),
              map: map,
              title: `출발지: ${station.name}`,
              icon: {
                content: `<div style="
                  background: #4CAF50;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: bold;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">🚀 출발지</div>`,
                size: new window.naver.maps.Size(12, 12),
                anchor: new window.naver.maps.Point(12, 12),
              },
            });
            setCustomStartMarker(startMarker);

            // 즉시 경로 그리기
            drawCustomRoute(coord, goal);
          } else {
            // 도착지로 변경
            if (customGoalMarker) {
              (
                customGoalMarker as naver.maps.Marker & {
                  setMap: (map: naver.maps.Map | null) => void;
                }
              ).setMap(null);
            }
            setCustomGoal(coord);
            const goalMarker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(station.lat, station.lng),
              map: map,
              title: `도착지: ${station.name}`,
              icon: {
                content: `<div style="
                  background: #F44336;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: bold;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">🎯 도착지</div>`,
                size: new window.naver.maps.Size(12, 12),
                anchor: new window.naver.maps.Point(12, 12),
              },
            });
            setCustomGoalMarker(goalMarker);
          }

          // 경로 다시 그리기
          if (highlightedRoute) highlightedRoute.setMap(null);
          setHighlightedRoute(null);
        }
      });
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

  // selectedIndustry가 변경될 때 상세 경로 정보 초기화
  useEffect(() => {
    if (selectedIndustry && !clickedRouteData) {
      // 상세 경로 정보 초기화
      setClickedRouteData(null);
      setCurrentRedRouteId(null);
      setRoutePolylines([]);
      // ✨ 빨간색 경로도 초기화
      if (highlightedRoute) {
        highlightedRoute.setMap(null);
        setHighlightedRoute(null);
      }
    }
  }, [selectedIndustry, clickedRouteData, highlightedRoute]);

  // 🔥 selectedIndustry가 변경될 때 자동으로 인프라 필터링 적용
  useEffect(() => {
    if (selectedIndustry) {
      // 업종별 인프라 필터링 적용
      filterInfrastructureByIndustry(selectedIndustry);
    } else {
      // 필터링 해제
      clearInfrastructureFilter();
    }
  }, [selectedIndustry]);

  // 🔥 출발지와 도착지가 모두 설정되면 경로 요청
  useEffect(() => {
    if (
      !customStartRef.current ||
      !customGoalRef.current ||
      !mapInstance.current
    )
      return;

    const fetchAndDrawRoute = async () => {
      const routeOption: RouteOption = {
        id: "user-custom-route",
        name: "사용자 경로",
        start: customStartRef.current!,
        goal: customGoalRef.current!,
        vias: [],
        description: "직접 선택한 경로",
        category: "container",
      };

      try {
        const result = await fetchRouteFromAPI(routeOption, {}, true);
        if (!result || !result.path || result.path.length < 2) {
          console.warn("유효하지 않은 경로 데이터:", result);
          return;
        }

        // 기존 경로 제거
        if (highlightedRoute) {
          highlightedRoute.setMap(null);
        }

        const newRoute = drawRouteFromAPI(
          mapInstance.current,
          result,
          "#FF6B6B",
          routeOption
        );

        if (newRoute) {
          setHighlightedRoute(newRoute);
        }
      } catch (error) {
        console.error("커스텀 경로 요청 실패:", error);
      }
    };

    fetchAndDrawRoute();
  }, [customStart, customGoal]);

  // 빨간색 경로 제거 함수 (비동기 처리)
  const removeRedRoutesAsync = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      console.log(
        `빨간색 경로 제거 함수 실행: ${highlightedRoute ? "1개" : "0개"} 제거`
      );

      // 별도 관리되는 빨간색 경로 제거
      if (highlightedRoute) {
        highlightedRoute.setMap(null);
        setHighlightedRoute(null);
      }

      // 기존 routePolylines에서도 빨간색 경로 제거 (안전장치)
      const currentRedPolylines = routePolylines.filter(
        (polyline) => polyline.getOptions().strokeColor === "#FF6B6B"
      );

      if (currentRedPolylines.length > 0) {
        console.log(
          `routePolylines에서 추가 빨간색 경로 ${currentRedPolylines.length}개 제거`
        );
        currentRedPolylines.forEach((polyline) => {
          polyline.setMap(null);
        });

        setRoutePolylines((prev) => {
          const filtered = prev.filter(
            (polyline) => polyline.getOptions().strokeColor !== "#FF6B6B"
          );
          console.log(
            `상태에서 빨간색 경로 제거 후 남은 경로: ${filtered.length}개`
          );
          return filtered;
        });
      }

      setCurrentRedRouteId(null);
      resolve();
    });
  };

  // 경로 클릭 핸들러
  const handleRouteClick = async (route: RouteOption, routeData: RouteData) => {
    if (!mapInstance.current) return;

    setIsLoadingRoute(true);

    try {
      // 기존 빨간색 경로 제거 완료 대기
      await removeRedRoutesAsync();

      // React 상태 업데이트가 완전히 반영되도록 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 50));

      // ✨ 중복 체크: 같은 경로를 다시 선택한 경우 처리
      if (currentRedRouteId === route.id) {
        console.log(`이미 강조된 경로입니다: ${route.id}`);
        setIsLoadingRoute(false);
        return;
      }

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

      // 클릭된 경로 데이터 상태 업데이트 (즉시 업데이트하여 정보 유지)
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
        undefined // ❌ 클릭 이벤트 콜백 제거 - 무한 루프 방지
      ); // 빨간색, 클릭 불가능

      if (result) {
        // 새로운 빨간색 경로를 별도 상태로 관리
        setHighlightedRoute(result);
        setCurrentRedRouteId(route.id);

        console.log(`새로운 빨간색 경로 설정 완료: ${route.id}`);
        console.log(`highlightedRoute 상태:`, result);
        console.log(`currentRedRouteId 상태:`, route.id);
      } else {
        console.error(`빨간색 경로 생성 실패: ${route.id}`);
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

      // 상태 초기화 (상세 경로 정보는 유지)
      setRoutePolylines([]);
      setCurrentRedRouteId(null); // 현재 빨간색 경로 ID 초기화
      // ✨ 빨간색 경로도 clickedRouteData가 없을 때만 초기화
      if (!clickedRouteData && highlightedRoute) {
        highlightedRoute.setMap(null);
        setHighlightedRoute(null);
      }

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
      // 기존 빨간색 경로 제거 완료 대기
      await removeRedRoutesAsync();

      // React 상태 업데이트가 완전히 반영되도록 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 50));

      // ✨ 중복 체크: 같은 경로를 다시 선택한 경우 처리
      if (currentRedRouteId === selectedRoute.id) {
        console.log(`이미 강조된 경로입니다: ${selectedRoute.id}`);
        setIsLoadingRoute(false);
        return;
      }

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
        undefined // ❌ 클릭 이벤트 콜백 제거 - 무한 루프 방지
      ); // 빨간색, 클릭 불가능

      if (result) {
        // 새로운 빨간색 경로를 별도 상태로 관리
        setHighlightedRoute(result);
        setCurrentRedRouteId(selectedRoute.id);

        console.log(`새로운 빨간색 경로 설정 완료: ${selectedRoute.id}`);
        console.log(`highlightedRoute 상태:`, result);
        console.log(`currentRedRouteId 상태:`, selectedRoute.id);
      } else {
        console.error(`빨간색 경로 생성 실패: ${selectedRoute.id}`);
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

  // 🔥 업종별 인프라 필터링 함수들
  const getIndustryInfo = useCallback((industry: string) => {
    const industryKey = industry as keyof typeof industryInfrastructureMap;
    return industryInfrastructureMap[industryKey] || null;
  }, []);

  const filterInfrastructureByIndustry = useCallback(
    (industry: string) => {
      const industryInfo = getIndustryInfo(industry);
      if (!industryInfo) return;

      setCurrentIndustryInfo(industryInfo);
      setSelectedInfrastructureTypes(industryInfo.requiredInfrastructure);
      setShowInfrastructureFilter(true);

      // 기존 마커들 숨기기
      markersRef.current = [];

      // 업종별 관련 인프라만 표시
      const relevantLocations = industryInfo.locations;
      const newMarkers: naver.maps.Marker[] = [];

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
          case "공항":
            return "#8B5CF6"; // 보라
          case "항만":
            return "#06B6D4"; // 청록
          case "철도":
            return "#F97316"; // 주황
          default:
            return "#9CA3AF";
        }
      };

      relevantLocations.forEach((location) => {
        if (!mapInstance.current) return;

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(location.lat, location.lng),
          map: mapInstance.current,
          title: `${location.name} (${location.type})`,
          icon: {
            content: `<div style="
            padding: 4px 6px;
            background: ${getColorByCargoType(location.type)};
            color: white;
            font-size: 12px;
            border-radius: 4px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${location.name}
          </div>`,
            anchor: new window.naver.maps.Point(10, 10),
            size: new window.naver.maps.Size(20, 20),
          },
        });

        newMarkers.push(marker);
      });

      setFilteredMarkers(newMarkers);
    },
    [getIndustryInfo]
  );

  const clearInfrastructureFilter = useCallback(() => {
    // 필터링된 마커들 제거
    setFilteredMarkers([]);

    // 원래 마커들 다시 표시
    if (mapInstance.current) {
      data.forEach((item) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(item.lat, item.lng),
          map: mapInstance.current,
          icon: {
            content: `<div class="heatmap-marker" style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background-color: ${
                item.score >= 8.0
                  ? "#ef4444"
                  : item.score >= 6.0
                  ? "#eab308"
                  : "#3b82f6"
              };
              opacity: 0.7;
              border: 2px solid white;
              box-shadow: 0 0 10px rgba(0,0,0,0.3);
            "></div>`,
            size: new window.naver.maps.Size(20, 20),
            anchor: new window.naver.maps.Point(10, 10),
          },
        });

        window.naver.maps.Event.addListener(marker, "click", () => {
          onRegionClick?.(item.region);
        });

        markersRef.current.push(marker);
      });
    }

    setShowInfrastructureFilter(false);
    setSelectedInfrastructureTypes([]);
    setCurrentIndustryInfo(null);
  }, [filteredMarkers, data, onRegionClick]);

  const toggleInfrastructureType = useCallback((type: string) => {
    setSelectedInfrastructureTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  }, []);

  // 🔥 경로 초기화 함수
  const resetCustomRoute = useCallback(() => {
    // 기존 마커들 제거
    if (customStartMarker) {
      (
        customStartMarker as naver.maps.Marker & {
          setMap: (map: naver.maps.Map | null) => void;
        }
      ).setMap(null);
    }
    if (customGoalMarker) {
      (
        customGoalMarker as naver.maps.Marker & {
          setMap: (map: naver.maps.Map | null) => void;
        }
      ).setMap(null);
    }
    if (highlightedRoute) {
      highlightedRoute.setMap(null);
    }

    // 상태 초기화
    setCustomStart(null);
    setCustomGoal(null);
    setCustomStartMarker(null);
    setCustomGoalMarker(null);
    setHighlightedRoute(null);
    setClickedRouteData(null); // 상세 경로 정보도 초기화
  }, [customStartMarker, customGoalMarker, highlightedRoute]);

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

          {/* 🔥 업종별 인프라 필터링 컨트롤 */}
          {currentIndustryInfo && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-700">
                  {currentIndustryInfo.label} 관련 인프라:
                </span>
                {currentIndustryInfo.requiredInfrastructure.map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`text-xs ${
                      selectedInfrastructureTypes.includes(type)
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                  >
                    {type === "공항" && "✈️"}
                    {type === "철도" && "🚂"}
                    {type === "컨테이너" && "🚢"}
                    {type === "항만" && "⚓"}
                    {type}
                  </Badge>
                ))}
              </div>
              <Button
                onClick={clearInfrastructureFilter}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                필터 해제
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div ref={mapRef} className="w-full h-[500px] rounded-lg" />

          {/* 🔥 경로 초기화 버튼 */}
          {(customStart || customGoal) && (
            <Button
              onClick={resetCustomRoute}
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 z-10"
            >
              🗑️ 경로 초기화
            </Button>
          )}

          <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2 text-sm">
              <Legend color="red-500" label="고성장 (8.0+)" />
              <Legend color="yellow-500" label="안정성장 (6.0~7.9)" />
              <Legend color="blue-500" label="성장필요 (~5.9)" />
            </div>
          </div>

          {/* 🔥 업종별 인프라 정보 오버레이 */}
          {currentIndustryInfo && (
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm border border-blue-200">
              <h4 className="font-semibold text-sm mb-3 text-blue-800 flex items-center">
                🏭 {currentIndustryInfo.label} 인프라 현황
              </h4>
              <div className="space-y-2">
                <div className="text-xs text-gray-600 mb-2">
                  필요한 인프라 유형:{" "}
                  {currentIndustryInfo.requiredInfrastructure.length}개
                </div>
                <div className="space-y-1">
                  {currentIndustryInfo.locations.map((location, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: (() => {
                              switch (location.type) {
                                case "시멘트":
                                  return "#6B7280";
                                case "컨테이너":
                                  return "#3B82F6";
                                case "석탄":
                                  return "#1F2937";
                                case "철강":
                                  return "#EF4444";
                                case "유류":
                                  return "#F59E0B";
                                case "광석":
                                  return "#10B981";
                                case "공항":
                                  return "#8B5CF6";
                                case "항만":
                                  return "#06B6D4";
                                case "철도":
                                  return "#F97316";
                                default:
                                  return "#9CA3AF";
                              }
                            })(),
                          }}
                        />
                        <span className="font-medium">{location.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {location.type === "공항" && "✈️"}
                        {location.type === "철도" && "🚂"}
                        {location.type === "컨테이너" && "🚢"}
                        {location.type === "항만" && "⚓"}
                        {location.type === "시멘트" && "🧱"}
                        {location.type === "철강" && "🏗️"}
                        {location.type}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    💡 해당 업종에 필요한 물류 인프라가 모두 표시됩니다.
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* 클릭된 경로 API 결과 표시 */}
          {clickedRouteData && (
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-sm border border-green-200 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-sm mb-2 text-green-800">
                {clickedRouteData.route.id === "user-custom-route"
                  ? "🛣️ 커스텀 경로 정보"
                  : "📍 상세 경로 정보"}
                {isLoadingRoute && (
                  <span className="ml-2 text-xs text-blue-600 animate-pulse">
                    🔄 업데이트 중...
                  </span>
                )}
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
                        ?.estimated_delay && (
                        <div>
                          예상 지연:{" "}
                          {Math.round(
                            clickedRouteData.data.traffic_conditions
                              .estimated_delay / 60
                          )}
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
                                  `${waypoint.type} (${
                                    waypoint.lat?.toFixed(3) || "N/A"
                                  }, ${waypoint.lng?.toFixed(3) || "N/A"})`}
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
