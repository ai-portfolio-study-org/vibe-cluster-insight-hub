
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Map, Filter, Search, Building2, Users, TrendingUp } from 'lucide-react';
import { mockIndustrialComplexes } from '@/data/mockData';
import Layout from '@/components/Layout';

const ClusterMap = () => {
  const [selectedComplex, setSelectedComplex] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('전체');

  const industries = ['전체', '바이오', 'IT/소프트웨어', '반도체', '자동차부품', '기계'];

  const filteredComplexes = mockIndustrialComplexes.filter(complex => {
    const matchesSearch = complex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         complex.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterIndustry === '전체' || 
                         complex.mainIndustries.some(industry => industry.includes(filterIndustry));
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">산업단지 클러스터 지도</h1>
          <p className="text-gray-600">충북 지역 산업단지의 위치와 특성을 시각적으로 분석하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 지도 영역 (실제로는 지도 라이브러리 사용) */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Map className="w-5 h-5 mr-2 text-blue-600" />
                    충북 산업단지 분포도
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-xs">고성장</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">안정성장</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">성장필요</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 간단한 지도 시뮬레이션 */}
                <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">충북 산업단지 지도</p>
                      <p className="text-sm">실제 환경에서는 Mapbox/Leaflet 지도 표시</p>
                    </div>
                  </div>
                  
                  {/* 가상의 산업단지 마커들 */}
                  {mockIndustrialComplexes.map((complex, index) => (
                    <div
                      key={complex.id}
                      className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                        complex.growthScore >= 8.5 ? 'bg-green-500' :
                        complex.growthScore >= 7 ? 'bg-blue-500' : 'bg-yellow-500'
                      } hover:scale-150 transition-transform`}
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + (index % 3) * 20}%`
                      }}
                      onClick={() => setSelectedComplex(complex)}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                        {complex.name}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 검색 및 필터 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-blue-600" />
                  검색 및 필터
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="산업단지명 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">업종 필터</p>
                  <div className="flex flex-wrap gap-1">
                    {industries.map((industry) => (
                      <Button
                        key={industry}
                        variant={filterIndustry === industry ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => setFilterIndustry(industry)}
                      >
                        {industry}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 선택된 산업단지 정보 */}
            {selectedComplex && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedComplex.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{selectedComplex.location}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1 text-gray-500" />
                        {selectedComplex.totalCompanies}개사
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        {selectedComplex.employmentCount.toLocaleString()}명
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">성장지표</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">성장점수</span>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                        <span className="font-medium">{selectedComplex.growthScore}/10</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">입주율</span>
                      <span className="font-medium">{selectedComplex.occupancyRate}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">주요 업종</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedComplex.mainIndustries.map((industry: string) => (
                        <Badge key={industry} variant="secondary" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 산업단지 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>산업단지 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {filteredComplexes.map((complex) => (
                    <div
                      key={complex.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedComplex?.id === complex.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedComplex(complex)}
                    >
                      <h4 className="font-medium text-sm">{complex.name}</h4>
                      <p className="text-xs text-gray-600">{complex.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant={complex.growthScore >= 8 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          성장도 {complex.growthScore}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {complex.totalCompanies}개사
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClusterMap;
