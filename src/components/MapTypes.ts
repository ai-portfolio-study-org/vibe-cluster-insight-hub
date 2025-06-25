// 지도 관련 기본 타입들
export interface MapHeatmapProps {
  data: Array<{
    region: string;
    lat: number;
    lng: number;
    score: number;
  }>;
  onRegionClick?: (region: string) => void;
  selectedIndustry?: string;
}

// 네이버 지도 API 타입 정의
interface NaverMapsAPI {
  maps: {
    LatLng: new (lat: number, lng: number) => naver.maps.LatLng;
    Service: {
      route: (options: {
        origin: naver.maps.LatLng;
        destination: naver.maps.LatLng;
        waypoints: naver.maps.LatLng[];
        avoid: string[];
        mode: string;
        callback: (status: string, response: NaverRouteResponse) => void;
      }) => void;
      RouteMode: {
        DRIVING: string;
      };
      Status: {
        ERROR: string;
      };
    };
    Polyline: new (options: naver.maps.PolylineOptions) => naver.maps.Polyline;
    strokeStyle: {
      SOLID: string;
    };
  };
}

interface NaverRouteResponse {
  v2: {
    meta: {
      totalCount: number;
    };
    route: {
      traoptimal: Array<{
        path: Array<[number, number]>;
        summary: {
          distance: number;
          duration: number;
        };
      }>;
    };
  };
}

export interface CargoStation {
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

// 경로 관련 타입들
export interface RouteData {
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

export interface RouteOption {
  id: string;
  name: string;
  start: [number, number];
  goal: [number, number];
  vias: [number, number][];
  description: string;
  category: "container" | "cement" | "steel";
}

export interface RoutePolyline extends naver.maps.Polyline {
  routeId?: string;
}

export interface ExtendedMarker extends naver.maps.Marker {
  getTitle(): string;
  setMap(map: naver.maps.Map | null): void;
  getPosition(): naver.maps.LatLng;
  getMap(): naver.maps.Map | null;
}

// 도로 인프라 관련 타입들
export interface RoadConstructionInfo {
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

export interface RoadInfrastructureAnalysis {
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

// 철도 인프라 관련 타입들
export interface RailwayIndustryInfo {
  발주청: string;
  사업명: string;
  사업개요: string;
  추진경위: string;
  사업시작일: string;
  화물여부: string;
  투자금액: string;
}

export interface HighSpeedRailwayPlan {
  사업명: string;
  사업구간: string;
  사업내용: string;
  연장: string;
  추진단계: string;
}

export interface MetropolitanRailwayInfo {
  사업명: string;
  사업구간: string;
  사업내용: string;
  연장: string;
  추진단계: string;
}

export interface GeneralRailwayConstruction {
  노선명: string;
  사업구간: string;
  사업내용: string;
  연장: string;
  착공일: string;
  완공일: string;
}

export interface RailwayConstructionStatus {
  사업명: string;
  연장: string;
  착공일: string;
  완공일: string;
  진행률: string;
  사업단계: string;
}

export interface RailwayInfrastructureAnalysis {
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

// 공항 인프라 관련 타입들
export interface AirportLocationInfo {
  공항명: string;
  주소: string;
  위도: string;
  경도: string;
}

export interface AirportTransportInfo {
  구분: string;
  노선: string;
  "버스 종류": string;
  "노선 수": string;
  노선현황: string;
}

export interface AirportFacilityInfo {
  공항명: string;
  "주차장 면적(m2)": string;
  "동시 주기능력(대)": string;
  "계류장 면적(m2)": string;
  "계류장 동시주기능력(대)": string;
}

export interface AirportInfrastructureAnalysis {
  totalAirports: number;
  totalParkingArea: number;
  totalAircraftCapacity: number;
  totalApronArea: number;
  totalApronCapacity: number;
  regionalDistribution: { [region: string]: number };
  transportAccessibility: {
    [airport: string]: {
      busRoutes: number;
      railRoutes: number;
      totalRoutes: number;
      accessibilityScore: number;
    };
  };
  facilityUtilization: number;
  recommendations: string[];
}

// 업종별 인프라 매핑
export const industryInfrastructureMap = {
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

// 유틸리티 함수들
export const parseCSV = <T,>(csvText: string): T[] => {
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

export function samplePath(
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

// API에서 경로 정보를 가져오는 함수
export async function fetchRouteFromAPI(
  start: [number, number],
  goal: [number, number],
  vias: [number, number][] = []
): Promise<RouteData> {
  try {
    // 네이버 지도 API를 사용한 경로 검색
    const naver = (window as unknown as { naver: NaverMapsAPI }).naver;
    if (!naver) {
      throw new Error("네이버 지도 API가 로드되지 않았습니다.");
    }

    const startPoint = new naver.maps.LatLng(start[0], start[1]);
    const goalPoint = new naver.maps.LatLng(goal[0], goal[1]);
    const viaPoints = vias.map(via => new naver.maps.LatLng(via[0], via[1]));

    return new Promise((resolve, reject) => {
      naver.maps.Service.route({
        origin: startPoint,
        destination: goalPoint,
        waypoints: viaPoints,
        avoid: [],
        mode: naver.maps.Service.RouteMode.DRIVING,
        callback: (status: string, response: NaverRouteResponse) => {
          if (status === naver.maps.Service.Status.ERROR) {
            reject(new Error("경로 검색에 실패했습니다."));
            return;
          }

          if (response.v2.meta.totalCount === 0) {
            reject(new Error("경로를 찾을 수 없습니다."));
            return;
          }

          const route = response.v2.route;
          const path = route.traoptimal[0].path.map((point: [number, number]): [number, number] => [
            point[1], // lat
            point[0]  // lng
          ]);

          const routeData: RouteData = {
            path: path,
            distance: route.traoptimal[0].summary.distance,
            duration: route.traoptimal[0].summary.duration,
            isDetailed: true,
            total_distance: route.traoptimal[0].summary.distance,
            total_duration: route.traoptimal[0].summary.duration,
            route_summary: `${route.traoptimal[0].summary.distance}m, ${Math.round(route.traoptimal[0].summary.duration / 60000)}분`
          };

          resolve(routeData);
        }
      });
    });
  } catch (error) {
    console.error("경로 검색 중 오류:", error);
    throw error;
  }
}

// 지도에 경로를 그리는 함수
export function drawRouteFromAPI(
  map: naver.maps.Map,
  routeData: RouteData,
  routeId: string,
  color: string = "#FF6B6B",
  weight: number = 5
): RoutePolyline {
  const naver = (window as unknown as { naver: NaverMapsAPI }).naver;
  if (!naver) {
    throw new Error("네이버 지도 API가 로드되지 않았습니다.");
  }

  // 샘플링된 경로 생성
  const sampledPath = samplePath(routeData.path, 10);
  
  // 경로 좌표를 네이버 지도 형식으로 변환
  const path = sampledPath.map(point => 
    new naver.maps.LatLng(point[0], point[1])
  );

  // 폴리라인 생성
  const polyline = new naver.maps.Polyline({
    path: path,
    strokeColor: color,
    strokeWeight: weight,
    strokeOpacity: 0.8,
    strokeStyle: naver.maps.strokeStyle.SOLID as naver.maps.StrokeStyleType,
    map: map
  }) as RoutePolyline;

  // 경로 ID 설정
  polyline.routeId = routeId;

  return polyline;
} 