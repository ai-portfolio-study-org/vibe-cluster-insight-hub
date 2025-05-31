
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Building2, Users, Factory, MapPin } from 'lucide-react';
import { dashboardStats, mockIndustrialComplexes } from '@/data/mockData';
import Layout from '@/components/Layout';

const Dashboard = () => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const employmentByRegion = mockIndustrialComplexes.map(complex => ({
    name: complex.location.split(' ')[0],
    employment: complex.employmentCount,
    companies: complex.totalCompanies
  }));

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">충북 산업 클러스터 대시보드</h1>
          <p className="text-gray-600">충청북도 산업단지 현황 및 성장 동향을 한눈에 확인하세요</p>
        </div>

        {/* 주요 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                <Factory className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">총 산업단지</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalComplexes}</p>
                <p className="text-xs text-green-600">+3 신규</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">총 고용인원</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalEmployment.toLocaleString()}</p>
                <p className="text-xs text-green-600">+8.2%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mr-4">
                <Building2 className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">입주기업 수</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalCompanies.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12.5%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">평균 성장률</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats.avgGrowthRate}%</p>
                <p className="text-xs text-green-600">전년 대비</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 지역별 고용현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                지역별 고용현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employmentByRegion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="employment" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 주요 산업 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Factory className="w-5 h-5 mr-2 text-green-600" />
                주요 산업 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardStats.topIndustries}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    label={({name, percentage}) => `${name} ${percentage}%`}
                  >
                    {dashboardStats.topIndustries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 주요 산업단지 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>주요 산업단지 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockIndustrialComplexes.slice(0, 5).map((complex) => (
                <div key={complex.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{complex.name}</h3>
                    <p className="text-sm text-gray-600">{complex.location}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">기업 {complex.totalCompanies}개</span>
                      <span className="text-sm text-gray-500">고용 {complex.employmentCount.toLocaleString()}명</span>
                      <span className="text-sm text-gray-500">입주율 {complex.occupancyRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={complex.growthScore >= 8 ? "default" : "secondary"}>
                      성장도 {complex.growthScore}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {complex.mainIndustries.slice(0, 2).map((industry) => (
                        <Badge key={industry} variant="outline" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
