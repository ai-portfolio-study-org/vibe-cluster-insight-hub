// 더미 데이터 정의
export interface IndustrialComplex {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  totalCompanies: number;
  employmentCount: number;
  mainIndustries: string[];
  occupancyRate: number;
  growthScore: number;
  trafficAccessibility: number;
  totalEmployees: number;
  totalInvestment: number;
  accessibilityScore: {
    highway: number;
    railway: number;
    airport: number;
    port: number;
  };
  industryTypes: string[];
  growthRate: number;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  ksicCode: string;
  employees: number;
  complexId: string;
  products: string[];
  cooperationScore: number;
}

export interface GrowthData {
  region: string;
  name: string;
  lat: number;
  lng: number;
  currentScore: number;
  predictedScore: number;
  employmentGrowth: number;
  investmentGrowth: number;
  weightedAccessibility: number;
  logisticsCost: number;
  accessibilityBreakdown: {
    highway: number;
    railway: number;
    airport: number;
    port: number;
  };
}

export const mockIndustrialComplexes: IndustrialComplex[] = [
  {
    id: "1",
    name: "청주테크노폴리스",
    location: "청주시 흥덕구",
    lat: 36.6424,
    lng: 127.4890,
    totalCompanies: 156,
    employmentCount: 8420,
    mainIndustries: ["IT/소프트웨어", "바이오", "전자부품"],
    occupancyRate: 87.5,
    growthScore: 8.4,
    trafficAccessibility: 9.2,
    totalEmployees: 12500,
    totalInvestment: 2500000000000,
    accessibilityScore: {
      highway: 92,
      railway: 85,
      airport: 78,
      port: 65
    },
    industryTypes: ['반도체', '전자부품', '자동차부품'],
    growthRate: 8.5
  },
  {
    id: "2", 
    name: "오송생명과학단지",
    location: "청주시 흥덕구 오송읍",
    lat: 36.6158,
    lng: 127.3014,
    totalCompanies: 89,
    employmentCount: 5670,
    mainIndustries: ["바이오", "제약", "의료기기"],
    occupancyRate: 92.1,
    growthScore: 9.1,
    trafficAccessibility: 8.7,
    totalEmployees: 8500,
    totalInvestment: 1800000000000,
    accessibilityScore: {
      highway: 88,
      railway: 90,
      airport: 82,
      port: 70
    },
    industryTypes: ['바이오', '제약', '의료기기'],
    growthRate: 9.2
  },
  {
    id: "3",
    name: "진천산업단지",
    location: "진천군 덕산읍",
    lat: 36.8339,
    lng: 127.4253,
    totalCompanies: 124,
    employmentCount: 6890,
    mainIndustries: ["자동차부품", "기계", "화학"],
    occupancyRate: 78.3,
    growthScore: 7.2,
    trafficAccessibility: 7.8,
    totalEmployees: 9500,
    totalInvestment: 1500000000000,
    accessibilityScore: {
      highway: 85,
      railway: 75,
      airport: 60,
      port: 55
    },
    industryTypes: ['기계', '금속', '화학'],
    growthRate: 7.8
  },
  {
    id: "4",
    name: "음성첨단산업단지", 
    location: "음성군 맹동면",
    lat: 36.9442,
    lng: 127.6891,
    totalCompanies: 67,
    employmentCount: 4230,
    mainIndustries: ["반도체", "디스플레이", "전자"],
    occupancyRate: 85.6,
    growthScore: 8.8,
    trafficAccessibility: 6.9,
    totalEmployees: 6500,
    totalInvestment: 1200000000000,
    accessibilityScore: {
      highway: 78,
      railway: 65,
      airport: 55,
      port: 45
    },
    industryTypes: ['시멘트', '건자재', '석회'],
    growthRate: 6.5
  },
  {
    id: "5",
    name: "제천산업단지",
    location: "제천시 청풍면",
    lat: 37.1327,
    lng: 128.1906,
    totalCompanies: 45,
    employmentCount: 2890,
    mainIndustries: ["시멘트", "광물", "건자재"],
    occupancyRate: 71.2,
    growthScore: 6.1,
    trafficAccessibility: 5.4,
    totalEmployees: 7800,
    totalInvestment: 1400000000000,
    accessibilityScore: {
      highway: 70,
      railway: 60,
      airport: 45,
      port: 40
    },
    industryTypes: ['전자', '기계', '자동차부품'],
    growthRate: 7.2
  }
];

export const mockCompanies: Company[] = [
  {
    id: "c1",
    name: "충북바이오텍",
    industry: "바이오기술",
    ksicCode: "21201",
    employees: 89,
    complexId: "2",
    products: ["항체의약품", "백신"],
    cooperationScore: 8.5
  },
  {
    id: "c2", 
    name: "테크노소프트",
    industry: "소프트웨어",
    ksicCode: "58221",
    employees: 156,
    complexId: "1",
    products: ["ERP시스템", "AI솔루션"],
    cooperationScore: 7.8
  },
  {
    id: "c3",
    name: "청주정밀",
    industry: "정밀기계",
    ksicCode: "29111",
    employees: 234,
    complexId: "3",
    products: ["자동차부품", "정밀가공"],
    cooperationScore: 8.1
  },
  {
    id: "c4",
    name: "반도체코리아",
    industry: "반도체",
    ksicCode: "26121",
    employees: 445,
    complexId: "4", 
    products: ["메모리반도체", "시스템반도체"],
    cooperationScore: 9.2
  }
];

