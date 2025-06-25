import { useState, useCallback, useRef } from "react";
import { RouteOption, RoutePolyline, RouteData } from "../MapTypes";
import { fetchRouteFromAPI, drawRouteFromAPI } from "../MapTypes";

interface UseRouteManagementProps {
  mapInstance: React.MutableRefObject<naver.maps.Map | null>;
  routeCategories: {
    container: RouteOption[];
    cement: RouteOption[];
    steel: RouteOption[];
  };
}

export const useRouteManagement = ({ 
  mapInstance, 
  routeCategories 
}: UseRouteManagementProps) => {
  const [highlightedRoute, setHighlightedRoute] = useState<RoutePolyline | null>(null);
  const [customStart, setCustomStart] = useState<[number, number] | null>(null);
  const [customGoal, setCustomGoal] = useState<[number, number] | null>(null);
  const [customStartMarker, setCustomStartMarker] = useState<naver.maps.Marker | null>(null);
  const [customGoalMarker, setCustomGoalMarker] = useState<naver.maps.Marker | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"container" | "cement" | "steel" | null>(null);
  const [routePolylines, setRoutePolylines] = useState<RoutePolyline[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [clickedRouteData, setClickedRouteData] = useState<{
    route: RouteOption;
    data: RouteData;
  } | null>(null);
  const [currentRedRouteId, setCurrentRedRouteId] = useState<string | null>(null);
  const [routeDataCache, setRouteDataCache] = useState<{ [key: string]: RouteData }>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // useRef로 최신 상태 값 추적
  const customStartRef = useRef<[number, number] | null>(null);
  const customGoalRef = useRef<[number, number] | null>(null);

  // 커스텀 경로 그리기 함수
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

        const result = await fetchRouteFromAPI(routeOption.start, routeOption.goal, routeOption.vias);
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
          routeOption.id,
          "#FF6B6B"
        );

        if (newRoute) {
          setHighlightedRoute(newRoute);
        }
      } catch (error) {
        console.error("커스텀 경로 요청 실패:", error);
      }
    },
    [highlightedRoute, mapInstance]
  );

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
  const handleRouteClick = useCallback(async (route: RouteOption, routeData: RouteData) => {
    if (!mapInstance.current) return;

    setIsLoadingRoute(true);

    try {
      // 기존 빨간색 경로 제거 완료 대기
      await removeRedRoutesAsync();

      // React 상태 업데이트가 완전히 반영되도록 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 중복 체크: 같은 경로를 다시 선택한 경우 처리
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
        route.start, 
        route.goal, 
        route.vias
      );

      // 클릭된 경로 데이터 상태 업데이트 (즉시 업데이트하여 정보 유지)
      setClickedRouteData({
        route: route,
        data: detailedRouteData,
      });

      // 빨간색으로 강조된 경로 그리기
      const result = drawRouteFromAPI(
        mapInstance.current,
        detailedRouteData,
        route.id,
        "#FF6B6B"
      );

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
  }, [mapInstance, currentRedRouteId, routePolylines, routeDataCache, highlightedRoute]);

  // 카테고리별 모든 경로 표시 (회색으로 기본 표시)
  const handleShowCategoryRoutes = useCallback(async (
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
      // 빨간색 경로도 clickedRouteData가 없을 때만 초기화
      if (!clickedRouteData && highlightedRoute) {
        highlightedRoute.setMap(null);
        setHighlightedRoute(null);
      }

      const categoryRoutes = routeCategories[category];
      const newPolylines: RoutePolyline[] = [];
      const newCache: { [key: string]: RouteData } = {};

      // 카테고리의 모든 경로를 순차적으로 표시 (회색)
      for (const route of categoryRoutes) {
        const routeData = await fetchRouteFromAPI(
          route.start, 
          route.goal, 
          route.vias
        );

        // 캐시에 저장
        newCache[route.id] = routeData;

        const result = drawRouteFromAPI(
          mapInstance.current,
          routeData,
          route.id,
          "#9CA3AF"
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
  }, [mapInstance, routePolylines, clickedRouteData, highlightedRoute, routeDataCache, isInitialLoad, routeCategories, handleRouteClick]);

  // 단일 경로 표시
  const handleShowRoute = useCallback(async () => {
    if (!mapInstance.current || !selectedRoute) return;

    setIsLoadingRoute(true);

    try {
      // 기존 빨간색 경로 제거 완료 대기
      await removeRedRoutesAsync();

      // React 상태 업데이트가 완전히 반영되도록 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 중복 체크: 같은 경로를 다시 선택한 경우 처리
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
        selectedRoute.start, 
        selectedRoute.goal, 
        selectedRoute.vias
      );

      // 선택된 경로 데이터 상태 업데이트
      setClickedRouteData({
        route: selectedRoute,
        data: detailedRouteData,
      });

      const result = drawRouteFromAPI(
        mapInstance.current,
        detailedRouteData,
        selectedRoute.id,
        "#FF6B6B"
      );

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
  }, [mapInstance, selectedRoute, currentRedRouteId, routePolylines, routeDataCache, highlightedRoute, handleShowCategoryRoutes]);

  // 경로 초기화 함수
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

  // 상태 업데이트 시 ref 동기화
  const updateCustomStart = useCallback((start: [number, number] | null) => {
    setCustomStart(start);
    customStartRef.current = start;
  }, []);

  const updateCustomGoal = useCallback((goal: [number, number] | null) => {
    setCustomGoal(goal);
    customGoalRef.current = goal;
  }, []);

  return {
    drawCustomRoute,
    handleShowCategoryRoutes,
    handleShowRoute,
    handleRouteClick,
    removeRedRoutesAsync,
    resetCustomRoute,
    highlightedRoute,
    setHighlightedRoute,
    customStart,
    setCustomStart: updateCustomStart,
    customGoal,
    setCustomGoal: updateCustomGoal,
    customStartMarker,
    setCustomStartMarker,
    customGoalMarker,
    setCustomGoalMarker,
    selectedCategory,
    setSelectedCategory,
    routePolylines,
    setRoutePolylines,
    selectedRoute,
    setSelectedRoute,
    clickedRouteData,
    setClickedRouteData,
    currentRedRouteId,
    setCurrentRedRouteId,
    routeDataCache,
    setRouteDataCache,
    isInitialLoad,
    setIsInitialLoad,
    isLoadingRoute,
    setIsLoadingRoute,
    customStartRef,
    customGoalRef,
  };
}; 