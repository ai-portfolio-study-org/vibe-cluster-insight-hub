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

// 네이버 지도 Marker 확장 타입
interface ExtendedMarker extends naver.maps.Marker {
  getTitle(): string;
  setMap(map: naver.maps.Map | null): void;
  getPosition(): naver.maps.LatLng;
  getMap(): naver.maps.Map | null;
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

// 🔥 도로 공사정보 인터페이스 추가
interface RoadConstructionInfo {
  발주청: string;
  공사명: string;
  공사구분: string;
  주요사업지: string;
  사업개요: string;
  노선명: string;
  공사위치: string;
  시공사: string;
  현장주소: string;
  시작일: string;
  준공일: string;
  "도급액(원)": string;
}

// 🔥 철도 관련 타입들
interface RailwayIndustryInfo {
  발주청: string;
  사업명: string;
  사업개요: string;
  추진경위: string;
  사업시작일: string;
  화물여부: string;
  투자금액: string;
}

interface HighSpeedRailwayPlan {
  사업명: string;
  사업구간: string;
  사업내용: string;
  연장: string;
  추진단계: string;
}

interface MetropolitanRailwayInfo {
  사업명: string;
  사업구간: string;
  사업내용: string;
  연장: string;
  추진단계: string;
}

interface GeneralRailwayConstruction {
  노선명: string;
  사업구간: string;
  사업내용: string;
  연장: string;
  착공일: string;
  완공일: string;
}

interface RailwayConstructionStatus {
  사업명: string;
  연장: string;
  착공일: string;
  완공일: string;
  진행률: string;
  사업단계: string;
}

// 🔥 도로 인프라 연계성 분석 결과 인터페이스
interface RoadInfrastructureAnalysis {
  constructionCount: number;
  totalBudget: number;
  completionRate: number;
  regionalDistribution: { [region: string]: number };
  constructionTypes: { [type: string]: number };
  timelineAnalysis: {
    ongoing: number;
    completed: number;
    planned: number;
  };
  impactScore: number;
  recommendations: string[];
}

// 🔥 철도 인프라 연계성 분석 결과 인터페이스
interface RailwayInfrastructureAnalysis {
  totalProjects: number;
  totalLength: number;
  highSpeedRailways: number;
  metropolitanRailways: number;
  generalRailways: number;
  freightRailways: number;
  regionalDistribution: { [region: string]: number };
  completionRate: number;
  connectivityScore: number;
  recommendations: string[];
}

// CSV 파싱 헬퍼 함수
const parseCSV = <T,>(csvText: string): T[] => {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",");
  const data: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(",");
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || "";
      });
      data.push(row as unknown as T);
    }
  }

  return data;
};

