# Claude Code 작업 요청 — 채팅 검색 플로우 전면 개편

## 작업 개요

메인 채팅(`app/(main)/chat`)의 상품 검색 응답 플로우를 **3단계 유저 중심 UX**로 전면 개편한다.
현재는 내부 데이터소스(에어서플라이 DB / 입점 공급사 / 외부 마켓 API)가 그대로 노출되고 있고, 검색 결과가 한 번에 나오는 구조다. 이를 "검색 프로그레스 → 결과 요약(AI 줄글) → 맞춤 필터 → Top 5 추천" 순서로 바꾼다.

**선행 작업 (필수)**
- `PROGRESS.md` 읽어서 현재 진행 상태 파악
- `docs/search-flow-planning-v2.html` 브라우저로 열어서 UI 의도 확인 (시각 기획 문서)
- `CLAUDE.md` 디자인/레이아웃 원칙 확인 — 3단 레이아웃, 인터랙션 규칙 등

---

## 1. 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `components/chat/ChatContainer.tsx` | 검색 플로우 state machine 추가 (`idle → step1_progress → step1_done → step2_filter → step3_results`). 기존 검색 응답 렌더링 로직을 신규 카드 컴포넌트로 교체 |
| `components/chat/SourcedProductCard.tsx` | **유지하되 수정** — `SourceType` 단순화 (`internal` / `external` 2종만), 내부 DB명/스크래핑 상태 노출 제거. `platform` 필드는 최저가 모달에서만 사용 |
| `components/chat/ChatContextSidebar.tsx` | `searchSteps` 레이블 교체: "의도 분석 → 상품 검색 → 추천 결과" → **"검색 키워드 생성 → 카테고리 탐색 → 회사 구매기준 확인"** |
| `lib/types.ts` | `SearchFlowStep`, `FilterState`, `RecommendedProduct`(AI 추천 이유 + 태그 포함) 등 신규 타입 |
| `data/products.ts` | 더미 상품에 `aiReason`(string), `aiTags`(string[]) 필드 추가. 최저가 모달용 `externalPrices: { platform, price, shippingFee, url }[]` 필드도 추가 |

---

## 2. 신규 컴포넌트 (새로 만들기)

### 2-1. `components/chat/SearchProgressCard.tsx`

**역할**: 검색 진행 3단계 표시 (1단계 프로그레스 박스).

**Props**
```ts
interface Props {
  currentStep: 0 | 1 | 2 | 3;  // 0=idle, 1~3=active, 3=complete
}
```

**UI 상세**
- 흰 배경 카드 (`boxShadow`: DESIGN.md의 `shadow-card` 토큰 사용)
- 3개 단계 세로 배치:
  1. "검색 키워드 생성 중"
  2. "최적 카테고리 탐색 중"
  3. "회사 구매기준 확인하기"
- 각 단계: 원형 아이콘(22×22) + 레이블
  - `pending`: 회색 배경, 숫자 표시
  - `active`: 보라(`#4e3fb4`) 배경, `⟳` spin 애니메이션 + 레이블 pulse
  - `done`: 연한 초록 배경, `✓` 표시
- 단계 사이 1px 수직 연결선
- **완료 후(currentStep=3) 모든 단계가 `done` 상태로 고정** → 결과 카드는 별도 AI 메시지로 다음에 나옴 (같은 카드 내 확장 X)

**애니메이션 타이밍** (데모용)
- 단계별 0.8초 간격으로 자동 진행: 200ms → 1200ms → 2200ms → 3200ms 완료

---

### 2-2. `components/chat/SearchResultSummary.tsx`

**역할**: 1단계 완료 후 AI가 전달하는 **결과 요약 줄글 카드** (별도 AI 메시지로 렌더링).

**Props**
```ts
interface Props {
  totalCount: number;         // 47
  priceRange: { min: number; max: number };
  categoryPath: string;       // "탄산음료 · 생수 · 기능성음료"
  brands: string[];           // ["펩시콜라", "코카콜라", ...]
  thumbnails: string[];       // 이미지 URL 최대 5개
  remainingCount: number;     // 썸네일 외 나머지 개수
  specHints: { label: string; value: string }[]; // [{label:"용량",value:"250ml~1.8L"}, ...]
  companyPolicyNote: string;  // "월 예산 50만원 이내 우선 · 5만원 이상 팀장 승인. 최근 3개월: 24캔 단위 캔음료 주로 구매."
}
```

**UI 상세**
1. **헤더**: 🔍 아이콘 + "검색 완료" 제목 + 오른쪽에 "47개 상품" 뱃지(보라 계열)
2. **AI 줄글 블록**: 연한 배경(`var(--bg)`) 박스. 카테고리/총개수/가격대/리뷰 기준을 자연어로.
   - 예: "**탄산음료 · 생수 · 기능성음료** 카테고리에서 상품을 찾았어요. 쿠팡, G마켓 등 외부 마켓과 자체 상품을 합쳐 총 **47개**를 확인했으며, 가격 범위는 **8,900원 ~ 38,000원**이에요. 리뷰 수가 1,000개 이상인 상품을 우선 선별했어요."
