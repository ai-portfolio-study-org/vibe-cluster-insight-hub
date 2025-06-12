
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Route
} from 'lucide-react';
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
  Radar
} from 'recharts';
import { mockGrowthData, mockIndustrialComplexes } from '@/data/mockData';
import Layout from '@/components/Layout';

const GrowthScan = () => {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'1year' | '3year' | '5year'>('3year');
  const [simulationMode, setSimulationMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string>('');

  const industries = [
    { value: 'biotech', label: '바이오/제약', ksic: '21' },
    { value: 'it', label: 'IT/소프트웨어', ksic: '58' },
    { value: 'semiconductor', label: '반도체/전자', ksic: '26' },
    { value: 'automotive', label: '자동차부품', ksic: '29' },
    { value: 'machinery', label: '기계/정밀', ksic: '28' },
    { value: 'steel', label: '철강/금속', ksic: '24' },
    { value: 'cement', label: '시멘트/건자재', ksic: '23' }
  ];

  const scenarios = [
    {
      id: 'osong-rail',
      name: '오송역 철도물류 허브화',
      description: '오송역 중심 철도 물류 네트워크 강화',
      impact: '철도 접근성 +25%',
      affected: ['청주시 흥덕구', '진천군']
    },
    {
      id: 'danyang-highway',
      name: '단양~세종 고속도로 개통',
      description: '단양-세종간 신규 고속도로 건설',
      impact: '고속도로 접근성 +40%',
      affected: ['제천시', '단양군', '세종시']
    }
  ];

  const timeframeLabels = {
    '1year': '1년 후',
    '3year': '3년 후',
    '5year': '5년 후'
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
      cement: { highway: 95, railway: 90, airport: 40, port: 85 }
    };
    return weights[industry as keyof typeof weights] || { highway: 70, railway: 70, airport: 70, port: 70 };
  };

  // 산업단지별 교통 접근성 점수 (더미 데이터)
  const getAccessibilityScores = (complexId: string) => {
    const scores = {
      '1': { highway: 92, railway: 85, airport: 78, port: 65 },
      '2': { highway: 88, railway: 90, airport: 82, port: 70 },
      '3': { highway: 85, railway: 75, airport: 60, port: 55 },
      '4': { highway: 78, railway: 65, airport: 55, port: 45 },
      '5': { highway: 70, railway: 60, airport: 45, port: 40 }
    };
    return scores[complexId as keyof typeof scores] || { highway: 70, railway: 70, airport: 70, port: 70 };
  };

  // 물류비용 계산 (더미 로직)
  const calculateLogisticsCost = (complex: any, industry: string) => {
    const weights = getTransportationWeights(industry);
    const scores = getAccessibilityScores(complex.id);
    
    const weightedScore = (
      (scores.highway * weights.highway + 
       scores.railway * weights.railway + 
       scores.airport * weights.airport + 
       scores.port * weights.port) / 
      (weights.highway + weights.railway + weights.airport + weights.port)
    );
    
    // 점수가 높을수록 물류비 낮음
    const baseCost = 120000000; // 기본 연간 물류비 (1억 2천만원)
    const costReduction = (weightedScore - 50) / 50 * 0.3; // 최대 30% 절감
    return Math.max(baseCost * (1 - costReduction), baseCost * 0.7);
  };

  const getRecommendedComplexes = () => {
    if (!selectedIndustry) return [];
    
    return mockIndustrialComplexes.map(complex => {
      const accessibilityScores = getAccessibilityScores(complex.id);
      const weights = getTransportationWeights(selectedIndustry);
      
      // 업종별 가중 접근성 점수 계산
      const weightedAccessibility = (
        (accessibilityScores.highway * weights.highway + 
         accessibilityScores.railway * weights.railway + 
         accessibilityScores.airport * weights.airport + 
         accessibilityScores.port * weights.port) / 
        (weights.highway + weights.railway + weights.airport + weights.port)
      );
      
      const logisticsCost = calculateLogisticsCost(complex, selectedIndustry);
      
      return {
        ...complex,
        weightedAccessibility: Math.round(weightedAccessibility),
        logisticsCost: Math.round(logisticsCost),
        accessibilityBreakdown: accessibilityScores
      };
    }).sort((a, b) => b.weightedAccessibility - a.weightedAccessibility);
  };

  const recommendedComplexes = getRecommendedComplexes();

  // 레이더 차트 데이터
  const getRadarData = (complex: any) => {
    if (!complex) return [];
    
    return [
      { subject: '고속도로', A: complex.accessibilityBreakdown.highway, fullMark: 100 },
      { subject: '철도', A: complex.accessibilityBreakdown.railway, fullMark: 100 },
      { subject: '공항', A: complex.accessibilityBreakdown.airport, fullMark: 100 },
      { subject: '항만', A: complex.accessibilityBreakdown.port, fullMark: 100 }
    ];
  };

  const getGrowthColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-blue-600 bg-blue-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">지역별 산업 성장 예측</h1>
          <p className="text-gray-600">업종별 입지 경쟁력 평가 및 교통 접근성 기반 최적 입지 분석</p>
        </div>

        {/* 업종 선택 및 시뮬레이션 설정 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="industry">분석 업종</Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
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
              
              <div>
                <Label htmlFor="timeframe">예측 기간</Label>
                <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(timeframeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="simulation" checked={simulationMode} onCheckedChange={setSimulationMode} />
                <Label htmlFor="simulation">시뮬레이션 모드</Label>
              </div>

              {simulationMode && (
                <div>
                  <Label htmlFor="scenario">시나리오</Label>
                  <Select value={activeScenario} onValueChange={setActiveScenario}>
                    <SelectTrigger>
                      <SelectValue placeholder="시나리오 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                    {scenarios.find(s => s.id === activeScenario)?.name}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {scenarios.find(s => s.id === activeScenario)?.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {scenarios.find(s => s.id === activeScenario)?.impact}
                    </Badge>
                    <span className="text-xs text-blue-600">
                      영향지역: {scenarios.find(s => s.id === activeScenario)?.affected.join(', ')}
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
            {/* 업종별 추천 산업단지 */}
            {selectedIndustry && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                      {industries.find(i => i.value === selectedIndustry)?.label} 최적 입지 TOP 5
                    </div>
                    <Button size="sm" variant="outline" className="flex items-center space-x-1">
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
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedRegion(complex)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{complex.name}</h3>
                              <p className="text-sm text-gray-600">{complex.location}</p>
                            </div>
                          </div>
                          <Badge className={getGrowthColor(complex.weightedAccessibility / 10)}>
                            접근성 {complex.weightedAccessibility}/100
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">예상 연간 물류비</span>
                            <span className="font-medium text-green-600">
                              {(complex.logisticsCost / 100000000).toFixed(1)}억원
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">입주기업 수</span>
                            <span className="font-medium">{complex.totalCompanies}개</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                          <div className="flex items-center">
                            <Car className="w-3 h-3 mr-1 text-blue-500" />
                            <span>고속도로 {complex.accessibilityBreakdown.highway}</span>
                          </div>
                          <div className="flex items-center">
                            <Train className="w-3 h-3 mr-1 text-green-500" />
                            <span>철도 {complex.accessibilityBreakdown.railway}</span>
                          </div>
                          <div className="flex items-center">
                            <Plane className="w-3 h-3 mr-1 text-purple-500" />
                            <span>공항 {complex.accessibilityBreakdown.airport}</span>
                          </div>
                          <div className="flex items-center">
                            <Ship className="w-3 h-3 mr-1 text-cyan-500" />
                            <span>항만 {complex.accessibilityBreakdown.port}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 지역별 성장 히트맵 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    지역별 성장 전망 ({timeframeLabels[timeframe]})
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>고성장 (8.0+)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>안정성장 (6.0~7.9)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>성장필요 (~5.9)</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {mockGrowthData.map((region) => {
                    const trend = ((region.predictedScore - region.currentScore) / region.currentScore) * 100;
                    const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
                    
                    return (
                      <div
                        key={region.region}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedRegion?.region === region.region
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedRegion(region)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{region.region}</h3>
                          <Badge className={getGrowthColor(region.predictedScore)}>
                            {region.predictedScore.toFixed(1)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">현재 점수</span>
                            <span className="font-medium">{region.currentScore.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">예측 점수</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{region.predictedScore.toFixed(1)}</span>
                              <TrendIcon className={`w-3 h-3 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
                              <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {trend.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1 text-blue-500" />
                            <span>고용 +{region.employmentGrowth}%</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1 text-green-500" />
                            <span>투자 +{region.investmentGrowth}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 업종별 수송경로 분석 */}
            {selectedIndustry && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Route className="w-5 h-5 mr-2 text-purple-600" />
                    {industries.find(i => i.value === selectedIndustry)?.label} 대표 수송경로 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">주요 원자재 수송</h4>
                        <div className="space-y-1 text-blue-700">
                          {selectedIndustry === 'cement' && (
                            <>
                              <p>• 석회석: 단양 → 제천 (철도 95%)</p>
                              <p>• 석탄: 인천항 → 제천 (트럭)</p>
                            </>
                          )}
                          {selectedIndustry === 'steel' && (
                            <>
                              <p>• 철광석: 인천항 → 청주 (철도)</p>
                              <p>• 코크스: 광양항 → 청주 (철도)</p>
                            </>
                          )}
                          {selectedIndustry === 'semiconductor' && (
                            <>
                              <p>• 실리콘웨이퍼: 인천공항 → 청주</p>
                              <p>• 화학원료: 인천항 → 음성</p>
                            </>
                          )}
                          {!['cement', 'steel', 'semiconductor'].includes(selectedIndustry) && (
                            <>
                              <p>• 주요 원자재: 인천항/공항</p>
                              <p>• 부품: 서울/경기 → 충북</p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">완제품 출하</h4>
                        <div className="space-y-1 text-green-700">
                          <p>• 국내: 고속도로 (70%)</p>
                          <p>• 수출: 인천공항/항 (85%)</p>
                          <p>• 중국: 인천항 (해운)</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">물류비 절감 포인트</h4>
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
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
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
                  {selectedRegion.weightedAccessibility && (
                    <>
                      {/* 교통 접근성 레이더차트 */}
                      <div>
                        <h4 className="font-medium mb-3">교통 접근성 분석</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={getRadarData(selectedRegion)}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar name="접근성" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">종합 접근성 점수</span>
                            <span className="font-semibold text-lg">{selectedRegion.weightedAccessibility}/100</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">예상 연간 물류비</span>
                            <span className="font-semibold text-lg text-green-600">
                              {(selectedRegion.logisticsCost / 100000000).toFixed(1)}억원
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRegion.currentScore && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">현재 성장 점수</span>
                        <span className="font-semibold text-lg">{selectedRegion.currentScore}/10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">예측 성장 점수</span>
                        <span className="font-semibold text-lg text-blue-600">{selectedRegion.predictedScore}/10</span>
                      </div>
                    </div>
                  )}

                  {selectedRegion.employmentGrowth && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">성장 동력</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-blue-500" />
                            <span className="text-sm">고용 증가율</span>
                          </div>
                          <span className="font-medium text-green-600">+{selectedRegion.employmentGrowth}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                            <span className="text-sm">투자 증가율</span>
                          </div>
                          <span className="font-medium text-green-600">+{selectedRegion.investmentGrowth}%</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                    <h4 className="font-medium text-green-900 mb-2">추천 전략</h4>
                    <div className="space-y-1 text-green-700">
                      {selectedIndustry === 'cement' && (
                        <>
                          <p>• 철도 수송 비율 확대</p>
                          <p>• 석회석 광산 인근 입지</p>
                        </>
                      )}
                      {selectedIndustry === 'steel' && (
                        <>
                          <p>• 항만-철도 복합 운송</p>
                          <p>• 원자재 저장시설 공동 활용</p>
                        </>
                      )}
                      {selectedIndustry === 'semiconductor' && (
                        <>
                          <p>• 공항 접근성 최우선</p>
                          <p>• 클린룸 공동 인프라</p>
                        </>
                      )}
                      {!['cement', 'steel', 'semiconductor'].includes(selectedIndustry) && (
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
        </div>
      </div>
    </Layout>
  );
};

export default GrowthScan;