const MapHeatmap = ({
  data,
  onRegionClick,
  selectedIndustry,
}: MapHeatmapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const loadRoadConstructionData = useCallback(async () => {
    setIsLoadingRoadData(true);
    try {
      const response = await fetch(
        "/vibe-cluster-insight-hub/road_construction_info.csv"
      );
      const csvText = await response.text();

      // CSV 파싱
      const lines = csvText.split("\n");
      const headers = lines[0].split(",");
      const data: RoadConstructionInfo[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",");
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || "";
          });
          data.push(row as unknown as RoadConstructionInfo);
        }
      }

      setRoadConstructionData(data);
      console.log("도로 공사정보 로드 완료:", data.length, "건");
    } catch (error) {
      console.error("도로 공사정보 로드 실패:", error);
    } finally {
      setIsLoadingRoadData(false);
    }
  }, []);

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

  // 🔥 도로 인프라 분석 관련 상태 추가
  const [roadConstructionData, setRoadConstructionData] = useState<
    RoadConstructionInfo[]
  >([]);
  const [roadAnalysisResult, setRoadAnalysisResult] =
    useState<RoadInfrastructureAnalysis | null>(null);
  const [showRoadAnalysis, setShowRoadAnalysis] = useState(false);
  const [isLoadingRoadData, setIsLoadingRoadData] = useState(false);

  // 🔥 useRef로 최신 상태 값 추적
  const customStartRef = useRef<[number, number] | null>(null);
  const customGoalRef = useRef<[number, number] | null>(null);

  // 🔥 철도 관련 상태들
  const [railwayIndustryData, setRailwayIndustryData] = useState<
    RailwayIndustryInfo[]
  >([]);
  const [highSpeedRailwayData, setHighSpeedRailwayData] = useState<
    HighSpeedRailwayPlan[]
  >([]);
  const [metropolitanRailwayData, setMetropolitanRailwayData] = useState<
    MetropolitanRailwayInfo[]
  >([]);
  const [generalRailwayData, setGeneralRailwayData] = useState<
    GeneralRailwayConstruction[]
  >([]);
  const [railwayConstructionData, setRailwayConstructionData] = useState<
    RailwayConstructionStatus[]
  >([]);
  const [isLoadingRailwayData, setIsLoadingRailwayData] = useState(false);

  // 🔥 철도 분석 관련 상태
  const [showRailwayAnalysis, setShowRailwayAnalysis] = useState(false);
  const [railwayAnalysisResult, setRailwayAnalysisResult] =
    useState<RailwayInfrastructureAnalysis | null>(null);

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
            `"${item.region}"을(를) 어떻게 설정하시겠습니다?\n\n확인: 출발지로 변경\n취소: 도착지로 변경`
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
            `"${station.name} (${station.type})"을(를) 어떻게 설정하시겠습니다?\n\n확인: 출발지로 변경\n취소: 도착지로 변경`
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
  const loadRailwayData = useCallback(async () => {
    setIsLoadingRailwayData(true);
    try {
      // 철도산업 사업현황
      const industryResponse = await fetch(
        "/vibe-cluster-insight-hub/railway_industry_info_utf8.csv"
      );
      const industryText = await industryResponse.text();
      const industryData = parseCSV<RailwayIndustryInfo>(industryText);
      setRailwayIndustryData(industryData);

      // 고속철도 사업계획
      const highSpeedResponse = await fetch(
        "/vibe-cluster-insight-hub/high_speed_railway_plan_utf8.csv"
      );
      const highSpeedText = await highSpeedResponse.text();
      const highSpeedData = parseCSV<HighSpeedRailwayPlan>(highSpeedText);
      setHighSpeedRailwayData(highSpeedData);

      // 광역철도 사업내용
      const metropolitanResponse = await fetch(
        "/vibe-cluster-insight-hub/metropolitan_railway_info_utf8.csv"
      );
      const metropolitanText = await metropolitanResponse.text();
      const metropolitanData =
        parseCSV<MetropolitanRailwayInfo>(metropolitanText);
      setMetropolitanRailwayData(metropolitanData);

      // 일반철도 공사내용
      const generalResponse = await fetch(
        "/vibe-cluster-insight-hub/general_railway_construction_utf8.csv"
      );
      const generalText = await generalResponse.text();
      const generalData = parseCSV<GeneralRailwayConstruction>(generalText);
      setGeneralRailwayData(generalData);

      // 철도건설현황
      const constructionResponse = await fetch(
        "/vibe-cluster-insight-hub/railway_construction_status_utf8.csv"
      );
      const constructionText = await constructionResponse.text();
      const constructionData =
        parseCSV<RailwayConstructionStatus>(constructionText);
      setRailwayConstructionData(constructionData);

      console.log(
        `철도 데이터 로드 완료: 산업현황 ${industryData.length}건, 고속철도 ${highSpeedData.length}건, 광역철도 ${metropolitanData.length}건, 일반철도 ${generalData.length}건, 건설현황 ${constructionData.length}건`
      );
    } catch (error) {
      console.error("철도 데이터 로드 실패:", error);
    } finally {
      setIsLoadingRailwayData(false);
    }
  }, []);
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
      // 도로 공사정보 데이터 로드
      loadRoadConstructionData();
      // 철도 데이터 로드
      loadRailwayData();
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initializeMap, loadRoadConstructionData, loadRailwayData]);

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

  // 🔥 도로 공사정보 데이터 로드 함수

  // 🔥 도로 인프라 연계성 분석 함수
  const analyzeRoadInfrastructure = useCallback(
    (region?: string) => {
      if (roadConstructionData.length === 0) return null;

      let filteredData = roadConstructionData;

      // 특정 지역 필터링
      if (region) {
        filteredData = roadConstructionData.filter(
          (item) =>
            item.주요사업지.includes(region) ||
            item.공사위치.includes(region) ||
            item.현장주소.includes(region)
        );
      }

      // 지역별 분포 분석
      const regionalDistribution: { [region: string]: number } = {};
      const constructionTypes: { [type: string]: number } = {};

      let totalBudget = 0;
      let completedCount = 0;
      let ongoingCount = 0;
      let plannedCount = 0;

      filteredData.forEach((item) => {
        // 지역 분포
        const regions = item.주요사업지.split(",").map((r) => r.trim());
        regions.forEach((region) => {
          if (region) {
            regionalDistribution[region] =
              (regionalDistribution[region] || 0) + 1;
          }
        });

        // 공사 유형 분포
        const type = item.공사구분 || "기타";
        constructionTypes[type] = (constructionTypes[type] || 0) + 1;

        // 예산 계산
        const budget = parseInt(
          item["도급액(원)"]?.replace(/[^\d]/g, "") || "0"
        );
        totalBudget += budget;

        // 진행 상황 분석
        const startDate = item.시작일;
        const completionDate = item.준공일;
        const currentDate = new Date();

        if (startDate && completionDate) {
          const start = new Date(startDate);
          const completion = new Date(completionDate);

          if (currentDate > completion) {
            completedCount++;
          } else if (currentDate >= start) {
            ongoingCount++;
          } else {
            plannedCount++;
          }
        } else if (startDate) {
          const start = new Date(startDate);
          if (currentDate >= start) {
            ongoingCount++;
          } else {
            plannedCount++;
          }
        } else {
          plannedCount++;
        }
      });

      // 완공률 계산
      const completionRate =
        filteredData.length > 0
          ? (completedCount / filteredData.length) * 100
          : 0;

      // 영향도 점수 계산 (예산, 공사 수, 완공률 등을 종합)
      const impactScore = Math.min(
        100,
        (totalBudget / 1000000000) * 0.3 + // 예산 가중치
          (filteredData.length / 10) * 0.3 + // 공사 수 가중치
          completionRate * 0.4 // 완공률 가중치
      );

      // 권장사항 생성
      const recommendations: string[] = [];
      if (ongoingCount > completedCount) {
        recommendations.push(
          "진행 중인 공사가 많아 완공 시점을 고려한 물류 계획 수립 필요"
        );
      }
      if (plannedCount > 0) {
        recommendations.push("계획된 공사가 있어 향후 교통 흐름 변화 예상");
      }
      if (Object.keys(regionalDistribution).length > 5) {
        recommendations.push(
          "광범위한 지역에 공사가 분산되어 있어 종합적인 물류 네트워크 구축 필요"
        );
      }
      if (impactScore > 70) {
        recommendations.push(
          "도로 인프라 투자가 활발하여 물류 효율성 향상 기대"
        );
      }

      const analysis: RoadInfrastructureAnalysis = {
        constructionCount: filteredData.length,
        totalBudget,
        completionRate,
        regionalDistribution,
        constructionTypes,
        timelineAnalysis: {
          ongoing: ongoingCount,
          completed: completedCount,
          planned: plannedCount,
        },
        impactScore,
        recommendations,
      };

      return analysis;
    },
    [roadConstructionData]
  );

  // 🔥 도로 공사 마커 표시 함수
  const displayRoadConstructionMarkers = useCallback(
    (analysis: RoadInfrastructureAnalysis) => {
      if (!mapInstance.current) return;

      // 기존 도로 공사 마커 제거
      const existingMarkers = markersRef.current.filter((marker) => {
        // naver.maps.Marker 타입에 getTitle, setMap이 실제로 존재함
        // 타입 선언이 없을 경우, Marker를 any로 단언하지 않고 as naver.maps.Marker로 단언
        return (
          (marker as ExtendedMarker).getTitle &&
          (marker as ExtendedMarker).getTitle().includes("도로공사")
        );
      });
      existingMarkers.forEach((marker) =>
        (marker as ExtendedMarker).setMap(null)
      );

      // 지역별로 공사 그룹화
      const regionGroups: { [key: string]: RoadConstructionInfo[] } = {};

      // 도로 공사 데이터를 지역별로 그룹화
      roadConstructionData.forEach((item) => {
        if (!item.주요사업지) return;

        const baseCoordinates = extractCoordinatesFromAddress(
          item.현장주소 || item.주요사업지
        );
        if (!baseCoordinates) return;

        // 좌표를 키로 사용하여 지역별 그룹화
        const coordKey = `${baseCoordinates.lat.toFixed(
          4
        )},${baseCoordinates.lng.toFixed(4)}`;

        if (!regionGroups[coordKey]) {
          regionGroups[coordKey] = [];
        }
        regionGroups[coordKey].push(item);
      });

      // 지역별로 하나의 마커만 생성
      Object.entries(regionGroups).forEach(([coordKey, items]) => {
        const [lat, lng] = coordKey.split(",").map(Number);
        const item = items[0]; // 첫 번째 아이템을 대표로 사용

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map: mapInstance.current,
          title: `도로공사: ${items.length}개 공사`,
          icon: {
            content: `<div style="
              background: ${items.length > 1 ? "#FF8C42" : "#FF6B35"};
              color: white;
              padding: 6px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: bold;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              max-width: 150px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">🚧 ${
              items.length > 1
                ? `${items.length}개 공사`
                : item.공사명.substring(0, 20)
            }...</div>`,
            size: new window.naver.maps.Size(150, 30),
            anchor: new window.naver.maps.Point(75, 15),
          },
        });

        // 마커 클릭 이벤트 - 지역별 모든 공사 정보 표시
        window.naver.maps.Event.addListener(marker, "click", () => {
          if (items.length > 1) {
            showRegionalRoadConstructionInfo(items);
          } else {
            showRoadConstructionInfo(item);
          }
        });

        markersRef.current.push(marker);
      });
    },
    [roadConstructionData]
  );

  // 🔥 주소에서 좌표 추출 함수 (간단한 매핑)
  const extractCoordinatesFromAddress = (
    address: string
  ): { lat: number; lng: number } | null => {
    console.log("좌표 추출 시도:", address);

    // 주요 도시별 좌표 매핑 (확장)
    const cityCoordinates: { [city: string]: { lat: number; lng: number } } = {
      // 주요 도시
      서울: { lat: 37.5665, lng: 126.978 },
      부산: { lat: 35.1796, lng: 129.0756 },
      대구: { lat: 35.8714, lng: 128.6014 },
      인천: { lat: 37.4563, lng: 126.7052 },
      광주: { lat: 35.1595, lng: 126.8526 },
      대전: { lat: 36.3504, lng: 127.3845 },
      울산: { lat: 35.5384, lng: 129.3114 },
      세종: { lat: 36.48, lng: 127.289 },

      // 도별
      경기: { lat: 37.4138, lng: 127.5183 },
      강원: { lat: 37.8228, lng: 128.1555 },
      충북: { lat: 36.8, lng: 127.7 },
      충남: { lat: 36.6, lng: 126.8 },
      전북: { lat: 35.7175, lng: 127.153 },
      전남: { lat: 34.8679, lng: 126.991 },
      경북: { lat: 36.4919, lng: 128.8889 },
      경남: { lat: 35.4606, lng: 128.2132 },
      제주: { lat: 33.4996, lng: 126.5312 },

      // 주요 도시 (약칭 포함)
      청주: { lat: 36.6351, lng: 127.4914 },
      천안: { lat: 36.8151, lng: 127.1139 },
      수원: { lat: 37.2636, lng: 127.0286 },
      성남: { lat: 37.4449, lng: 127.1389 },
      고양: { lat: 37.6584, lng: 126.832 },
      용인: { lat: 37.2411, lng: 127.1776 },
      창원: { lat: 35.2278, lng: 128.6817 },
      포항: { lat: 36.032, lng: 129.365 },
      구미: { lat: 36.1195, lng: 128.3446 },
      안산: { lat: 37.3219, lng: 126.8309 },
      안양: { lat: 37.3943, lng: 126.9568 },
      평택: { lat: 36.9921, lng: 127.1128 },
      시흥: { lat: 37.3799, lng: 126.8031 },
      김포: { lat: 37.6156, lng: 126.7158 },
      하남: { lat: 37.5392, lng: 127.2148 },
      광명: { lat: 37.4795, lng: 126.8646 },
      과천: { lat: 37.4291, lng: 126.9879 },
      의왕: { lat: 37.3447, lng: 126.9683 },
      오산: { lat: 37.1498, lng: 127.0772 },
      여주: { lat: 37.2984, lng: 127.637 },
      이천: { lat: 37.2721, lng: 127.435 },
      안성: { lat: 37.0081, lng: 127.2797 },
      양평: { lat: 37.4914, lng: 127.4874 },
      동두천: { lat: 37.9036, lng: 127.0606 },
      가평: { lat: 37.8315, lng: 127.5105 },
      연천: { lat: 38.0966, lng: 127.0747 },
      파주: { lat: 37.8154, lng: 126.7937 },
      양주: { lat: 37.7855, lng: 127.0457 },
      의정부: { lat: 37.7381, lng: 127.0337 },
      남양주: { lat: 37.6364, lng: 127.2165 },
      구리: { lat: 37.5944, lng: 127.1296 },
      경기광주: { lat: 37.4295, lng: 127.2553 }, // 경기도 광주시

      // 철도 노선 관련 키워드
      경부선: { lat: 36.8, lng: 127.7 }, // 충북 중심
      경전선: { lat: 35.4606, lng: 128.2132 }, // 경남 중심
      경의선: { lat: 37.5665, lng: 126.978 }, // 서울 중심
      경춘선: { lat: 37.8228, lng: 128.1555 }, // 강원 중심
      호남선: { lat: 35.1595, lng: 126.8526 }, // 광주 중심
      중앙선: { lat: 36.8, lng: 127.7 }, // 충북 중심
      영동선: { lat: 37.8228, lng: 128.1555 }, // 강원 중심
      충북선: { lat: 36.8, lng: 127.7 },
      충남선: { lat: 36.6, lng: 126.8 },
      전북선: { lat: 35.7175, lng: 127.153 },
      전남선: { lat: 34.8679, lng: 126.991 },
      경북선: { lat: 36.4919, lng: 128.8889 },
      경남선: { lat: 35.4606, lng: 128.2132 },
    };

    // 1. 먼저 정확한 도시명 매칭
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (address.includes(city)) {
        return coords;
      }
    }

    // 2. 철도 노선 패턴 매칭 (예: "서울~부산", "부산~마산")
    const routePatterns = [
      { pattern: /서울.*부산|부산.*서울/, coords: { lat: 36.8, lng: 127.7 } }, // 경부선 중심
      {
        pattern: /부산.*마산|마산.*부산/,
        coords: { lat: 35.4606, lng: 128.2132 },
      }, // 경남 중심
      {
        pattern: /서울.*춘천|춘천.*서울/,
        coords: { lat: 37.8228, lng: 128.1555 },
      }, // 강원 중심
      {
        pattern: /서울.*인천|인천.*서울/,
        coords: { lat: 37.4563, lng: 126.7052 },
      }, // 인천 중심
      {
        pattern: /서울.*대전|대전.*서울/,
        coords: { lat: 36.3504, lng: 127.3845 },
      }, // 대전 중심
      {
        pattern: /서울.*광주|광주.*서울/,
        coords: { lat: 35.1595, lng: 126.8526 },
      }, // 광주 중심
      {
        pattern: /서울.*대구|대구.*서울/,
        coords: { lat: 35.8714, lng: 128.6014 },
      }, // 대구 중심
      {
        pattern: /서울.*울산|울산.*서울/,
        coords: { lat: 35.5384, lng: 129.3114 },
      }, // 울산 중심
    ];

    for (const route of routePatterns) {
      if (route.pattern.test(address)) {
        return route.coords;
      }
    }

    // 3. 지역 키워드 매칭
    const regionKeywords = [
      {
        keywords: ["수도권", "경기도"],
        coords: { lat: 37.4138, lng: 127.5183 },
      },
      { keywords: ["강원도"], coords: { lat: 37.8228, lng: 128.1555 } },
      { keywords: ["충청북도"], coords: { lat: 36.8, lng: 127.7 } },
      { keywords: ["충청남도"], coords: { lat: 36.6, lng: 126.8 } },
      {
        keywords: ["전북", "전라북도"],
        coords: { lat: 35.7175, lng: 127.153 },
      },
      {
        keywords: ["전남", "전라남도"],
        coords: { lat: 34.8679, lng: 126.991 },
      },
      {
        keywords: ["경북", "경상북도"],
        coords: { lat: 36.4919, lng: 128.8889 },
      },
      {
        keywords: ["경남", "경상남도"],
        coords: { lat: 35.4606, lng: 128.2132 },
      },
      { keywords: ["제주", "제주도"], coords: { lat: 33.4996, lng: 126.5312 } },
    ];

    for (const region of regionKeywords) {
      for (const keyword of region.keywords) {
        if (address.includes(keyword)) {
          return region.coords;
        }
      }
    }

    // 4. 고속철도 관련 키워드
    if (
      address.includes("KTX") ||
      address.includes("고속철도") ||
      address.includes("고속")
    ) {
      return { lat: 36.8, lng: 127.7 }; // 충북 중심 (경부선)
    }

    // 5. 광역철도 관련 키워드
    if (
      address.includes("광역철도") ||
      address.includes("지하철") ||
      address.includes("전철")
    ) {
      return { lat: 37.5665, lng: 126.978 }; // 서울 중심
    }

    // 6. 화물철도 관련 키워드
    if (address.includes("화물") || address.includes("freight")) {
      return { lat: 35.1796, lng: 129.0756 }; // 부산 중심 (항만 연계)
    }

    // 좌표를 못 찾으면 임시로 충북 청주시 반환 (기존과 동일)
    console.log(`좌표를 찾을 수 없음: ${address}`);
    return { lat: 36.6351, lng: 127.4914 };
  };

  // 🔥 도로 공사 정보 표시 함수
  const showRoadConstructionInfo = (item: RoadConstructionInfo) => {
    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding: 15px; max-width: 300px; position: relative;">
          <button id="closeBtn" 
                  style="position: absolute; top: 5px; right: 5px; background: #FF6B35; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">
            ×
          </button>
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px; padding-right: 25px;">${
            item.공사명
          }</h3>
          <div style="font-size: 12px; line-height: 1.4;">
            <p><strong>발주청:</strong> ${item.발주청}</p>
            <p><strong>공사구분:</strong> ${item.공사구분}</p>
            <p><strong>주요사업지:</strong> ${item.주요사업지}</p>
            <p><strong>사업개요:</strong> ${item.사업개요}</p>
            <p><strong>노선명:</strong> ${item.노선명}</p>
            <p><strong>시공사:</strong> ${item.시공사}</p>
            <p><strong>시작일:</strong> ${item.시작일 || "미정"}</p>
            <p><strong>준공일:</strong> ${item.준공일 || "미정"}</p>
            <p><strong>도급액:</strong> ${
              item["도급액(원)"]
                ? parseInt(
                    item["도급액(원)"].replace(/[^\d]/g, "")
                  ).toLocaleString() + "원"
                : "미정"
            }</p>
          </div>
        </div>
      `,
      maxWidth: 350,
      backgroundColor: "#fff",
      borderColor: "#FF6B35",
      borderWidth: 2,
      anchorSize: new window.naver.maps.Size(20, 20),
      anchorColor: "#fff",
      pixelOffset: new window.naver.maps.Point(0, -10),
    });

    // 마커 위치에 정보창 표시
    const coordinates = extractCoordinatesFromAddress(
      item.현장주소 || item.주요사업지
    );
    if (coordinates && mapInstance.current) {
      infoWindow.open(
        mapInstance.current,
        new window.naver.maps.LatLng(coordinates.lat, coordinates.lng)
      );

      // 닫기 버튼 이벤트 리스너 추가
      setTimeout(() => {
        const closeBtn = document.getElementById("closeBtn");
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            infoWindow.close();
          });
        }
      }, 100);
    }
  };

  // 🔥 지역별 여러 도로 공사 정보 표시 함수
  const showRegionalRoadConstructionInfo = (items: RoadConstructionInfo[]) => {
    const itemsHtml = items
      .map(
        (item, index) => `
      <div style="border-bottom: 1px solid #eee; padding: 10px 0; ${
        index === items.length - 1 ? "border-bottom: none;" : ""
      }">
        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 13px;">${
          item.공사명
        }</h4>
        <div style="font-size: 11px; line-height: 1.3; color: #666;">
          <p><strong>발주청:</strong> ${item.발주청}</p>
          <p><strong>공사구분:</strong> ${item.공사구분}</p>
          <p><strong>노선명:</strong> ${item.노선명}</p>
          <p><strong>시공사:</strong> ${item.시공사}</p>
          <p><strong>도급액:</strong> ${
            item["도급액(원)"]
              ? parseInt(
                  item["도급액(원)"].replace(/[^\d]/g, "")
                ).toLocaleString() + "원"
              : "미정"
          }</p>
        </div>
      </div>
    `
      )
      .join("");

    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding: 15px; max-width: 350px; max-height: 400px; overflow-y: auto; position: relative;">
          <button id="closeRegionalBtn" 
                  style="position: absolute; top: 5px; right: 5px; background: #FF8C42; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; z-index: 1000;">
            ×
          </button>
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 15px; border-bottom: 2px solid #FF8C42; padding-bottom: 8px; padding-right: 25px;">
            🚧 ${items[0].주요사업지} 지역 공사 현황 (${items.length}개)
          </h3>
          <div style="font-size: 12px;">
            ${itemsHtml}
          </div>
        </div>
      `,
      maxWidth: 400,
      backgroundColor: "#fff",
      borderColor: "#FF8C42",
      borderWidth: 2,
      anchorSize: new window.naver.maps.Size(20, 20),
      anchorColor: "#fff",
      pixelOffset: new window.naver.maps.Point(0, -10),
    });

    // 마커 위치에 정보창 표시
    const coordinates = extractCoordinatesFromAddress(
      items[0].현장주소 || items[0].주요사업지
    );
    if (coordinates && mapInstance.current) {
      infoWindow.open(
        mapInstance.current,
        new window.naver.maps.LatLng(coordinates.lat, coordinates.lng)
      );

      // 닫기 버튼 이벤트 리스너 추가
      setTimeout(() => {
        const closeBtn = document.getElementById("closeRegionalBtn");
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            infoWindow.close();
          });
        }
      }, 100);
    }
  };

  // 🔥 도로 인프라 분석 실행 함수
  const runRoadInfrastructureAnalysis = useCallback(() => {
    const analysis = analyzeRoadInfrastructure();
    if (analysis) {
      setRoadAnalysisResult(analysis);
      setShowRoadAnalysis(true);
      displayRoadConstructionMarkers(analysis);
    }
  }, [analyzeRoadInfrastructure, displayRoadConstructionMarkers]);

  // 🔥 지역별 도로 인프라 분석 실행 함수
  const runRegionalRoadAnalysis = useCallback(
    (region: string) => {
      const analysis = analyzeRoadInfrastructure(region);
      if (analysis) {
        setRoadAnalysisResult(analysis);
        setShowRoadAnalysis(true);
        displayRoadConstructionMarkers(analysis);
      }
    },
    [analyzeRoadInfrastructure, displayRoadConstructionMarkers]
  );

  // 🔥 철도 데이터 로드 함수들

  // 🔥 철도 인프라 연계성 분석 함수
  const analyzeRailwayInfrastructure = useCallback(
    (region?: string) => {
      if (
        railwayIndustryData.length === 0 &&
        highSpeedRailwayData.length === 0 &&
        metropolitanRailwayData.length === 0 &&
        generalRailwayData.length === 0 &&
        railwayConstructionData.length === 0
      ) {
        return null;
      }

      let totalProjects = 0;
      let totalLength = 0;
      let highSpeedRailways = 0;
      let metropolitanRailways = 0;
      let generalRailways = 0;
      let freightRailways = 0;
      const regionalDistribution: { [region: string]: number } = {};

      // 철도산업 사업현황 분석
      railwayIndustryData.forEach((item) => {
        totalProjects++;
        if (
          item.화물여부?.includes("화물") ||
          item.화물여부?.includes("freight")
        ) {
          freightRailways++;
        }

        // 지역별 분포
        const region = item.사업명?.split(" ")[0] || "기타";
        regionalDistribution[region] = (regionalDistribution[region] || 0) + 1;
      });

      // 고속철도 분석
      highSpeedRailwayData.forEach((item) => {
        totalProjects++;
        highSpeedRailways++;
        const length = parseFloat(item.연장?.replace(/[^\d.]/g, "") || "0");
        totalLength += length;
      });

      // 광역철도 분석
      metropolitanRailwayData.forEach((item) => {
        totalProjects++;
        metropolitanRailways++;
        const length = parseFloat(item.연장?.replace(/[^\d.]/g, "") || "0");
        totalLength += length;
      });

      // 일반철도 분석
      generalRailwayData.forEach((item) => {
        totalProjects++;
        generalRailways++;
        const length = parseFloat(item.연장?.replace(/[^\d.]/g, "") || "0");
        totalLength += length;
      });

      // 철도건설현황 분석
      let completedProjects = 0;
      railwayConstructionData.forEach((item) => {
        if (item.사업단계?.includes("완공") || item.진행률 === "100%") {
          completedProjects++;
        }
      });

      const completionRate =
        totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

      // 연결성 점수 계산 (고속철도 + 광역철도 비율)
      const connectivityScore =
        totalProjects > 0
          ? ((highSpeedRailways + metropolitanRailways) / totalProjects) * 100
          : 0;

      // 권장사항 생성
      const recommendations: string[] = [];

      if (highSpeedRailways < 5) {
        recommendations.push("고속철도 네트워크 확장 필요");
      }
      if (metropolitanRailways < 10) {
        recommendations.push("광역철도 연결성 강화 필요");
      }
      if (freightRailways < 3) {
        recommendations.push("화물철도 인프라 확충 필요");
      }
      if (completionRate < 70) {
        recommendations.push("철도 공사 완공률 향상 필요");
      }

      return {
        totalProjects,
        totalLength: Math.round(totalLength * 100) / 100,
        highSpeedRailways,
        metropolitanRailways,
        generalRailways,
        freightRailways,
        regionalDistribution,
        completionRate: Math.round(completionRate * 100) / 100,
        connectivityScore: Math.round(connectivityScore * 100) / 100,
        recommendations,
      };
    },
    [
      railwayIndustryData,
      highSpeedRailwayData,
      metropolitanRailwayData,
      generalRailwayData,
      railwayConstructionData,
    ]
  );

  // 🔥 철도 데이터 마커 표시 함수
  const displayRailwayMarkers = useCallback(
    (analysis: RailwayInfrastructureAnalysis) => {
      if (!mapInstance.current) return;

      console.log("철도 마커 표시 시작");
      console.log("철도산업 데이터:", railwayIndustryData.length);
      console.log("고속철도 데이터:", highSpeedRailwayData.length);
      console.log("광역철도 데이터:", metropolitanRailwayData.length);
      console.log("일반철도 데이터:", generalRailwayData.length);
      console.log("철도건설 데이터:", railwayConstructionData.length);

      // 기존 철도 마커 제거
      const existingMarkers = markersRef.current.filter((marker) => {
        return (
          (marker as ExtendedMarker).getTitle &&
          (marker as ExtendedMarker).getTitle().includes("철도")
        );
      });
      existingMarkers.forEach((marker) =>
        (marker as ExtendedMarker).setMap(null)
      );

      // 철도 마커 추가
      const addRailwayMarker = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any,
        title: string,
        type: string,
        color: string
      ) => {
        // 데이터의 모든 키를 확인
        console.log(`데이터 키 확인 - ${type}:`, Object.keys(data));
        console.log(`데이터 값 확인 - ${type}:`, data);

        // 실제 데이터의 필드명 사용 (한글 인코딩 문제 고려)
        const businessName =
          data.사업명 || data["사업명"] || Object.values(data)[1] || "";
        const routeName = data.노선명 || data["노선명"] || "";

        // title이 undefined인 경우 businessName 사용
        const markerTitle = title || businessName || type;

        console.log(`필드 추출 결과 - ${type}:`, {
          businessName,
          routeName,
          markerTitle,
          rawData: data,
        });

        if (!businessName && !routeName) {
          console.log("사업명과 노선명이 없음:", data);
          return;
        }

        // 주소에서 좌표 추출 (간단한 매핑)
        const address = businessName || routeName || "";
        console.log(`마커 생성 시도 - ${type}:`, {
          markerTitle,
          address,
          businessName,
          routeName,
        });

        const coordinates = extractCoordinatesFromAddress(address);
        console.log(`좌표 추출 결과 - ${type}:`, coordinates);

        if (!coordinates) {
          console.log(`좌표 추출 실패 - ${type}:`, address);
          return;
        }

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            coordinates.lat,
            coordinates.lng
          ),
          map: mapInstance.current,
          title: `철도: ${markerTitle}`,
          icon: {
            content: `<div style="
              background: ${color};
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">🚄 ${type}</div>`,
            size: new window.naver.maps.Size(50, 20),
            anchor: new window.naver.maps.Point(25, 10),
          },
        });

        console.log(`마커 생성 성공 - ${type}:`, {
          markerTitle,
          coordinates,
          color,
          marker: marker,
        });

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, "click", () => {
          const infoWindow = new window.naver.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 300px;">
                <h3 style="margin: 0 0 8px 0; color: #2563eb;">🚄 ${type}</h3>
                <p style="margin: 4px 0;"><strong>사업명:</strong> ${
                  businessName || "정보 없음"
                }</p>
                <p style="margin: 4px 0;"><strong>노선명:</strong> ${
                  routeName || "정보 없음"
                }</p>
                <p style="margin: 4px 0;"><strong>완료일:</strong> ${
                  data.사업완료일 ||
                  data["사업완료일(예정일)"] ||
                  Object.values(data)[2] ||
                  "정보 없음"
                }</p>
                <p style="margin: 4px 0;"><strong>투자금액:</strong> ${
                  data.투자금액 ||
                  data["투자금액"] ||
                  Object.values(data)[3] ||
                  "정보 없음"
                }</p>
              </div>
            `,
            maxWidth: 350,
            backgroundColor: "#ffffff",
            borderColor: "#2563eb",
            borderWidth: 2,
            anchorSize: new window.naver.maps.Size(10, 10),
            anchorColor: "#ffffff",
            pixelOffset: new window.naver.maps.Point(0, -10),
          });

          infoWindow.open(mapInstance.current, marker);
        });

        markersRef.current.push(marker);
        console.log(`마커 추가 완료 - ${type}:`, markerTitle);

        // 마커가 실제로 지도에 추가되었는지 확인
        setTimeout(() => {
          const markerPosition = (marker as ExtendedMarker).getPosition();
          console.log(`마커 위치 확인 - ${type}:`, {
            markerTitle,
            position: markerPosition,
            isOnMap:
              (marker as ExtendedMarker).getMap() === mapInstance.current,
          });
        }, 100);
      };

      // 철도산업 사업현황 마커 추가
      railwayIndustryData.forEach((item) => {
        addRailwayMarker(item, item.사업명, "철도산업", "#FF8C42");
      });

      // 고속철도 마커 추가
      highSpeedRailwayData.forEach((item) => {
        addRailwayMarker(item, item.사업명, "고속철도", "#FF6B6B");
      });

      // 광역철도 마커 추가
      metropolitanRailwayData.forEach((item) => {
        addRailwayMarker(item, item.사업명, "광역철도", "#4ECDC4");
      });

      // 일반철도 마커 추가
      generalRailwayData.forEach((item) => {
        addRailwayMarker(item, item.노선명, "일반철도", "#45B7D1");
      });

      // 철도건설현황 마커 추가
      railwayConstructionData.forEach((item) => {
        addRailwayMarker(item, item.사업명, "철도건설", "#96CEB4");
      });

      console.log("철도 마커 표시 완료");
    },
    [
      railwayIndustryData,
      highSpeedRailwayData,
      metropolitanRailwayData,
      generalRailwayData,
      railwayConstructionData,
    ]
  );

  // 🔥 철도 정보 표시 함수
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showRailwayInfo = (item: any, type: string) => {
    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding: 15px; max-width: 300px;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">${
            item.사업명 || item.노선명
          }</h3>
          <div style="font-size: 12px; line-height: 1.4;">
            <p><strong>유형:</strong> ${type}</p>
            ${
              item.사업구간
                ? `<p><strong>구간:</strong> ${item.사업구간}</p>`
                : ""
            }
            ${
              item.사업내용
                ? `<p><strong>내용:</strong> ${item.사업내용}</p>`
                : ""
            }
            ${item.연장 ? `<p><strong>연장:</strong> ${item.연장}</p>` : ""}
            ${
              item.추진단계
                ? `<p><strong>추진단계:</strong> ${item.추진단계}</p>`
                : ""
            }
            ${
              item.진행률
                ? `<p><strong>진행률:</strong> ${item.진행률}</p>`
                : ""
            }
            ${
              item.사업단계
                ? `<p><strong>사업단계:</strong> ${item.사업단계}</p>`
                : ""
            }
            ${
              item.착공일
                ? `<p><strong>착공일:</strong> ${item.착공일}</p>`
                : ""
            }
            ${
              item.완공일
                ? `<p><strong>완공일:</strong> ${item.완공일}</p>`
                : ""
            }
          </div>
        </div>
      `,
      maxWidth: 350,
      backgroundColor: "#fff",
      borderColor: "#4ECDC4",
      borderWidth: 2,
      anchorSize: new window.naver.maps.Size(20, 20),
      anchorColor: "#fff",
      pixelOffset: new window.naver.maps.Point(0, -10),
    });

    // 마커 위치에 정보창 표시
    const coordinates = extractCoordinatesFromAddress(
      item.사업구간 || item.사업명 || item.노선명 || ""
    );
    if (coordinates && mapInstance.current) {
      infoWindow.open(
        mapInstance.current,
        new window.naver.maps.LatLng(coordinates.lat, coordinates.lng)
      );
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

          {/* 🔥 도로 인프라 분석 버튼 추가 */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={runRoadInfrastructureAnalysis}
              size="sm"
              variant="outline"
              className="text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              disabled={isLoadingRoadData}
            >
              {isLoadingRoadData ? (
                <span className="animate-spin mr-1">🔄</span>
              ) : (
                <span className="mr-1">🚧</span>
              )}
              도로 인프라 분석
            </Button>

            {/* 🔥 철도 인프라 분석 버튼 */}
            <Button
              onClick={() => {
                const result = analyzeRailwayInfrastructure();
                setRailwayAnalysisResult(result);
                setShowRailwayAnalysis(true);
                if (result) {
                  displayRailwayMarkers(result);
                }
              }}
              size="sm"
              variant="outline"
              className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              disabled={
                isLoadingRailwayData ||
                (railwayIndustryData.length === 0 &&
                  highSpeedRailwayData.length === 0 &&
                  metropolitanRailwayData.length === 0 &&
                  generalRailwayData.length === 0 &&
                  railwayConstructionData.length === 0)
              }
            >
              {isLoadingRailwayData ? (
                <span className="animate-spin mr-1">🔄</span>
              ) : (
                <span className="mr-1">🚂</span>
              )}
              철도 인프라 분석
            </Button>
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
              <Legend color="orange-500" label="도로공사" />
            </div>
          </div>

          {/* 🔥 도로 인프라 분석 결과 오버레이 */}
          {showRoadAnalysis && roadAnalysisResult && (
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-md border border-orange-200 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-sm mb-3 text-orange-800 flex items-center">
                🚧 도로 인프라 연계성 분석
                <Button
                  onClick={() => setShowRoadAnalysis(false)}
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-xs"
                >
                  ✕
                </Button>
              </h4>
              <div className="space-y-3 text-xs">
                {/* 기본 통계 */}
                <div className="bg-orange-50 p-2 rounded">
                  <div className="font-medium text-orange-800 mb-1">
                    기본 통계
                  </div>
                  <div className="space-y-1 text-orange-700">
                    <div>
                      총 공사 수: {roadAnalysisResult.constructionCount}건
                    </div>
                    <div>
                      총 예산:{" "}
                      {(roadAnalysisResult.totalBudget / 1000000000).toFixed(1)}
                      억원
                    </div>
                    <div>
                      완공률: {roadAnalysisResult.completionRate.toFixed(1)}%
                    </div>
                    <div>
                      영향도 점수: {roadAnalysisResult.impactScore.toFixed(1)}
                      /100
                    </div>
                  </div>
                </div>

                {/* 진행 상황 */}
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-medium text-blue-800 mb-1">
                    진행 상황
                  </div>
                  <div className="space-y-1 text-blue-700">
                    <div>
                      완료: {roadAnalysisResult.timelineAnalysis.completed}건
                    </div>
                    <div>
                      진행중: {roadAnalysisResult.timelineAnalysis.ongoing}건
                    </div>
                    <div>
                      계획: {roadAnalysisResult.timelineAnalysis.planned}건
                    </div>
                  </div>
                </div>

                {/* 지역별 분포 */}
                <div className="bg-green-50 p-2 rounded">
                  <div className="font-medium text-green-800 mb-1">
                    주요 지역
                  </div>
                  <div className="space-y-1 text-green-700">
                    {Object.entries(roadAnalysisResult.regionalDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([region, count]) => (
                        <div key={region}>
                          {region}: {count}건
                        </div>
                      ))}
                  </div>
                </div>

                {/* 권장사항 */}
                {roadAnalysisResult.recommendations.length > 0 && (
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="font-medium text-yellow-800 mb-1">
                      권장사항
                    </div>
                    <div className="space-y-1 text-yellow-700">
                      {roadAnalysisResult.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🔥 철도 인프라 분석 결과 오버레이 */}
          {showRailwayAnalysis && railwayAnalysisResult && (
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-md border border-blue-200 max-h-96 overflow-y-auto z-20">
              <h4 className="font-semibold text-sm mb-3 text-blue-800 flex items-center">
                🚄 철도 인프라 연계성 분석
                <Button
                  onClick={() => setShowRailwayAnalysis(false)}
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-xs"
                >
                  ✕
                </Button>
              </h4>
              <div className="space-y-3 text-xs">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="font-medium text-blue-800 mb-1">
                    기본 통계
                  </div>
                  <div className="space-y-1 text-blue-700">
                    <div>
                      총 사업 수: {railwayAnalysisResult.totalProjects}건
                    </div>
                    <div>총 연장: {railwayAnalysisResult.totalLength} km</div>
                    <div>완공률: {railwayAnalysisResult.completionRate}%</div>
                    <div>
                      연결성 점수: {railwayAnalysisResult.connectivityScore}/100
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <div className="font-medium text-green-800 mb-1">
                    유형별 분포
                  </div>
                  <div className="space-y-1 text-green-700">
                    <div>
                      고속철도: {railwayAnalysisResult.highSpeedRailways}건
                    </div>
                    <div>
                      광역철도: {railwayAnalysisResult.metropolitanRailways}건
                    </div>
                    <div>
                      일반철도: {railwayAnalysisResult.generalRailways}건
                    </div>
                    <div>
                      화물철도: {railwayAnalysisResult.freightRailways}건
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="font-medium text-yellow-800 mb-1">
                    주요 지역
                  </div>
                  <div className="space-y-1 text-yellow-700">
                    {Object.entries(railwayAnalysisResult.regionalDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([region, count]) => (
                        <div key={region}>
                          {region}: {count}건
                        </div>
                      ))}
                  </div>
                </div>
                {railwayAnalysisResult.recommendations.length > 0 && (
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="font-medium text-purple-800 mb-1">
                      권장사항
                    </div>
                    <div className="space-y-1 text-purple-700">
                      {railwayAnalysisResult.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