3. **썸네일 행**: 48×48 정사각 카드 5개 + "+N" 카드. 실제 상품 이미지 표시.
4. **주요 브랜드 텍스트 한 줄**: "주요 브랜드 : 펩시콜라, 코카콜라, 롯데칠성, 동아오츠카, 웅진식품"
5. **스펙 힌트 칩**: `용량 250ml~1.8L / 형태 캔/PET / 수량 낱개~30캔 / 당류 일반/제로` 형태. 각 항목 `<strong>` + 값.
6. **회사 구매기준 블록**: 보라색 왼쪽 2px 선 + 연한 보라 배경. "🏢 로랩스 구매기준 적용" 볼드 타이틀 + 설명. 설정(예산/에이전트정책/승인체계) + 구매기록 패턴을 참조했다는 메타 정보를 보여줌.

**중요**: 이 카드는 `SearchProgressCard` 아래 **별도 AI 버블**로 렌더링. 같은 버블 내 확장 아님.

---

### 2-3. `components/chat/ProductFilterCard.tsx`

**역할**: 2단계 맞춤 필터 카드 (채팅 인라인, 항상 노출).

**Props**
```ts
interface Props {
  brands: { name: string; logoUrl?: string }[];  // 1차 검색에서 추출한 브랜드
  categoryOptions: { groupLabel: string; options: string[] }[];
    // 예: [{groupLabel:"형태", options:["캔","PET","대용량"]}, {groupLabel:"유형", options:["탄산","제로/저당","에너지","차/주스"]}]
  defaultPriceTier: "budget" | "standard" | "premium";
  defaultBrands: string[];
  onSubmit: (filter: FilterState) => void;
}

type FilterState = {
  priceTier: "budget" | "standard" | "premium";
  brands: string[];
  options: string[];
};
```

**UI 상세**
- 헤더: `🎯 {회사명}에 맞는 상품을 고를게요. 조건을 선택해주세요`
- **가격대** (단일 선택 / 3분할 버튼 그룹):
  - 실속형 (가성비 중심, ~1만원대)
  - 일반형 (품질 균형, 1~3만원대)
  - 프리미엄 (품질 우선, 3만원 이상)
  - 기본값은 검색 결과 가격 중앙값 기준 자동 선택
  - 선택 시 보라 배경 + 흰 텍스트
- **브랜드** (복수 선택 가능 칩, 각 칩 왼쪽에 16×16 로고):
  - 검색 결과에서 추출한 상위 5~8개
  - 기본값: 상위 빈도 1개 자동 선택
- **옵션** (카테고리별 동적 그룹, 복수 선택):
  - `categoryOptions`를 받아 그룹별 칩 행 렌더링
- **CTA 버튼**: "맞춤 추천 보기 →" (검정 배경, full width)
- 미선택 항목이 있어도 CTA 활성화 (기본값 적용)

**위치**: 채팅 인라인 (우측 패널 X)

---

### 2-4. `components/chat/ProductRecommendList.tsx`

**역할**: 3단계 Top 5 상품 추천 결과 (가로 스크롤 + 스펙 비교 토글).

**Props**
```ts
interface Props {
  products: RecommendedProduct[];  // 최대 5개
  onSelectProduct: (p: RecommendedProduct) => void;
  onAddToCart: (p: RecommendedProduct) => void;
  onOpenPriceCompare: (p: RecommendedProduct) => void;
}

interface RecommendedProduct {
  id: string;
  rank: 1 | 2 | 3 | 4 | 5;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  thumbUrl: string;
  source: "internal" | "external";  // 자체 / 외부
  aiReason: string;
  aiTags: string[];  // 최대 3개
  externalPrices?: ExternalPrice[];
}
```

**UI 상세**
- 헤더: `✨ {회사명}에 맞는 추천 결과예요` + 우측에 **뷰 토글** ("추천순" | "스펙 비교")
- **추천순 뷰**: 가로 스크롤 카드 리스트
  - 카드 기본 폭 180px, 1위는 200px (보라 외곽선 강조)
  - 카드 구조 (위→아래):
    1. 랭크 뱃지 (좌상단, 20×20, 1~3위는 검정/회색/뮤트, 4~5위는 흐린 회색)
    2. 썸네일 영역 (120px 높이, 배경은 파스텔 틴트)
    3. 출처 태그 (우하단 작은 뱃지): `⚡ 자체` 또는 `🌐 외부`
    4. 상품 정보: 브랜드(10px, 회색) / 상품명(12px, 2줄 max) / 가격(15px 볼드) / 별점·리뷰수
    5. **AI 추천 이유 블록** (연한 배경, 보라 왼쪽 선 2px):
       - 레이블: `🤖 AI 추천 이유` (9px, 보라, uppercase letter-spacing)
       - 본문 1~2문장 (10.5px)
       - 태그 chips (보라 계열, 최대 3개)
    6. 액션 버튼 3개 (가로 배치, 작은 사이즈):
       - `상세` (흰 배경)
       - `최저가` (초록 연한 배경) → 클릭 시 `onOpenPriceCompare` 호출
       - `담기` (검정 배경, flex: 1)
