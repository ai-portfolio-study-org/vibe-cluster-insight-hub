
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Users, TrendingUp, Building2, Star, BarChart3, Zap, Shield } from 'lucide-react';
import { mockIndustrialComplexes, mockCompanies } from '@/data/mockData';
import Layout from '@/components/Layout';

const Recommendation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'company' | 'industry' | 'ksic'>('company');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const [policyScenario, setPolicyScenario] = useState('current');

  const handleSearch = () => {
    // 더미 추천 로직 - 실제로는 AI 모델 결과
    const scored = mockIndustrialComplexes.map(complex => ({
      ...complex,
      suitabilityScore: Math.random() * 10,
      policyImpact: policyScenario !== 'current' ? (Math.random() * 2 - 1) : 0,
      reasons: [
        '유사 업종 기업 집적도 높음',
        '교통 접근성 우수',
        '고용 안정성 양호',
        '정부 지원 정책 혜택',
        '인력 공급 원활',
        '물류 네트워크 발달'
      ].slice(0, Math.floor(Math.random() * 3) + 3),
      riskFactors: [
        '토지 비용 상승 가능성',
        '교통 혼잡도 증가',
        '인력 수급 경쟁 심화'
      ].slice(0, Math.floor(Math.random() * 2) + 1)
    })).sort((a, b) => (b.suitabilityScore + b.policyImpact) - (a.suitabilityScore + a.policyImpact));
    
    setRecommendations(scored);
    setIsSearched(true);
  };

  const getPolicyScenarioDescription = (scenario: string) => {
    switch (scenario) {
      case 'tax_incentive':
        return '세금 인센티브 정책 적용 시';
      case 'infrastructure':
        return '교통 인프라 확충 정책 적용 시';
      case 'r_and_d':
        return 'R&D 지원 정책 강화 시';
      default:
        return '현재 정책 기준';
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">산업단지 입지 추천</h1>
          <p className="text-gray-600">업종이나 기업명을 입력하여 최적의 입지를 찾아보세요</p>
        </div>

        {/* 검색 영역 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              입지 분석 요청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2 mb-4">
                {[
                  { key: 'company', label: '기업명' },
                  { key: 'industry', label: '업종명' },
                  { key: 'ksic', label: 'KSIC 코드' }
                ].map((type) => (
                  <Button
                    key={type.key}
                    variant={searchType === type.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchType(type.key as any)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder={`${searchType === 'company' ? '예: 삼성전자' : searchType === 'industry' ? '예: 반도체 제조업' : '예: 26121'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="md:col-span-2"
                />
                
                <Select value={policyScenario} onValueChange={setPolicyScenario}>
                  <SelectTrigger>
                    <SelectValue placeholder="정책 시나리오" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">현재 정책</SelectItem>
                    <SelectItem value="tax_incentive">세금 인센티브</SelectItem>
                    <SelectItem value="infrastructure">인프라 확충</SelectItem>
                    <SelectItem value="r_and_d">R&D 지원 강화</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {getPolicyScenarioDescription(policyScenario)}
                </p>
                <Button onClick={handleSearch} className="px-8">
                  추천 받기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 추천 결과 */}
        {isSearched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">추천 결과</h2>
              <div className="flex space-x-2">
                <Badge variant="outline">{recommendations.length}개 산업단지 분석</Badge>
                {policyScenario !== 'current' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    정책 시나리오 적용
                  </Badge>
                )}
              </div>
            </div>

            {recommendations.map((complex, index) => (
              <Card key={complex.id} className={`${index === 0 ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{complex.name}</h3>
                        {index === 0 && <Badge className="bg-blue-600">최적 추천</Badge>}
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium ml-1">
                            {(complex.suitabilityScore + complex.policyImpact).toFixed(1)}
                          </span>
                          {complex.policyImpact !== 0 && (
                            <span className={`text-xs ml-1 ${complex.policyImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({complex.policyImpact > 0 ? '+' : ''}{complex.policyImpact.toFixed(1)})
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {complex.location}
                      </p>
                      
                      <Tabs defaultValue="strengths" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="strengths" className="text-xs">추천 근거</TabsTrigger>
                          <TabsTrigger value="indicators" className="text-xs">주요 지표</TabsTrigger>
                          <TabsTrigger value="risks" className="text-xs">리스크 요인</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="strengths" className="mt-4">
                          <div className="flex flex-wrap gap-2">
                            {complex.reasons.map((reason: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                <Shield className="w-3 h-3 mr-1" />
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="indicators" className="mt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">입주기업</p>
                                <p className="text-sm font-medium">{complex.totalCompanies}개</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">고용인원</p>
                                <p className="text-sm font-medium">{complex.employmentCount.toLocaleString()}명</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">성장점수</p>
                                <p className="text-sm font-medium">{complex.growthScore}/10</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-xs text-gray-500">입주율</p>
                                <p className="text-sm font-medium">{complex.occupancyRate}%</p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="risks" className="mt-4">
                          <div className="flex flex-wrap gap-2">
                            {complex.riskFactors.map((risk: string, idx: number) => (
                              <Badge key={idx} variant="destructive" className="text-xs bg-red-100 text-red-800">
                                <Zap className="w-3 h-3 mr-1" />
                                {risk}
                              </Badge>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>

                  {/* 주요 업종 */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">주요 업종</h4>
                    <div className="flex flex-wrap gap-2">
                      {complex.mainIndustries.map((industry: string) => (
                        <Badge key={industry} variant="outline">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* 정책 시나리오 분석 요약 */}
            {policyScenario !== 'current' && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    정책 시나리오 영향 분석
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">긍정적 영향</h4>
                      <p className="text-sm text-gray-600">평균 적합도 점수 +{(Math.random() * 1.5 + 0.5).toFixed(1)}점 상승</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">예상 비용</h4>
                      <p className="text-sm text-gray-600">정책 시행 비용 {(Math.random() * 500 + 200).toFixed(0)}억원</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">시행 기간</h4>
                      <p className="text-sm text-gray-600">{Math.floor(Math.random() * 3 + 2)}년 소요 예상</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 검색 전 안내 */}
        {!isSearched && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI 기반 입지 추천</h3>
              <p className="text-gray-600 mb-6">
                업종, 기업명 또는 KSIC 코드를 입력하면<br />
                충북 지역 내 최적의 산업단지를 추천해드립니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 max-w-md mx-auto">
                <div>
                  <p>✓ 업종 집적도 분석</p>
                  <p>✓ 교통 접근성 평가</p>
                </div>
                <div>
                  <p>✓ 고용 안정성 검토</p>
                  <p>✓ 정책 시나리오 비교</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Recommendation;
