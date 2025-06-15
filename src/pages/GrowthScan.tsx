import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  Building2,
  DollarSign,
  Car,
  Train,
  Plane,
  Ship,
  FileText,
  Zap,
  Route,
  Calendar,
  BarChart3,
  Network,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { mockGrowthData, mockIndustrialComplexes } from "@/data/mockData";
import Layout from "@/components/Layout";
import MapHeatmap from "@/components/MapHeatmap";

interface Region {
  id?: string;
  region?: string;
  name?: string;
  currentScore?: number;
  predictedScore?: number;
  employmentGrowth?: number;
  investmentGrowth?: number;
  weightedAccessibility?: number;
  logisticsCost?: number;
  accessibilityBreakdown?: {
    highway: number;
    railway: number;
    airport: number;
    port: number;
  };
}

interface Complex {
  id: string;
  name: string;
  location: string;
  totalCompanies: number;
  accessibilityBreakdown?: {
    highway: number;
    railway: number;
    airport: number;
    port: number;
  };
  accessibilityScore?: {
    highway: number;
    railway: number;
    airport: number;
    port: number;
  };
}

const GrowthScan = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [predictionYears, setPredictionYears] = useState<number>(3);
  const [simulationMode, setSimulationMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>("");

  const industries = [
    { value: "biotech", label: "바이오/제약", ksic: "21" },
    { value: "it", label: "IT/소프트웨어", ksic: "58" },
    { value: "semiconductor", label: "반도체/전자", ksic: "26" },
    { value: "automotive", label: "자동차부품", ksic: "29" },
    { value: "machinery", label: "기계/정밀", ksic: "28" },
    { value: "steel", label: "철강/금속", ksic: "24" },
    { value: "cement", label: "시멘트/건자재", ksic: "23" },
  ];

  const scenarios = [
    {
      id: "osong-rail",
      name: "오송역 철도물류 허브화",
      description: "오송역 중심 철도 물류 네트워크 강화",
      impact: "철도 점수 +25%",
      affected: ["청주시 흥덕구", "진천군"],
    },
    {
      id: "danyang-highway",
      name: "단양~세종 고속도로 개통",
      description: "단양-세종간 신규 고속도로 건설",
      impact: "고속도로 점수 +40%",
      affected: ["제천시", "단양군", "세종시"],
    },
  ];

  const timeframeLabels = {
    "1year": "1년 후",
    "3year": "3년 후",
    "5year": "5년 후",
  };

  // 업종별 교통 접근성 가중치 (더미 데이터)
  const getTransportationWeights = (industry: string) => {
    const weights = {
      biotech: { highway: 70, railway: 80, airport: 90, port: 60 },
      it: { highway: 60, railway: 70, airport: 95, port: 40 },
      semiconductor: { highway: 85, railway: 70, airport: 85, port: 75 },
      automotive: { highway: 90, railway: 85, airport: 60, port: 70 },
      machinery: { highway: 85, railway: 80, airport: 70, port: 75 },
      steel: { highway: 80, railway: 95, airport: 50, port: 90 },
      cement: { highway: 95, railway: 90, airport: 40, port: 85 },
    };
    return (
      weights[industry as keyof typeof weights] || {
        highway: 70,
        railway: 70,
        airport: 70,
        port: 70,
      }
    );
  };

  // 산업단지별 교통 접근성 점수 (더미 데이터)
  const getAccessibilityScores = (complexId: string) => {
    const scores = {
      "1": { highway: 92, railway: 85, airport: 78, port: 65 },
      "2": { highway: 88, railway: 90, airport: 82, port: 70 },
      "3": { highway: 85, railway: 75, airport: 60, port: 55 },
      "4": { highway: 78, railway: 65, airport: 55, port: 45 },
      "5": { highway: 70, railway: 60, airport: 45, port: 40 },
    };
    return (
      scores[complexId as keyof typeof scores] || {
        highway: 70,
        railway: 70,
        airport: 70,
        port: 70,
      }
    );
  };

  // 물류비용 계산 (더미 로직)
  const calculateLogisticsCost = (complex: Complex, industry: string) => {
    const weights = getTransportationWeights(industry);
    const scores = getAccessibilityScores(complex.id);

    const weightedScore =
      (scores.highway * weights.highway +
        scores.railway * weights.railway +
        scores.airport * weights.airport +
        scores.port * weights.port) /
      (weights.highway + weights.railway + weights.airport + weights.port);

    // 점수가 높을수록 물류비 낮음
    const baseCost = 120000000; // 기본 연간 물류비 (1억 2천만원)
    const costReduction = ((weightedScore - 50) / 50) * 0.3; // 최대 30% 절감
    return Math.max(baseCost * (1 - costReduction), baseCost * 0.7);
  };

  const getRecommendedComplexes = () => {
    if (!selectedIndustry) return [];

    return mockIndustrialComplexes
      .map((complex) => {
        const accessibilityScores = getAccessibilityScores(complex.id);
        const weights = getTransportationWeights(selectedIndustry);

        // 업종별 가중 접근성 점수 계산
        const weightedAccessibility =
          (accessibilityScores.highway * weights.highway +
            accessibilityScores.railway * weights.railway +
            accessibilityScores.airport * weights.airport +
            accessibilityScores.port * weights.port) /
          (weights.highway + weights.railway + weights.airport + weights.port);

        const logisticsCost = calculateLogisticsCost(complex, selectedIndustry);

        return {
          ...complex,
          weightedAccessibility: Math.round(weightedAccessibility),
          logisticsCost: Math.round(logisticsCost),
          accessibilityBreakdown: accessibilityScores,
        };
      })
      .sort((a, b) => b.weightedAccessibility - a.weightedAccessibility);
  };

  const recommendedComplexes = getRecommendedComplexes();

  // 레이더 차트 데이터
  const getRadarData = (complex: Region) => {
    if (!complex) return [];

    return [
      {
        subject: "고속도로",
        A: complex.accessibilityBreakdown?.highway,
        fullMark: 100,
      },
      {
        subject: "철도",
        A: complex.accessibilityBreakdown?.railway,
        fullMark: 100,
      },
      {
        subject: "공항",
        A: complex.accessibilityBreakdown?.airport,
        fullMark: 100,
      },
      {
        subject: "항만",
        A: complex.accessibilityBreakdown?.port,
        fullMark: 100,
      },
    ];
  };

  const getGrowthColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-blue-600 bg-blue-100";
    return "text-yellow-600 bg-yellow-100";
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            지역별 산업 성장 예측
          </h1>
          <p className="text-gray-600">
            업종별 입지 경쟁력 평가 및 교통 접근성 기반 최적 입지 분석
          </p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>2025년 6월 13일 기준 충북 교통·물류 상황</span>
          </div>
        </div>

        {/* 업종 선택 및 시뮬레이션 설정 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="industry">분석 업종</Label>
                <Select
                  value={selectedIndustry}
                  onValueChange={setSelectedIndustry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="업종을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label} (KSIC {industry.ksic})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="predictionYears">예측 기간</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    id="predictionYears"
                    min={0}
                    max={5}
                    step={1}
                    value={[predictionYears]}
                    onValueChange={(value) => setPredictionYears(value[0])}
                    className="w-full"
                  />
                  <span className="text-sm font-medium min-w-[60px]">
                    {predictionYears}년 후
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 시뮬레이션 시나리오 정보 */}
        {simulationMode && activeScenario && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    {scenarios.find((s) => s.id === activeScenario)?.name}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {
                      scenarios.find((s) => s.id === activeScenario)
                        ?.description
                    }
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {scenarios.find((s) => s.id === activeScenario)?.impact}
                    </Badge>
                    <span className="text-xs text-blue-600">
                      영향지역:{" "}
                      {scenarios
                        .find((s) => s.id === activeScenario)
                        ?.affected.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 분석 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 지도와 시나리오 컨테이너 */}
            <div className="relative">
              {/* 시나리오 선택 카드 - 지도 좌측에 오버레이 */}
              <div className="absolute left-4 top-4 z-10 w-80">
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-sm">
                      <Zap className="w-4 h-4 mr-2 text-blue-600" />
                      시나리오 선택
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          activeScenario === scenario.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setActiveScenario(scenario.id)}
                      >
                        <div className="flex items-start space-x-2">
                          <div
                            className={`p-1.5 rounded-full ${
                              activeScenario === scenario.id
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <Zap
                              className={`w-3 h-3 ${
                                activeScenario === scenario.id
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm text-gray-900">
                              {scenario.name}
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {scenario.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1.5">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  activeScenario === scenario.id
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {scenario.impact}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {scenario.affected.join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* 지도 */}
              <MapHeatmap
                data={mockGrowthData.map((region) => ({
                  region: region.region,
                  lat: region.lat,
                  lng: region.lng,
                  score: region.predictedScore,
                }))}
                onRegionClick={(region) => {
                  const selectedRegion = mockGrowthData.find(
                    (r) => r.region === region
                  );
                  if (selectedRegion) {
                    setSelectedRegion(selectedRegion);
                  }
                }}
              />
            </div>

            {/* 업종별 수송경로 분석 */}
            {selectedIndustry && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Route className="w-5 h-5 mr-2 text-purple-600" />
                    {
                      industries.find((i) => i.value === selectedIndustry)
                        ?.label
                    }{" "}
                    대표 수송경로 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                          주요 원자재 수송
                        </h4>
                        <div className="space-y-1 text-blue-700">
                          {selectedIndustry === "cement" && (
                            <>
                              <p>• 석회석: 단양 → 제천 (철도 95%)</p>
                              <p>• 석탄: 인천항 → 제천 (트럭)</p>
                            </>
                          )}
                          {selectedIndustry === "steel" && (
                            <>
                              <p>• 철광석: 인천항 → 청주 (철도)</p>
                              <p>• 코크스: 광양항 → 청주 (철도)</p>
                            </>
                          )}
                          {selectedIndustry === "semiconductor" && (
                            <>
                              <p>• 실리콘웨이퍼: 인천공항 → 청주</p>
                              <p>• 화학원료: 인천항 → 음성</p>
                            </>
                          )}
                          {!["cement", "steel", "semiconductor"].includes(
                            selectedIndustry
                          ) && (
                            <>
                              <p>• 주요 원자재: 인천항/공항</p>
                              <p>• 부품: 서울/경기 → 충북</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">
                          완제품 출하
                        </h4>
                        <div className="space-y-1 text-green-700">
                          <p>• 국내: 고속도로 (70%)</p>
                          <p>• 수출: 인천공항/항 (85%)</p>
                          <p>• 중국: 인천항 (해운)</p>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">
                          물류비 절감 포인트
                        </h4>
                        <div className="space-y-1 text-yellow-700">
                          <p>• 철도 접근성 +10% → 5% 절감</p>
                          <p>• 고속도로 접근성 +10% → 3% 절감</p>
                          <p>• 복합 운송 활용 → 8% 절감</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 선택된 지역/산업단지 상세 정보 */}
            {selectedRegion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    {selectedRegion.name || selectedRegion.region} 상세 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 교통 접근성 분석 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      교통 접근성 분석
                    </h3>
                    <div className="flex gap-6">
                      {/* 레이더 차트 */}
                      <div className="w-1/2">
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={getRadarData(selectedRegion)}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                              name="접근성"
                              dataKey="A"
                              stroke="#3B82F6"
                              fill="#3B82F6"
                              fillOpacity={0.3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* 접근성 점수 및 물류비 */}
                      <div className="w-1/2 space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              종합 접근성 점수
                            </span>
                            <span className="font-semibold text-lg">
                              {selectedRegion.weightedAccessibility}/100
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              예상 연간 물류비
                            </span>
                            <span className="font-semibold text-lg text-green-600">
                              {(
                                selectedRegion.logisticsCost / 100000000
                              ).toFixed(1)}
                              억원
                            </span>
                          </div>
                        </div>

                        {/* 성장 점수 */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              현재 성장 점수
                            </span>
                            <span className="font-semibold text-lg">
                              {selectedRegion.currentScore}/10
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              예측 성장 점수
                            </span>
                            <span className="font-semibold text-lg text-blue-600">
                              {selectedRegion.predictedScore}/10
                            </span>
                          </div>
                        </div>

                        {/* 성장 동력 */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            성장 동력
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2 text-blue-500" />
                                <span className="text-sm text-gray-600">
                                  고용 증가율
                                </span>
                              </div>
                              <span className="font-medium text-green-600">
                                +{selectedRegion.employmentGrowth}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                                <span className="text-sm text-gray-600">
                                  투자 증가율
                                </span>
                              </div>
                              <span className="font-medium text-green-600">
                                +{selectedRegion.investmentGrowth}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 업종별 물류비 절감 방안 */}
            {selectedIndustry && (
              <Card>
                <CardHeader>
                  <CardTitle>물류비 절감 전략</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">
                      추천 전략
                    </h4>
                    <div className="space-y-1 text-green-700">
                      {selectedIndustry === "cement" && (
                        <>
                          <p>• 철도 수송 비율 확대</p>
                          <p>• 석회석 광산 인근 입지</p>
                        </>
                      )}
                      {selectedIndustry === "steel" && (
                        <>
                          <p>• 항만-철도 복합 운송</p>
                          <p>• 원자재 저장시설 공동 활용</p>
                        </>
                      )}
                      {selectedIndustry === "semiconductor" && (
                        <>
                          <p>• 공항 접근성 최우선</p>
                          <p>• 클린룸 공동 인프라</p>
                        </>
                      )}
                      {!["cement", "steel", "semiconductor"].includes(
                        selectedIndustry
                      ) && (
                        <>
                          <p>• 복합 운송 네트워크 활용</p>
                          <p>• 공동 물류센터 구축</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">예상 절감율</span>
                    <span className="font-medium text-green-600">12-18%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI 예측 모델 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>AI 예측 모델 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">모델 정확도</span>
                  <span className="font-medium">87.4%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">데이터 기간</span>
                  <span className="font-medium">2019-2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">업데이트</span>
                  <span className="font-medium">월 1회</span>
                </div>
                <div className="border-t pt-3">
                  <h4 className="font-medium mb-2">주요 지표</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• 교통 접근성 (고속도로, 철도, 공항, 항만)</p>
                    <p>• 물류비용 최적화 지수</p>
                    <p>• 업종별 집적 효과</p>
                    <p>• 정부 정책 영향도</p>
                    <p>• 기업간 협력 네트워크</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 교통·물류 상황 요약 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Route className="w-5 h-5 mr-2 text-blue-600" />
                  충북 교통·물류 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-700">
                        고속도로 혼잡도
                      </span>
                      <Car className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">72%</div>
                    <div className="text-xs text-blue-600 mt-1">
                      전년 대비 -3%p
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-green-700">
                        철도 화물량
                      </span>
                      <Train className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-900">85%</div>
                    <div className="text-xs text-green-600 mt-1">
                      전년 대비 +5%p
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-purple-700">
                        공항 화물량
                      </span>
                      <Plane className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      68%
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      전년 대비 +2%p
                    </div>
                  </div>
                  <div className="p-4 bg-cyan-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-cyan-700">항만 화물량</span>
                      <Ship className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="text-2xl font-bold text-cyan-900">75%</div>
                    <div className="text-xs text-cyan-600 mt-1">
                      전년 대비 +4%p
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 업종별 추천 산업단지 */}
            {selectedIndustry && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                      {
                        industries.find((i) => i.value === selectedIndustry)
                          ?.label
                      }{" "}
                      최적 입지 TOP 5
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center space-x-1"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF 보고서</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendedComplexes.slice(0, 5).map((complex, index) => (
                      <div
                        key={complex.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedRegion?.id === complex.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedRegion(complex)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0
                                  ? "bg-yellow-500 text-white"
                                  : index === 1
                                  ? "bg-gray-400 text-white"
                                  : index === 2
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {complex.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {complex.location}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={getGrowthColor(
                              complex.weightedAccessibility / 10
                            )}
                          >
                            접근성 {complex.weightedAccessibility}/100
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">
                              예상 연간 물류비
                            </span>
                            <span className="font-medium text-green-600">
                              {(complex.logisticsCost / 100000000).toFixed(1)}
                              억원
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">입주기업 수</span>
                            <span className="font-medium">
                              {complex.totalCompanies}개
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                          <div className="flex items-center">
                            <Car className="w-3 h-3 mr-1 text-blue-500" />
                            <span>
                              고속도로 {complex.accessibilityBreakdown?.highway}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Train className="w-3 h-3 mr-1 text-green-500" />
                            <span>
                              철도 {complex.accessibilityBreakdown?.railway}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Plane className="w-3 h-3 mr-1 text-purple-500" />
                            <span>
                              공항 {complex.accessibilityBreakdown?.airport}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Ship className="w-3 h-3 mr-1 text-cyan-500" />
                            <span>
                              항만 {complex.accessibilityBreakdown?.port}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GrowthScan;
