import { useCallback } from "react";
import { CargoStation, industryInfrastructureMap } from "../MapTypes";

interface UseMapInitializationProps {
  mapRef: React.RefObject<HTMLDivElement>;
  mapInstance: React.MutableRefObject<naver.maps.Map | null>;
  markersRef: React.MutableRefObject<naver.maps.Marker[]>;
  data: Array<{
    region: string;
    lat: number;
    lng: number;
    score: number;
  }>;
  onRegionClick?: (region: string) => void;
  selectedIndustry?: string;
  setCustomStart: (coord: [number, number] | null) => void;
  setCustomGoal: (coord: [number, number] | null) => void;
  setCustomStartMarker: (marker: naver.maps.Marker | null) => void;
  setCustomGoalMarker: (marker: naver.maps.Marker | null) => void;
  customStartRef: React.MutableRefObject<[number, number] | null>;
  customGoalRef: React.MutableRefObject<[number, number] | null>;
  drawCustomRoute: (start: [number, number], goal: [number, number]) => Promise<void>;
  highlightedRoute: naver.maps.Polyline | null;
  setHighlightedRoute: (route: naver.maps.Polyline | null) => void;
  setSelectedCategory: (category: "container" | "cement" | "steel" | null) => void;
  handleShowCategoryRoutes: (category: "container" | "cement" | "steel") => Promise<void>;
}

export const useMapInitialization = ({
  mapRef,
  mapInstance,
  markersRef,
  data,
  onRegionClick,
  selectedIndustry,
  setCustomStart,
  setCustomGoal,
  setCustomStartMarker,
  setCustomGoalMarker,
  customStartRef,
  customGoalRef,
  drawCustomRoute,
  highlightedRoute,
  setHighlightedRoute,
  setSelectedCategory,
  handleShowCategoryRoutes,
}: UseMapInitializationProps) => {
  const initializeMap = useCallback(() => {
    console.log("initializeMap 호출됨");
    console.log("mapRef.current:", mapRef.current);
    console.log("window.naver?.maps:", window.naver?.maps);

    if (!mapRef.current || !window.naver?.maps) {
      console.log("지도 초기화 조건 불만족");
      return;
    }

    console.log("지도 초기화 시작");
    const center = new window.naver.maps.LatLng(36.6351, 127.4914);
    const map = new window.naver.maps.Map(mapRef.current, {
      center,
      zoom: 8,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    console.log("지도 객체 생성 완료:", map);
    mapInstance.current = map;

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

    const cargoStations: CargoStation[] = [
      { name: "도담", lat: 36.988, lng: 128.417, type: "시멘트" },
      { name: "입석리", lat: 37.125, lng: 128.5, type: "시멘트" },
      { name: "쌍용", lat: 37.185, lng: 128.345, type: "시멘트" },
      { name: "삼화", lat: 37.549, lng: 129.108, type: "시멘트" },
      { name: "오봉", lat: 37.324, lng: 126.823, type: "컨테이너" },
      { name: "부산신항", lat: 35.073, lng: 128.819, type: "컨테이너" },
      { name: "청주국제공항", lat: 36.7166, lng: 127.499, type: "공항" },
      { name: "평택항", lat: 36.9852, lng: 126.8475, type: "항만" },
      { name: "군산항", lat: 35.9878, lng: 126.7166, type: "항만" },
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

    // 업종별 필터링
    const getFilteredCargoStations = () => {
      if (!selectedIndustry) return cargoStations;

      const industryKey = selectedIndustry as keyof typeof industryInfrastructureMap;
      const industryInfo = industryInfrastructureMap[industryKey];
      if (!industryInfo) return cargoStations;

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

      const industryKey = selectedIndustry as keyof typeof industryInfrastructureMap;
      const industryInfo = industryInfrastructureMap[industryKey];
      if (!industryInfo) return hubs;

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

    // 마커 생성 로직
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

      // hubs 마커 클릭 시 출발지/도착지 설정
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

      // 마커 클릭 시 출발지/도착지 설정
      window.naver.maps.Event.addListener(marker, "click", () => {
        const coord: [number, number] = [item.lat, item.lng];
        const start = customStartRef.current;
        const goal = customGoalRef.current;

        if (!start && !goal) {
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
          drawCustomRoute(start, coord);
        } else if (!start && goal) {
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
          drawCustomRoute(coord, goal);
        } else {
          const isStart = window.confirm(
            `"${item.region}"을(를) 어떻게 설정하시겠습니다?\n\n확인: 출발지로 변경\n취소: 도착지로 변경`
          );

          if (isStart) {
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
            drawCustomRoute(coord, goal);
          } else {
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

      // cargoStations 마커 클릭 시 출발지/도착지 설정
      window.naver.maps.Event.addListener(marker, "click", () => {
        const coord: [number, number] = [station.lat, station.lng];
        const start = customStartRef.current;
        const goal = customGoalRef.current;

        if (!start && !goal) {
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
          drawCustomRoute(start, coord);
        } else if (!start && goal) {
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
          drawCustomRoute(coord, goal);
        } else {
          const isStart = window.confirm(
            `"${station.name} (${station.type})"을(를) 어떻게 설정하시겠습니다?\n\n확인: 출발지로 변경\n취소: 도착지로 변경`
          );

          if (isStart) {
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
            drawCustomRoute(coord, goal);
          } else {
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
            drawCustomRoute(start, coord);
          }
        }
      });
    });

    // 역지오코딩 API
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
  }, [
    mapRef,
    mapInstance,
    markersRef,
    data,
    onRegionClick,
    selectedIndustry,
    setCustomStart,
    setCustomGoal,
    setCustomStartMarker,
    setCustomGoalMarker,
    customStartRef,
    customGoalRef,
    drawCustomRoute,
    setSelectedCategory,
    handleShowCategoryRoutes,
  ]);

  return { initializeMap };
}; 