export const mockGrowthData = [
  {
    region: "청주시",
    name: "청주시",
    lat: 36.6424,
    lng: 127.4890,
    currentScore: 7.2,
    predictedScore: 8.5,
    employmentGrowth: 12,
    investmentGrowth: 15,
    weightedAccessibility: 85,
    logisticsCost: 95000000,
    accessibilityBreakdown: {
      highway: 90,
      railway: 85,
      airport: 80,
      port: 70,
    },
  },
  {
    region: "충주시",
    name: "충주시",
    lat: 36.9910,
    lng: 127.9260,
    currentScore: 6.8,
    predictedScore: 7.5,
    employmentGrowth: 10,
    investmentGrowth: 12,
    weightedAccessibility: 78,
    logisticsCost: 105000000,
    accessibilityBreakdown: {
      highway: 85,
      railway: 75,
      airport: 65,
      port: 60,
    },
  },
  {
    region: "제천시",
    name: "제천시",
    lat: 37.1327,
    lng: 128.1910,
    currentScore: 6.5,
    predictedScore: 7.2,
    employmentGrowth: 9,
    investmentGrowth: 11,
    weightedAccessibility: 75,
    logisticsCost: 110000000,
    accessibilityBreakdown: {
      highway: 80,
      railway: 70,
      airport: 60,
      port: 55,
    },
  },
  {
    region: "음성군",
    name: "음성군",
    lat: 36.9404,
    lng: 127.6900,
    currentScore: 5.8,
    predictedScore: 6.5,
    employmentGrowth: 7,
    investmentGrowth: 9,
    weightedAccessibility: 70,
    logisticsCost: 115000000,
    accessibilityBreakdown: {
      highway: 75,
      railway: 65,
      airport: 55,
      port: 50,
    },
  },
  {
    region: "진천군",
    name: "진천군",
    lat: 36.8550,
    lng: 127.4350,
    currentScore: 5.5,
    predictedScore: 6.2,
    employmentGrowth: 6,
    investmentGrowth: 8,
    weightedAccessibility: 68,
    logisticsCost: 118000000,
    accessibilityBreakdown: {
      highway: 72,
      railway: 62,
      airport: 52,
      port: 48,
    },
  },
  {
    region: "단양군",
    name: "단양군",
    lat: 36.9845,
    lng: 128.3650,
    currentScore: 5.2,
    predictedScore: 5.8,
    employmentGrowth: 5,
    investmentGrowth: 7,
    weightedAccessibility: 65,
    logisticsCost: 120000000,
    accessibilityBreakdown: {
      highway: 70,
      railway: 60,
      airport: 50,
      port: 45,
    },
  },
];

export const mockNetworkData = {
  nodes: [
    { id: "c1", name: "충북바이오텍", industry: "바이오", size: 89, x: 100, y: 150 },
    { id: "c2", name: "테크노소프트", industry: "IT", size: 156, x: 250, y: 100 },
    { id: "c3", name: "청주정밀", industry: "기계", size: 234, x: 200, y: 250 },
    { id: "c4", name: "반도체코리아", industry: "반도체", size: 445, x: 350, y: 200 },
    { id: "c5", name: "오송제약", industry: "제약", size: 123, x: 150, y: 300 },
    { id: "c6", name: "디스플레이텍", industry: "디스플레이", size: 287, x: 400, y: 120 }
  ],
  links: [
    { source: "c1", target: "c5", strength: 0.8, type: "공급망" },
    { source: "c2", target: "c4", strength: 0.6, type: "기술협력" },
    { source: "c3", target: "c4", strength: 0.7, type: "부품공급" },
    { source: "c4", target: "c6", strength: 0.9, type: "기술협력" },
    { source: "c1", target: "c2", strength: 0.4, type: "R&D협력" },
    { source: "c3", target: "c6", strength: 0.5, type: "부품공급" }
  ]
};

export const dashboardStats = {
  totalComplexes: 45,
  totalEmployment: 128456,
  totalCompanies: 1247,
  avgGrowthRate: 8.2,
  topIndustries: [
    { name: "바이오/제약", percentage: 28.5, growth: "+15.2%" },
    { name: "IT/소프트웨어", percentage: 22.1, growth: "+18.7%" },
    { name: "반도체/전자", percentage: 19.8, growth: "+12.3%" },
    { name: "자동차부품", percentage: 15.4, growth: "+8.9%" },
    { name: "기계/정밀", percentage: 14.2, growth: "+6.5%" }
  ]
};
