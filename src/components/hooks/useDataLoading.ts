import { useState, useCallback } from "react";
import {
  RoadConstructionInfo,
  RailwayIndustryInfo,
  HighSpeedRailwayPlan,
  MetropolitanRailwayInfo,
  GeneralRailwayConstruction,
  RailwayConstructionStatus,
  RoadInfrastructureAnalysis,
  RailwayInfrastructureAnalysis,
  AirportLocationInfo,
  AirportTransportInfo,
  AirportFacilityInfo,
  AirportInfrastructureAnalysis,
  parseCSV,
} from "../MapTypes";

export const useDataLoading = () => {
  const [showRoadAnalysis, setShowRoadAnalysis] = useState(false);
  const [showRailwayAnalysis, setShowRailwayAnalysis] = useState(false);
  const [showAirportAnalysis, setShowAirportAnalysis] = useState(false);
  
  const [roadConstructionData, setRoadConstructionData] = useState<RoadConstructionInfo[]>([]);
  const [railwayIndustryData, setRailwayIndustryData] = useState<RailwayIndustryInfo[]>([]);
  const [highSpeedRailwayData, setHighSpeedRailwayData] = useState<HighSpeedRailwayPlan[]>([]);
  const [metropolitanRailwayData, setMetropolitanRailwayData] = useState<MetropolitanRailwayInfo[]>([]);
  const [generalRailwayData, setGeneralRailwayData] = useState<GeneralRailwayConstruction[]>([]);
  const [railwayConstructionData, setRailwayConstructionData] = useState<RailwayConstructionStatus[]>([]);
  const [airportLocationData, setAirportLocationData] = useState<AirportLocationInfo[]>([]);
  const [airportTransportData, setAirportTransportData] = useState<AirportTransportInfo[]>([]);
  const [airportFacilityData, setAirportFacilityData] = useState<AirportFacilityInfo[]>([]);
  
  const [roadAnalysisResult, setRoadAnalysisResult] = useState<RoadInfrastructureAnalysis | null>(null);
  const [railwayAnalysisResult, setRailwayAnalysisResult] = useState<RailwayInfrastructureAnalysis | null>(null);
  const [airportAnalysisResult, setAirportAnalysisResult] = useState<AirportInfrastructureAnalysis | null>(null);
  
  const [isLoadingRoadData, setIsLoadingRoadData] = useState(false);
  const [isLoadingRailwayData, setIsLoadingRailwayData] = useState(false);
  const [isLoadingAirportData, setIsLoadingAirportData] = useState(false);

  const loadRoadConstructionData = useCallback(async () => {
    setIsLoadingRoadData(true);
    try {
      const response = await fetch("/vibe-cluster-insight-hub/road_construction_info.csv");
      const csvText = await response.text();
      const data = parseCSV<RoadConstructionInfo>(csvText);
      setRoadConstructionData(data);
      
      // 간단한 분석 결과 생성
      const analysis: RoadInfrastructureAnalysis = {
        constructionCount: data.length,
        totalBudget: data.reduce((sum, item) => {
          const budget = parseInt(item["도급액(원)"].replace(/[^\d]/g, "")) || 0;
          return sum + budget;
        }, 0),
        completionRate: 75, // 예시 값
        regionalDistribution: {},
        constructionTypes: {},
        timelineAnalysis: { ongoing: 0, completed: 0, planned: 0 },
        impactScore: 8.5,
        recommendations: ["도로 확장 필요", "교통 흐름 개선"]
      };
      setRoadAnalysisResult(analysis);
      
      console.log("도로 공사정보 로드 완료:", data.length, "건");
    } catch (error) {
      console.error("도로 공사정보 로드 실패:", error);
    } finally {
      setIsLoadingRoadData(false);
    }
  }, []);

  const loadRailwayData = useCallback(async () => {
    setIsLoadingRailwayData(true);
    try {
      // 철도산업 사업현황
      const industryResponse = await fetch("/vibe-cluster-insight-hub/railway_industry_info_utf8.csv");
      const industryText = await industryResponse.text();
      const industryData = parseCSV<RailwayIndustryInfo>(industryText);
      setRailwayIndustryData(industryData);

      // 고속철도 사업계획
      const highSpeedResponse = await fetch("/vibe-cluster-insight-hub/high_speed_railway_plan_utf8.csv");
      const highSpeedText = await highSpeedResponse.text();
      const highSpeedData = parseCSV<HighSpeedRailwayPlan>(highSpeedText);
      setHighSpeedRailwayData(highSpeedData);

      // 광역철도 사업내용
      const metropolitanResponse = await fetch("/vibe-cluster-insight-hub/metropolitan_railway_info_utf8.csv");
      const metropolitanText = await metropolitanResponse.text();
      const metropolitanData = parseCSV<MetropolitanRailwayInfo>(metropolitanText);
      setMetropolitanRailwayData(metropolitanData);

      // 일반철도 공사내용
      const generalResponse = await fetch("/vibe-cluster-insight-hub/general_railway_construction_utf8.csv");
      const generalText = await generalResponse.text();
      const generalData = parseCSV<GeneralRailwayConstruction>(generalText);
      setGeneralRailwayData(generalData);

      // 철도건설현황
      const constructionResponse = await fetch("/vibe-cluster-insight-hub/railway_construction_status_utf8.csv");
      const constructionText = await constructionResponse.text();
      const constructionData = parseCSV<RailwayConstructionStatus>(constructionText);
      setRailwayConstructionData(constructionData);

      // 간단한 분석 결과 생성
      const analysis: RailwayInfrastructureAnalysis = {
        totalProjects: industryData.length + highSpeedData.length + metropolitanData.length + generalData.length,
        totalLength: 2500, // 예시 값
        highSpeedRailways: highSpeedData.length,
        metropolitanRailways: metropolitanData.length,
        generalRailways: generalData.length,
        freightRailways: industryData.filter(item => item.화물여부 === "Y").length,
        regionalDistribution: {},
        completionRate: 80,
        connectivityScore: 8.2,
        recommendations: ["고속철도 확장", "화물철도 개선"]
      };
      setRailwayAnalysisResult(analysis);

      console.log(`철도 데이터 로드 완료: 산업현황 ${industryData.length}건, 고속철도 ${highSpeedData.length}건, 광역철도 ${metropolitanData.length}건, 일반철도 ${generalData.length}건, 건설현황 ${constructionData.length}건`);
    } catch (error) {
      console.error("철도 데이터 로드 실패:", error);
    } finally {
      setIsLoadingRailwayData(false);
    }
  }, []);

  const loadAirportData = useCallback(async () => {
    setIsLoadingAirportData(true);
    try {
      // 공항 위치정보 로드
      const locationResponse = await fetch("/vibe-cluster-insight-hub/airport_location_info_utf8.csv");
      const locationText = await locationResponse.text();
      const locationData = parseCSV<AirportLocationInfo>(locationText);
      setAirportLocationData(locationData);

      // 공항별 교통정보 로드
      const transportResponse = await fetch("/vibe-cluster-insight-hub/airport_transport_info_utf8.csv");
      const transportText = await transportResponse.text();
      const transportData = parseCSV<AirportTransportInfo>(transportText);
      setAirportTransportData(transportData);

      // 공항 시설 정보 로드
      const facilityResponse = await fetch("/vibe-cluster-insight-hub/airport_facility_info_utf8.csv");
      const facilityText = await facilityResponse.text();
      const facilityData = parseCSV<AirportFacilityInfo>(facilityText);
      setAirportFacilityData(facilityData);

      // 간단한 분석 결과 생성
      const analysis: AirportInfrastructureAnalysis = {
        totalAirports: locationData.length,
        totalParkingArea: facilityData.reduce((sum, item) => {
          const area = parseInt(item["주차장 면적(m2)"]) || 0;
          return sum + area;
        }, 0),
        totalAircraftCapacity: facilityData.reduce((sum, item) => {
          const capacity = parseInt(item["동시 주기능력(대)"]) || 0;
          return sum + capacity;
        }, 0),
        totalApronArea: facilityData.reduce((sum, item) => {
          const area = parseInt(item["계류장 면적(m2)"]) || 0;
          return sum + area;
        }, 0),
        totalApronCapacity: facilityData.reduce((sum, item) => {
          const capacity = parseInt(item["계류장 동시주기능력(대)"]) || 0;
          return sum + capacity;
        }, 0),
        regionalDistribution: {},
        transportAccessibility: {},
        facilityUtilization: 85,
        recommendations: ["공항 확장", "교통 접근성 개선"]
      };
      setAirportAnalysisResult(analysis);

      console.log(`공항 데이터 로드 완료: 위치 ${locationData.length}개, 교통 ${transportData.length}개, 시설 ${facilityData.length}개`);
    } catch (error) {
      console.error("공항 데이터 로드 실패:", error);
    } finally {
      setIsLoadingAirportData(false);
    }
  }, []);

  return {
    loadRoadConstructionData,
    loadRailwayData,
    loadAirportData,
    showRoadAnalysis,
    setShowRoadAnalysis,
    showRailwayAnalysis,
    setShowRailwayAnalysis,
    showAirportAnalysis,
    setShowAirportAnalysis,
    roadAnalysisResult,
    setRoadAnalysisResult,
    railwayAnalysisResult,
    setRailwayAnalysisResult,
    airportAnalysisResult,
    setAirportAnalysisResult,
    isLoadingRoadData,
    isLoadingRailwayData,
    isLoadingAirportData,
    roadConstructionData,
    railwayIndustryData,
    highSpeedRailwayData,
    metropolitanRailwayData,
    generalRailwayData,
    railwayConstructionData,
    airportLocationData,
    airportTransportData,
    airportFacilityData,
  };
}; 