
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, TrendingUp, Building2, Star } from 'lucide-react';
import { mockIndustrialComplexes, mockCompanies } from '@/data/mockData';
import Layout from '@/components/Layout';

const Recommendation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'company' | 'industry' | 'ksic'>('company');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = () => {
    // 더미 추천 로직 - 실제로는 AI 모델 결과
    const scored = mockIndustrialComplexes.map(complex => ({
      ...complex,
      suitabilityScore: Math.random() * 10,
      reasons: [
        '유사 업종 기업 집적도 높음',
        '교통 접근성 우수',
        '고용 안정성 양호',
        '정부 지원 정책 혜택'
      ].slice(0, Math.floor(Math.random() * 3) + 2)
    })).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    
    setRecommendations(scored);
    setIsSearched(true);
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
              
              <div className="flex space-x-4">
                <Input
                  placeholder={`${searchType === 'company' ? '예: 삼성전자' : searchType === 'industry' ? '예: 반도체 제조업' : '예: 26121'}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
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
              <Badge variant="outline">{recommendations.length}개 산업단지 분석</Badge>
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
                          <span className="text-sm font-medium ml-1">{complex.suitabilityScore.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {complex.location}
                      </p>
                      
                      {/* 추천 근거 */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">추천 근거</h4>
                        <div className="flex flex-wrap gap-2">
                          {complex.reasons.map((reason: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* 주요 지표 */}
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
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500">교통접근성</p>
                            <p className="text-sm font-medium">{complex.trafficAccessibility}/10</p>
                          </div>
                        </div>
                      </div>
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
              <div className="text-sm text-gray-500">
                <p>✓ 업종 집적도 분석</p>
                <p>✓ 교통 접근성 평가</p>
                <p>✓ 고용 안정성 검토</p>
                <p>✓ 성장 가능성 예측</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Recommendation;
