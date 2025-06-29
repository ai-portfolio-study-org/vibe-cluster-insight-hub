# Vibe Cluster Insight Hub

한국 인프라 클러스터 데이터 통합 시각화 및 분석 플랫폼

---

## 🏗️ 프로젝트 개요

**Vibe Cluster Insight Hub**는 국가철도공단, 국토교통부, 한국공항공사, 해양수산부 등 다양한 공공기관의 인프라 데이터를 통합하여, 지도 기반 시각화와 정량적 분석, 클러스터링, 성장성 예측, 네트워크 분석, 추천 시스템 등 다양한 기능을 제공하는 대시보드형 웹 애플리케이션입니다.

- **주요 목적**
  - 전국 인프라(철도, 도로, 공항, 항만) 현황 및 계획 데이터 통합
  - 산업단지 및 인프라 입지의 접근성, 성장성, 네트워크 등 다각적 분석
  - 정책 수립, 투자유치, 입지 선정 등 실무 활용 가능한 인사이트 제공

---

## 🚩 주요 기능

- **지도 기반 시각화**: 네이버 지도 API를 활용한 인프라 위치 및 클러스터 표시
- **클러스터 분석**: 지역별 인프라 밀도, 산업단지 집적도 분석
- **성장성 예측**: 교통, 고용, 투자, 인력 등 다양한 지표 기반 성장성 점수 산정
- **네트워크 분석**: 산업단지 및 기업 간 협업 가능성, 공급망 네트워크 시각화
- **시나리오 시뮬레이션**: 정책 변화, 신규 인프라 개통 등 가상 시나리오 반영 분석
- **입지 추천 시스템**: 업종/기업명/KSIC 코드 기반 최적 산업단지 추천
- **PDF 리포트 생성**: 분석 결과를 PDF로 저장 및 공유

---

## 📊 데이터 소스

### 철도

- 국가철도공단\_고속철도 사업계획\_20240719.csv
- 국가철도공단\_광역철도 사업내용\_20240719.csv
- 국가철도공단\_일반철도 공사중인 사업내용\_20240719.csv
- 국가철도공단\_철도건설현황\_20240619.csv
- 국토교통부\_철도산업 사업현황\_20240730.csv

### 도로

- 국토교통부\_도로 공사정보\_20241119.csv

### 항공

- 한국공항공사\_공항 위치정보\_20240801.csv
- 한국공항공사\_공항 계류장 및 주차장 정보\_20240719.csv
- 한국공항공사\_공항별 교통정보\_20240726.csv

### 항만

- 해양수산부\_항만건설사업 공정현황정보\_20121231.csv
- 해양수산부\_항만건설사업 사후평가\_20210101.csv

### 기타

- 충청북도\_산업단지현황\_20240729.csv (예시)

---

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **지도**: Naver Maps API
- **상태 관리**: React Hooks
- **데이터 처리**: CSV 파싱, 커스텀 훅 기반 데이터 분석

---

## ⚙️ 설치 및 실행 방법

### 1. 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 2. 설치

```bash
# 저장소 클론
git clone <repository-url>
cd vibe-cluster-insight-hub

# 의존성 설치
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

---

## 🔑 환경 변수 설정

네이버 지도 API 사용을 위해 `.env` 파일에 아래와 같이 입력하세요.

```
VITE_NAVER_CLIENT_ID=your_naver_client_id
VITE_NAVER_CLIENT_SECRET=your_naver_client_secret
```

---

## 📁 폴더 구조

```
vibe-cluster-insight-hub/
├── public/                # 정적 데이터 및 CSV 파일
├── src/
│   ├── components/        # 공통 컴포넌트, hooks, UI
│   ├── pages/             # 주요 페이지 컴포넌트
│   ├── data/              # (예시) mock 데이터
│   ├── types/             # 타입 정의
│   └── lib/               # 유틸리티 함수
├── data/                  # 원본 데이터 CSV
├── README.md
├── spec.md                # 상세 기획 및 산정 방식
└── ...
```

---

## 🗺️ 주요 페이지 및 기능

- **Dashboard**: 전체 인프라 및 산업단지 현황 대시보드
- **ClusterMap**: 지도 기반 클러스터 및 밀도 시각화
- **GrowthScan**: 성장성 예측 및 분석
- **Network**: 협업 네트워크 및 공급망 분석
- **Scenario**: 정책/인프라 변화 시나리오 시뮬레이션
- **Recommendation**: 업종/기업명 기반 입지 추천
- **NotFound**: 404 페이지

---

## 🧑‍💻 개발 및 기여 가이드

### 1. 새로운 데이터 소스 추가

- `data/` 또는 `public/` 폴더에 CSV 파일 추가
- `src/components/hooks/useDataLoading.ts` 등에서 데이터 로딩 로직 추가
- 필요한 타입 정의를 `src/types/`에 추가

### 2. 새로운 분석/시각화 기능 추가

- `src/components/hooks/`에 커스텀 훅 생성
- 관련 페이지 컴포넌트에 기능 연동
- UI 컴포넌트 필요시 `src/components/ui/`에 추가

### 3. 코드 스타일

- TypeScript, React Hooks, 함수형 컴포넌트 권장
- Tailwind CSS로 스타일링
- shadcn/ui 기반 UI 컴포넌트 활용

### 4. 커밋 메시지 컨벤션

- feat: 새로운 기능
- fix: 버그 수정
- docs: 문서 변경
- style: 코드 포맷팅, 세미콜론 누락 등
- refactor: 코드 리팩토링
- test: 테스트 추가/수정
- chore: 기타 변경사항

### 5. 기여 방법

1. 저장소 Fork
2. 브랜치 생성 (`git checkout -b feature/새기능`)
3. 변경사항 커밋 (`git commit -m 'feat: ...'`)
4. 원격 저장소로 푸시 (`git push origin feature/새기능`)
5. Pull Request 생성

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 📞 문의

- 이슈 등록: GitHub Issues 활용
- 기타 문의: 프로젝트 관리자에게 연락

---

**Vibe Cluster Insight Hub**

> 한국 인프라 데이터의 새로운 통합 시각화와 분석의 시작
