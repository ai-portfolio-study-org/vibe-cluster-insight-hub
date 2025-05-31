
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, MapPin, Users, Building2, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { mockGrowthData, mockIndustrialComplexes } from '@/data/mockData';
import Layout from '@/components/Layout';

const GrowthScan = () => {
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'1year' | '3year' | '5year'>('3year');

  const timeframeLabels = {
    '1year': '1년 후',
    '3year': '3년 후',
    '5year': '5년 후'
  };

  const getGrowthColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-blue-600 bg-blue-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getGrowthTrend = (current: number, predicted: number) => {
    const growth = ((predicted - current) / current) * 100;
    return {
      percentage: growth.toFixed(1),
      isPositive: growth > 0,
      icon: growth > 0 ? TrendingUp : TrendingDown
    };
  };

  // 성장 예측 차트 데이터
  const growthChartData = mockGrowthData.map(data => ({
    region: data.region.split(' ')[0],
    현재: data.currentScore,
    예측: data.predictedScore,
    고용성장: data.employmentGrowth,
    투자성장: data.investmentGrowth
  }));

  // 월별 성장 추이 더미 데이터
  const monthlyGrowthData = [
    { month: '1월', 고용: 7.2, 투자: 8.5, 생산: 6.8 },
    { month: '2월', 고용: 7.8, 투자: 9.1, 생산: 7.2 },
    { month: '3월', 고용: 8.1, 투자: 9.8, 생산: 7.6 },
    { month: '4월', 고용: 8.4, 투자: 10.2, 생산: 8.1 },
    { month: '5월', 고용: 8.9, 투자: 11.1, 생산: 8.5 },
    { month: '6월', 고용: 9.2, 투자: 11.8, 생산: 8.9 }
  ];

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">지역별 산업 성장 예측</h1>
          <p className="text-gray-600">AI 모델을 통한 충북 지역별 산업 성장 가능성과 투자 유망도를 분석합니다</p>
        </div>

        {/* 시간대 선택 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">예측 기간:</span>
              <div className="flex space-x-2">
                {Object.entries(timeframeLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={timeframe === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe(key as any)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 분석 영역 */}
          <div className="lg:col-span-2 space-y-6">
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
                    const trend = getGrowthTrend(region.currentScore, region.predictedScore);
                    const TrendIcon = trend.icon;
                    
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
                              <TrendIcon className={`w-3 h-3 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
                              <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {trend.percentage}%
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

            {/* 성장 추이 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  지역별 성장 점수 비교
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={growthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="현재" fill="#94A3B8" />
                    <Bar dataKey="예측" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 월별 성장 추이 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                  성장 지표 추이 (최근 6개월)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="고용" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                    <Area type="monotone" dataKey="투자" stackId="1" stroke="#10B981" fill="#10B981" />
                    <Area type="monotone" dataKey="생산" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 선택된 지역 상세 정보 */}
            {selectedRegion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    {selectedRegion.region} 상세 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">주요 산업단지</h4>
                    <div className="space-y-2">
                      {mockIndustrialComplexes
                        .filter(complex => complex.location.includes(selectedRegion.region.split(' ')[0]))
                        .map(complex => (
                          <div key={complex.id} className="text-sm p-2 bg-gray-50 rounded">
                            <div className="font-medium">{complex.name}</div>
                            <div className="text-gray-600 text-xs">
                              성장점수 {complex.growthScore}/10
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 성장 랭킹 */}
            <Card>
              <CardHeader>
                <CardTitle>성장 예측 랭킹</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockGrowthData
                    .sort((a, b) => b.predictedScore - a.predictedScore)
                    .map((region, index) => (
                      <div
                        key={region.region}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedRegion?.region === region.region 
                            ? 'bg-blue-50 border border-blue-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedRegion(region)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium">{region.region}</span>
                        </div>
                        <Badge className={getGrowthColor(region.predictedScore)}>
                          {region.predictedScore.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* 예측 모델 정보 */}
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
                    <p>• 고용 증감률 (월별)</p>
                    <p>• 기업 투자 규모</p>
                    <p>• 교통/물류 접근성</p>
                    <p>• 정부 정책 지원</p>
                    <p>• 산업 집적도</p>
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