- **스펙 비교 뷰**: 같은 카드 하단에 비교 테이블 펼침 (우측 패널 X)
  - 행: 가격 / 단가(캔) / 용량 / 수량 / 당류 / 출처 / 별점
  - 열: Top 5 상품명
  - 각 행별 최고값은 하이라이트(보라 틴트 배경)
  - 첫 열 sticky로 고정

**가로 스크롤**: overflow-x auto, 커스텀 스크롤바 (4px 높이).

---

### 2-5. `components/chat/PriceCompareModal.tsx`

**역할**: 상품 카드의 "최저가" 버튼 클릭 시 열리는 가격 비교 모달.

**Props**
```ts
interface Props {
  open: boolean;
  onClose: () => void;
  productName: string;
  prices: ExternalPrice[];  // 정렬: 최저가 우선
  onSelectExternalProduct: (p: ExternalPrice) => void;  // 외부 상품 스크래핑 트리거
}

interface ExternalPrice {
  platform: "쿠팡" | "옥션" | "G마켓" | "11번가" | string;
  price: number;
  shippingFee: number;  // 0이면 무료배송
  url: string;
  isLowest?: boolean;
}
```

**UI 상세**
- 오버레이 모달 (`position: fixed`, 반투명 검정 배경)
- 모달 박스: 460px 폭, max-height 85vh, 둥근 모서리 18px
- **헤더**: "가격 비교" 타이틀 + 상품명 서브텍스트 + 닫기(✕) 버튼
- **본문** (price-list):
  - 각 플랫폼 항목 = 로고(32×32 컬러풀) + 플랫폼명 + 배송 정보 + 가격
  - 로고 색상: 쿠팡 `#e44d2e`, 옥션 `#e61e28`, G마켓 `#009900`, 11번가 `#f00`
  - 배송: 무료면 초록색 "무료배송", 아니면 "배송비 2,500원"
  - **최저가 항목**은 초록 배경 + 빨간 가격(`#e44d2e`) + `🏷 최저가` 뱃지
  - **최저가 아래에만 "이 가격으로 선택하기 (외부 상품 정보 수집)" 버튼** 노출
    - 클릭 시 `onSelectExternalProduct` 호출 → 외부 상품 스크래핑 시작 (데모에선 토스트/콘솔)
    - 안내문: "선택 시 해당 플랫폼 상품 정보를 수집해 장바구니에 담을 수 있어요."
- **푸터 노트**: "외부 마켓 상품 선택 시 해당 플랫폼 상품 정보를 실시간 수집해요. 배송일·옵션 등 상세 정보는 수집 완료 후 확인 가능해요."

**접근성**: Esc 키로 닫기, 배경 클릭 시 닫기, focus trap.

---

## 3. ChatContainer state machine

```
type SearchFlowState =
  | { phase: "idle" }
  | { phase: "step1_progress"; progress: 1 | 2 | 3 }
  | { phase: "step1_done"; searchResult: SearchResultData }
  | { phase: "step2_filter"; searchResult: SearchResultData; filter: Partial<FilterState> }
  | { phase: "step3_results"; filter: FilterState; products: RecommendedProduct[] };
```

**전환 로직**
- 유저가 "○○ 추천해줘" 입력 → `step1_progress`로 진입, 0.8초 간격으로 progress 증가
- `progress === 3` 도달 후 200ms → `step1_done` 전환 (SearchResultSummary 버블 추가)
- 200ms 후 자동으로 `step2_filter` 전환 (ProductFilterCard 버블 추가) — **항상 노출**
- 유저가 필터 CTA 클릭 → 유저 메시지(선택값 요약) + `step3_results` 전환
- 기존 장바구니/승인 플로우는 그대로 이어짐

**더미 데이터 흐름**: 실제 API 없으므로 `setTimeout` 체인으로 시뮬레이션. `data/products.ts`에서 고정된 5개 상품을 반환.

---

## 4. 타입 정의 변경 (`lib/types.ts`)

