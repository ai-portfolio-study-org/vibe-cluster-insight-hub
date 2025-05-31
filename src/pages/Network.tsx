
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network as NetworkIcon, Users, Building2, ArrowRight, Link } from 'lucide-react';
import { mockNetworkData, mockCompanies } from '@/data/mockData';
import Layout from '@/components/Layout';

const Network = () => {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  const getConnectionType = (type: string) => {
    const types = {
      '공급망': { color: 'bg-blue-500', label: '공급망' },
      '기술협력': { color: 'bg-green-500', label: '기술협력' },
      '부품공급': { color: 'bg-purple-500', label: '부품공급' },
      'R&D협력': { color: 'bg-orange-500', label: 'R&D협력' }
    };
    return types[type as keyof typeof types] || { color: 'bg-gray-500', label: type };
  };

  const getNodesByIndustry = () => {
    const industryGroups: { [key: string]: any[] } = {};
    mockNetworkData.nodes.forEach(node => {
      if (!industryGroups[node.industry]) {
        industryGroups[node.industry] = [];
      }
      industryGroups[node.industry].push(node);
    });
    return industryGroups;
  };

  const getNodeConnections = (nodeId: string) => {
    return mockNetworkData.links.filter(link => 
      link.source === nodeId || link.target === nodeId
    );
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">기업 협업 네트워크</h1>
          <p className="text-gray-600">산업단지 내 기업간 협업 가능성과 공급망 관계를 시각화합니다</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 네트워크 시각화 영역 */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <NetworkIcon className="w-5 h-5 mr-2 text-blue-600" />
                    협업 네트워크 시각화
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    {Object.entries(getConnectionType('')).slice(0, 4).map(([key, _], index) => {
                      const types = ['공급망', '기술협력', '부품공급', 'R&D협력'];
                      const type = getConnectionType(types[index]);
                      return (
                        <div key={key} className="flex items-center space-x-1">
                          <div className={`w-3 h-1 ${type.color}`}></div>
                          <span>{type.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border">
                  {/* SVG 네트워크 시뮬레이션 */}
                  <svg className="w-full h-full">
                    {/* 연결선(엣지) 그리기 */}
                    {mockNetworkData.links.map((link, index) => {
                      const sourceNode = mockNetworkData.nodes.find(n => n.id === link.source);
                      const targetNode = mockNetworkData.nodes.find(n => n.id === link.target);
                      if (!sourceNode || !targetNode) return null;
                      
                      const connectionType = getConnectionType(link.type);
                      
                      return (
                        <g key={`${link.source}-${link.target}`}>
                          <line
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke={connectionType.color.replace('bg-', '#').replace('-500', '')}
                            strokeWidth={link.strength * 4}
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedEdge(link)}
                          />
                          <text
                            x={(sourceNode.x + targetNode.x) / 2}
                            y={(sourceNode.y + targetNode.y) / 2}
                            className="fill-gray-600 text-xs font-medium text-center"
                            textAnchor="middle"
                          >
                            {link.strength.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* 노드 그리기 */}
                    {mockNetworkData.nodes.map((node) => (
                      <g key={node.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={Math.sqrt(node.size) / 3 + 10}
                          fill={
                            node.industry === 'IT' ? '#3B82F6' :
                            node.industry === '바이오' ? '#10B981' :
                            node.industry === '반도체' ? '#8B5CF6' :
                            node.industry === '기계' ? '#F59E0B' :
                            node.industry === '제약' ? '#EF4444' : '#6B7280'
                          }
                          className={`cursor-pointer transition-all hover:opacity-80 ${
                            selectedNode?.id === node.id ? 'stroke-4 stroke-black' : ''
                          }`}
                          onClick={() => setSelectedNode(node)}
                        />
                        <text
                          x={node.x}
                          y={node.y + 5}
                          className="fill-white text-xs font-medium text-center"
                          textAnchor="middle"
                          onClick={() => setSelectedNode(node)}
                        >
                          {node.name.substring(0, 4)}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 선택된 노드 정보 */}
            {selectedNode && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    기업 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                    <p className="text-gray-600">{selectedNode.industry}</p>
                    <div className="flex items-center mt-2">
                      <Users className="w-4 h-4 mr-1 text-gray-500" />
                      <span className="text-sm">직원 수: {selectedNode.size}명</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">협업 관계</h4>
                    <div className="space-y-2">
                      {getNodeConnections(selectedNode.id).map((connection, index) => {
                        const partnerId = connection.source === selectedNode.id ? connection.target : connection.source;
                        const partner = mockNetworkData.nodes.find(n => n.id === partnerId);
                        const connectionType = getConnectionType(connection.type);
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${connectionType.color}`}></div>
                              <span className="text-sm font-medium">{partner?.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {connectionType.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 연결 정보 */}
            {selectedEdge && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Link className="w-5 h-5 mr-2 text-green-600" />
                    협업 관계 상세
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {mockNetworkData.nodes.find(n => n.id === selectedEdge.source)?.name}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {mockNetworkData.nodes.find(n => n.id === selectedEdge.target)?.name}
                      </span>
                    </div>
                    
                    <div className="text-center">
                      <Badge className={getConnectionType(selectedEdge.type).color}>
                        {getConnectionType(selectedEdge.type).label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">협업 강도</span>
                      <span className="font-medium">{selectedEdge.strength.toFixed(1)}/1.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 업종별 기업 현황 */}
            <Card>
              <CardHeader>
                <CardTitle>업종별 기업 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(getNodesByIndustry()).map(([industry, companies]) => (
                    <div key={industry} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          industry === 'IT' ? 'bg-blue-500' :
                          industry === '바이오' ? 'bg-green-500' :
                          industry === '반도체' ? 'bg-purple-500' :
                          industry === '기계' ? 'bg-yellow-500' :
                          industry === '제약' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium">{industry}</span>
                      </div>
                      <Badge variant="outline">{companies.length}개사</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 네트워크 통계 */}
            <Card>
              <CardHeader>
                <CardTitle>네트워크 통계</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">총 기업 수</span>
                  <span className="font-medium">{mockNetworkData.nodes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">협업 관계</span>
                  <span className="font-medium">{mockNetworkData.links.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">평균 연결도</span>
                  <span className="font-medium">
                    {(mockNetworkData.links.length * 2 / mockNetworkData.nodes.length).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">네트워크 밀도</span>
                  <span className="font-medium">0.73</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Network;
