import { useState } from "react";
import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Car,
  TrendingUp,
  Building2,
  Factory,
  Play,
  Download,
  BarChart3,
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
} from "recharts";

// 더미 데이터
const scenarios = [
  { id: 1, name: "청주 테크밸리 확장", status: "완료", date: "2024-01-15" },
  {
    id: 2,
    name: "음성 스마트팩토리 단지",
    status: "진행중",
    date: "2024-01-20",
  },
  { id: 3, name: "진천 바이오메디컬 허브", status: "대기", date: "2024-01-25" },
];

const simulationResults = {
  employment: [
    { year: "2024", before: 15000, after: 15000 },
    { year: "2025", before: 15500, after: 18200 },
    { year: "2026", before: 16000, after: 21800 },
    { year: "2027", before: 16500, after: 25500 },
  ],
  traffic: [
    { time: "06:00", congestion: 25, newCongestion: 35 },
    { time: "08:00", congestion: 85, newCongestion: 95 },
    { time: "12:00", congestion: 60, newCongestion: 70 },
    { time: "18:00", congestion: 90, newCongestion: 88 },
    { time: "22:00", congestion: 30, newCongestion: 35 },
  ],
  economics: [
    { metric: "지역 GDP", current: 100, predicted: 125, unit: "%" },
    { metric: "세수입", current: 100, predicted: 118, unit: "%" },
    { metric: "인구 유입", current: 0, predicted: 3500, unit: "명" },
    { metric: "부동산 가격", current: 100, predicted: 115, unit: "%" },
  ],
};

const Scenario = () => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [investment, setInvestment] = useState([1000]);
  const [employmentScale, setEmploymentScale] = useState([500]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setShowResults(true);
    }, 3000);
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              정책 시뮬레이터
            </h1>
            <p className="text-gray-600 mt-2">
              가상 산업단지 조성 시나리오 분석 및 정책 효과 예측
            </p>
          </div>
          <Button className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>리포트 다운로드</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 시나리오 설정 */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Factory className="w-5 h-5" />
                  <span>시나리오 설정</span>
                </CardTitle>
                <CardDescription>
                  새로운 산업단지 조성 시나리오를 구성하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">위치 선택</Label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="지역을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cheongju">청주시 상당구</SelectItem>
                      <SelectItem value="chungju">충주시 교현동</SelectItem>
                      <SelectItem value="jecheon">제천시 신월동</SelectItem>
                      <SelectItem value="jincheon">진천군 덕산면</SelectItem>
                      <SelectItem value="eumseong">음성군 맹동면</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry">주력 산업</Label>
                  <Select value={industryType} onValueChange={setIndustryType}>
                    <SelectTrigger>
                      <SelectValue placeholder="산업 유형을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semiconductor">반도체</SelectItem>
                      <SelectItem value="battery">배터리</SelectItem>
                      <SelectItem value="biomedical">바이오메디컬</SelectItem>
                      <SelectItem value="automotive">자동차부품</SelectItem>
                      <SelectItem value="smart-factory">
                        스마트팩토리
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>투자 규모: {investment[0]}억원</Label>
                  <Slider
                    value={investment}
                    onValueChange={setInvestment}
                    max={5000}
                    min={500}
                    step={100}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>예상 고용 인원: {employmentScale[0]}명</Label>
                  <Slider
                    value={employmentScale}
                    onValueChange={setEmploymentScale}
                    max={2000}
                    min={100}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">시나리오 설명</Label>
                  <Textarea
                    placeholder="시나리오에 대한 추가 설명을 입력하세요"
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleSimulation}
                  disabled={isSimulating || !selectedLocation || !industryType}
                  className="w-full"
                >
                  {isSimulating ? (
                    <>시뮬레이션 진행중...</>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      시뮬레이션 실행
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 기존 시나리오 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>기존 시나리오</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{scenario.name}</p>
                        <p className="text-xs text-gray-500">{scenario.date}</p>
                      </div>
                      <Badge
                        variant={
                          scenario.status === "완료"
                            ? "default"
                            : scenario.status === "진행중"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {scenario.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 시뮬레이션 결과 */}
          <div className="lg:col-span-2">
            {showResults ? (
              <Tabs defaultValue="employment" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="employment">고용 효과</TabsTrigger>
                  <TabsTrigger value="traffic">교통 영향</TabsTrigger>
                  <TabsTrigger value="economics">경제 지표</TabsTrigger>
                </TabsList>

                <TabsContent value="employment">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>고용 효과 분석</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={simulationResults.employment}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="before"
                            stroke="#94a3b8"
                            strokeDasharray="5 5"
                            name="기존 고용"
                          />
                          <Line
                            type="monotone"
                            dataKey="after"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="시나리오 적용 후"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900">
                            직접 고용
                          </h4>
                          <p className="text-2xl font-bold text-blue-600">
                            {employmentScale[0].toLocaleString()}명
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-900">
                            간접 고용
                          </h4>
                          <p className="text-2xl font-bold text-green-600">
                            {Math.round(
                              employmentScale[0] * 1.5
                            ).toLocaleString()}
                            명
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="traffic">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Car className="w-5 h-5" />
                        <span>교통 영향 분석</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={simulationResults.traffic}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="congestion"
                            stackId="1"
                            stroke="#94a3b8"
                            fill="#94a3b8"
                            fillOpacity={0.5}
                            name="현재 혼잡도"
                          />
                          <Area
                            type="monotone"
                            dataKey="newCongestion"
                            stackId="2"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.5}
                            name="예상 혼잡도"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-900">
                          교통 개선 권고사항
                        </h4>
                        <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                          <li>• 출퇴근 시간대 대중교통 증편 필요</li>
                          <li>• 주요 교차로 신호 체계 개선 권장</li>
                          <li>• 셔틀버스 운행 시스템 도입 검토</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="economics">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>경제 지표 분석</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {simulationResults.economics.map((item, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <h4 className="font-semibold text-gray-900">
                              {item.metric}
                            </h4>
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <p className="text-sm text-gray-500">현재</p>
                                <p className="text-lg font-bold">
                                  {item.current}
                                  {item.unit}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">예상</p>
                                <p className="text-lg font-bold text-green-600">
                                  {item.predicted}
                                  {item.unit}
                                </p>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${
                                    (item.predicted /
                                      Math.max(item.current, item.predicted)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900 flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4" />
                          <span>종합 평가</span>
                        </h4>
                        <p className="text-sm text-green-800 mt-2">
                          해당 시나리오는 지역 경제에{" "}
                          <strong>긍정적 영향</strong>을 미칠 것으로 예상됩니다.
                          특히 고용 창출과 지역 GDP 성장에 크게 기여할
                          전망입니다.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      시뮬레이션 준비
                    </h3>
                    <p className="text-gray-600">
                      왼쪽 패널에서 시나리오를 설정하고 시뮬레이션을 실행하세요.
                    </p>
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

export default Scenario;