```ts
// 기존 SourceType 축소
export type SourceType = "internal" | "external";
//  "airsupply-db", "airsupply-supplier", "api-external" 제거

// 신규
export interface SearchResultData {
  totalCount: number;
  priceRange: { min: number; max: number };
  categoryPath: string;
  brands: string[];
  thumbnails: string[];
  remainingCount: number;
  specHints: { label: string; value: string }[];
  companyPolicyNote: string;
}

export interface FilterState {
  priceTier: "budget" | "standard" | "premium";
  brands: string[];
  options: string[];
}

export interface ExternalPrice {
  platform: string;
  price: number;
  shippingFee: number;
  url: string;
  isLowest?: boolean;
}

export interface RecommendedProduct extends Product {
  rank: 1 | 2 | 3 | 4 | 5;
  source: SourceType;
  aiReason: string;
  aiTags: string[];
  externalPrices?: ExternalPrice[];
}
```

---

## 5. ChatContextSidebar 수정

- `searchSteps` 배열의 label 변경:
  ```ts
  const searchSteps = [
    { key: "analyzing",  label: "검색 키워드 생성", icon: Sparkles },
    { key: "searching",  label: "카테고리 탐색",    icon: Search },
    { key: "results",    label: "구매기준 확인",    icon: Package },
  ] as const;
  ```
- `SearchRecord` 타입에서 `sources: { name, count, color }[]` 필드 — 유저 노출 안 함 (내부 로깅용으로만 유지)

---

## 6. 인터랙션 규칙 (CLAUDE.md 준수)

- 모든 버튼 `cursor-pointer` + hover 효과
- 미구현 액션은 `<Tooltip>` 으로 "예정: [설명]" 표시
- 반응형 데스크톱 우선 (360~720px 정도의 채팅 영역 폭 커버)
- 모달은 z-index 100, 오버레이 클릭 시 닫기

---

## 7. 검증 체크리스트 (작업 완료 후 반드시 확인)

1. [ ] `npm run dev` 로 띄운 후 `/chat`에서 유저 메시지 입력 시 검색 플로우 정상 작동
2. [ ] 1단계 → 2단계 → 3단계 순서로 AI 메시지가 자연스럽게 쌓임
3. [ ] 어떤 내부 DB명(`에어서플라이 DB`, `입점 공급사`, `api-external`)도 UI에 노출되지 않음
4. [ ] 필터 카드에서 가격대/브랜드/옵션 선택 후 CTA 클릭 → 3단계 결과 생성
5. [ ] 상품 카드 내 "최저가" 버튼 클릭 시 모달 열림, 다른 상품도 각자 모달 작동
6. [ ] 모달 최저가 "이 가격으로 선택하기" 버튼 클릭 시 콘솔 or 토스트로 스크래핑 시작 안내
7. [ ] "스펙 비교" 토글 시 같은 카드 하단에 비교표 펼침, 다시 누르면 닫힘
8. [ ] TypeScript 컴파일 에러 없음 (`npx tsc --noEmit`)
9. [ ] ESLint 경고 없음 (`npm run lint`)
10. [ ] `PROGRESS.md` 업데이트 — `fix-3 채팅 검색 플로우 개편` 항목 추가하고 완료 표시, 설계 결정 로그에도 추가

---

## 8. 기존 컴포넌트 호환성

- `SourcedProductCard.tsx`의 기존 scraping UI(`ScrapingIndicator`, `scrapedSpecs` 등)는 **제거하지 말고 내부 로직으로만 유지**. 기존 테스트/스토리북이 있다면 깨지지 않게 함.
- 기존에 `SourceType === "airsupply-db"` 같은 조건 분기가 있다면 전부 `internal | external`로 매핑:
  - `airsupply-db`, `airsupply-supplier` → `internal`
  - `api-external` → `external`

---

## 9. 참고 자료

- 시각 기획: `docs/search-flow-planning-v2.html` (브라우저로 열어 인터랙션 확인 가능)
- 디자인 토큰: `DESIGN.md` (색상/타이포/섀도)
- 현재 컴포넌트: `components/chat/*`, `components/chat/SourcedProductCard.tsx`
- 더미 데이터: `data/products.ts`

---

## 10. 커밋 전략

한 번에 한 덩어리씩 커밋:
1. `feat(types): search flow 신규 타입 정의`
2. `feat(chat): SearchProgressCard / SearchResultSummary 추가`
3. `feat(chat): ProductFilterCard 추가`
4. `feat(chat): ProductRecommendList + PriceCompareModal 추가`
5. `refactor(chat): ChatContainer state machine 및 기존 SourcedProductCard 축소 연동`
6. `docs: PROGRESS.md 업데이트`

---

**작업 시작 전 반드시 기획 문서 `docs/search-flow-planning-v2.html` 를 확인한 뒤 진행할 것. UI 의도는 기획 문서가 최상위 참조 자료다.**
