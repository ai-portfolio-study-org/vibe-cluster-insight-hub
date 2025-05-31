
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Map, 
  Network, 
  TrendingUp, 
  Search, 
  Settings,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '대시보드' },
    { path: '/recommendation', icon: Search, label: '입지추천' },
    { path: '/cluster-map', icon: Map, label: '클러스터 지도' },
    { path: '/network', icon: Network, label: '협업 네트워크' },
    { path: '/growth-scan', icon: TrendingUp, label: '성장 예측' },
    { path: '/scenario', icon: BarChart3, label: '정책 시뮬레이터' }
  ];

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">VIBE-CLUSTER</h1>
            <p className="text-xs text-gray-500">충북 산업 클러스터 AI</p>
          </div>
        </div>
        
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
        <Link
          to="/admin"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>관리자</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
