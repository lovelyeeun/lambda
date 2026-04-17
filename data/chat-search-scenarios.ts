import { type SourcedProduct } from "@/components/chat/SourcedProductCard";

type InternalScenarioProduct = Omit<SourcedProduct, "source" | "options" | "aiNote"> & {
  source: "internal";
  options: string[];
  aiNote: string;
};

type ExternalScenarioProduct = Omit<SourcedProduct, "source" | "aiNote" | "scrapingSteps"> & {
  source: "external";
  aiNote: string;
  scrapingSteps: { label: string; done: boolean }[];
};

export type ScenarioProduct = InternalScenarioProduct | ExternalScenarioProduct;

export interface SearchScenario {
  keywords: string[];
  intent: string;
  products: ScenarioProduct[];
  candidates: ScenarioProduct[];
}

export const DEMO_SCENARIO_KEYWORDS = [
  "사무용 의자",
  "청소기",
  "모니터",
  "토너",
  "A4용지",
  "노트북",
  "데스크",
  "포스트잇",
  "태블릿",
  "정수기",
] as const;

export const searchScenarios: SearchScenario[] = [
  {
    keywords: ["청소기", "청소"],
    intent: "사무실 청소기 구매 요청 — 기업용 무선 청소기, 사무공간 적합 모델 중심으로 검색합니다.",
    products: [
      {
        id: "src-v01", name: "삼성 비스포크 제트 무선 청소기 VS20A95973B", price: 698000, originalPrice: 799000,
        brand: "삼성전자", category: "생활가전", source: "internal", sourceLabel: "자체",
        purchaseCount: 34, deliveryFee: 0, deliveryDays: 2, options: ["미드나이트블루", "코사 핑크", "새틴 그레이"],
        savingsPercent: 13, isRecommended: true,
        aiNote: "최근 30일 동종업계 34회 구매 — 가장 많이 선택된 모델. 귀사 유사 규모 기업의 82%가 이 제품을 선택했습니다.",
      },
      {
        id: "src-v02", name: "LG 코드제로 A9S 올인원타워 AS9571GKE", price: 729000,
        brand: "LG전자", category: "생활가전", source: "internal", sourceLabel: "자체",
        deliveryFee: 0, deliveryDays: 3, options: ["카밍 그린", "판타지 실버"], purchaseCount: 18, savingsPercent: 8,
        aiNote: "입점 공급사 직거래 — A/S 직접 연결 가능. LG 선호 기업이라면 유리합니다.",
      },
      {
        id: "src-v03", name: "다이슨 V15 디텍트 컴플리트 무선 청소기", price: 659000,
        brand: "다이슨", category: "생활가전", source: "external", platform: "쿠팡",
        platformUrl: "https://www.coupang.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "쿠팡 최저가 — 상세 옵션과 배송 조건은 정보 수집 후 확인 가능합니다.",
      },
    ],
    candidates: [
      {
        id: "src-v04", name: "일렉트로룩스 에르고라피도 ZB3320P", price: 289000,
        brand: "일렉트로룩스", category: "생활가전", source: "internal", sourceLabel: "자체",
        purchaseCount: 5, deliveryFee: 3000, deliveryDays: 3, options: ["기본형", "저소음 브러시 포함"], savingsPercent: 6,
        aiNote: "가성비 옵션 — 소규모 사무실용. 저소음 모드 탑재.",
      },
      {
        id: "src-v05", name: "샤오미 미지아 무선 청소기 프로", price: 198000,
        brand: "샤오미", category: "생활가전", source: "external", platform: "11번가",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "초저가 옵션 — 기업 구매 이력 없음. 브랜드 신뢰도 확인 필요.",
      },
      {
        id: "src-v06", name: "보쉬 Unlimited Serie 8 BBS812PCK", price: 879000,
        brand: "보쉬", category: "생활가전", source: "internal", sourceLabel: "자체",
        purchaseCount: 2, deliveryFee: 0, deliveryDays: 5, options: ["기본형", "배터리 2개 번들"], savingsPercent: 4,
        aiNote: "프리미엄 옵션 — 교체형 배터리 시스템. 넓은 공간에 적합.",
      },
      {
        id: "src-v07", name: "테팔 에어포스 360 TY5516", price: 349000,
        brand: "테팔", category: "생활가전", source: "external", platform: "쿠팡",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "중가 옵션 — 가격 대비 흡입력 우수. 기업 구매 이력 3건.",
      },
    ],
  },
  {
    keywords: ["모니터", "디스플레이"],
    intent: "모니터 구매 요청 — 27인치 이상 4K 사무용 모니터 중심으로 비교 검색합니다.",
    products: [
      {
        id: "src-m01", name: "LG 27인치 4K UHD 모니터 27UP850", price: 459000,
        brand: "LG전자", category: "전자기기", source: "internal", sourceLabel: "자체",
        purchaseCount: 52, deliveryFee: 0, deliveryDays: 2, options: ["실버", "블랙"],
        savingsPercent: 11, isRecommended: true,
        aiNote: "사내 52회 구매 이력 — 개발팀·디자인팀 표준 모니터. USB-C PD 지원으로 노트북 충전 가능.",
      },
      {
        id: "src-m02", name: "삼성 ViewFinity S8 27인치 S80UA", price: 489000,
        brand: "삼성전자", category: "전자기기", source: "internal", sourceLabel: "자체",
        deliveryFee: 0, deliveryDays: 3, options: ["블랙"], purchaseCount: 28, savingsPercent: 7,
        aiNote: "입점 공급사 직거래가. HDR10+ 지원, 컬러 작업에 유리.",
      },
      {
        id: "src-m03", name: "Dell UltraSharp U2723QE 27인치 4K", price: 519000,
        brand: "Dell", category: "전자기기", source: "external", platform: "네이버쇼핑",
        platformUrl: "https://shopping.naver.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "네이버쇼핑 최저가 — IPS Black 패널, 색재현율 98% DCI-P3.",
      },
    ],
    candidates: [
      {
        id: "src-m04", name: "BenQ PD2705U 27인치 4K 디자이너 모니터", price: 689000,
        brand: "BenQ", category: "전자기기", source: "internal", sourceLabel: "자체",
        purchaseCount: 8, deliveryFee: 0, deliveryDays: 4, options: ["기본 스탠드", "후드 번들"], savingsPercent: 5,
        aiNote: "디자인팀 특화 — Pantone 인증. 가격대가 높으나 색 정확도 최상.",
      },
      {
        id: "src-m05", name: "LG 27GP850 27인치 QHD 게이밍 모니터", price: 389000,
        brand: "LG전자", category: "전자기기", source: "internal", sourceLabel: "자체",
        purchaseCount: 3, deliveryFee: 0, deliveryDays: 2, options: ["기본 스탠드", "모니터암 번들"],
        aiNote: "QHD(비4K) — 해상도 요건 미달 가능. 가격 절감 옵션으로 참고.",
      },
      {
        id: "src-m06", name: "HP Z27k G3 27인치 4K USB-C", price: 579000,
        brand: "HP", category: "전자기기", source: "external", platform: "11번가",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "HP 생태계 사용 기업에 적합. Thunderbolt 4 지원.",
      },
    ],
  },
  {
    keywords: ["의자", "사무용의자", "체어"],
    intent: "사무용 의자 구매 요청 — 인체공학 메쉬 사무용 의자, 장시간 착석 기준으로 검색합니다.",
    products: [
      {
        id: "src-c01", name: "시디즈 T50 AIR 메쉬 사무용 의자", price: 498000,
        brand: "시디즈", category: "가구", source: "internal", sourceLabel: "자체",
        purchaseCount: 67, deliveryFee: 0, deliveryDays: 5, options: ["블랙 메쉬", "그레이 메쉬"],
        savingsPercent: 15, isRecommended: true,
        aiNote: "사내 67회 구매 — 가장 많이 선택된 사무용 의자. 10년 A/S 보장.",
      },
      {
        id: "src-c02", name: "퍼시스 CHN4300A 메쉬 의자", price: 380000,
        brand: "퍼시스", category: "가구", source: "internal", sourceLabel: "자체",
        deliveryFee: 30000, deliveryDays: 7, options: ["블랙"], purchaseCount: 23,
        aiNote: "입점 공급사 직거래. 대량 구매 시 추가 할인 가능.",
      },
      {
        id: "src-c03", name: "허먼밀러 에어론 리마스터드 풀옵션", price: 1890000,
        brand: "허먼밀러", category: "가구", source: "external", platform: "구글쇼핑",
        platformUrl: "https://shopping.google.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "프리미엄 옵션 — 12년 보증. 예산 범위 확인 필요.",
      },
    ],
    candidates: [
      {
        id: "src-c04", name: "듀오백 D2 메쉬 의자 DK-2500", price: 259000,
        brand: "듀오백", category: "가구", source: "internal", sourceLabel: "자체",
        purchaseCount: 41, deliveryFee: 0, deliveryDays: 4, options: ["블랙", "그레이"], savingsPercent: 10,
        aiNote: "가성비 1위 — 사내 41회 구매. 기본 기능 충실.",
      },
      {
        id: "src-c05", name: "이케아 MARKUS 사무용 의자", price: 199000,
        brand: "이케아", category: "가구", source: "external", platform: "이케아코리아",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false }, { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false }, { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "최저가 옵션 — 기업 구매 시 배송비 별도. 조립 필요.",
      },
      {
        id: "src-c06", name: "스틸케이스 Leap V2 풀옵션", price: 1590000,
        brand: "스틸케이스", category: "가구", source: "internal", sourceLabel: "자체",
        purchaseCount: 1, deliveryFee: 0, deliveryDays: 10, options: ["블랙", "헤드레스트 포함"],
        aiNote: "프리미엄 대안 — 허먼밀러와 비교 대상. 납품 10일 소요.",
      },
      {
        id: "src-c07", name: "코아스 CKF1060 메쉬 의자", price: 169000,
        brand: "코아스", category: "가구", source: "internal", sourceLabel: "자체",
        purchaseCount: 15, deliveryFee: 5000, deliveryDays: 3, options: ["블랙", "그레이"],
        aiNote: "대량 구매 최적 — 10개 이상 시 개당 15만원. 사내 15회 구매.",
      },
    ],
  },
  {
    keywords: ["토너", "잉크", "카트리지", "hp 206a"],
    intent: "토너 구매 요청 — 호환 기종과 재고, 정품 여부, 외부 최저가 순으로 확인합니다.",
    products: [
      {
        id: "prod-002", name: "HP 206A 정품 토너 검정", price: 89000,
        brand: "HP", category: "잉크/토너", source: "internal", sourceLabel: "자체",
        purchaseCount: 49, deliveryFee: 0, deliveryDays: 1, options: ["검정", "검정 2개입", "검정+컬러 세트"],
        savingsPercent: 7, isRecommended: true,
        aiNote: "사내 프린터 호환 이력이 가장 많고, 긴급 교체 요청에서 가장 자주 선택된 정품 토너입니다.",
      },
      {
        id: "src-t02", name: "HP 206X 대용량 정품 토너 검정", price: 129000,
        brand: "HP", category: "잉크/토너", source: "internal", sourceLabel: "입점",
        purchaseCount: 18, deliveryFee: 0, deliveryDays: 2, options: ["검정 대용량"],
        savingsPercent: 4,
        aiNote: "교체 빈도를 줄이고 싶을 때 추천하는 대용량 옵션입니다. 출력량이 많은 팀에 유리해요.",
      },
      {
        id: "src-t03", name: "HP 206A 호환 토너 검정", price: 39000,
        brand: "프린텍", category: "잉크/토너", source: "external", platform: "11번가",
        platformUrl: "https://www.11st.co.kr/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "호환·리뷰 정보 수집", done: false },
        ],
        aiNote: "외부 최저가 대안입니다. 호환 토너라 리뷰와 불량률 확인이 먼저 필요해요.",
      },
    ],
    candidates: [
      {
        id: "src-t04", name: "삼성 CLT-K504S 정품 토너 검정", price: 76000,
        brand: "Samsung", category: "잉크/토너", source: "internal", sourceLabel: "입점",
        purchaseCount: 9, deliveryFee: 0, deliveryDays: 2, options: ["검정"],
        aiNote: "삼성 장비용 대안입니다. 현재 검색 모델과 기종 호환은 별도 확인이 필요해요.",
      },
      {
        id: "src-t05", name: "HP 206A 정품 컬러 3색 세트", price: 249000,
        brand: "HP", category: "잉크/토너", source: "internal", sourceLabel: "자체",
        purchaseCount: 7, deliveryFee: 0, deliveryDays: 3, options: ["CMY 세트"],
        aiNote: "블랙만이 아니라 컬러 교체 주기가 같이 도래했을 때 쓰는 세트 옵션입니다.",
      },
      {
        id: "src-t06", name: "HP 206A 재생 토너 검정", price: 32000,
        brand: "재생토너몰", category: "잉크/토너", source: "external", platform: "쿠팡",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "호환·리뷰 정보 수집", done: false },
        ],
        aiNote: "가장 저렴하지만 재생 토너라 품질 편차가 있을 수 있습니다.",
      },
    ],
  },
  {
    keywords: ["a4", "a4 용지", "용지", "복사용지", "복사지"],
    intent: "A4 용지 구매 요청 — 사내 재구매 이력과 납기, 외부 최저가까지 순서대로 확인합니다.",
    products: [
      {
        id: "prod-001", name: "더블에이 A4 복사용지 80g 500매", price: 12900,
        brand: "Double A", category: "용지", source: "internal", sourceLabel: "자체",
        purchaseCount: 84, deliveryFee: 0, deliveryDays: 1, options: ["80g 기본형", "대량 5팩 묶음", "친환경 인증형"],
        savingsPercent: 9, isRecommended: true,
        aiNote: "사내 표준 규격이라 승인과 재주문이 가장 매끄럽습니다. 경영지원팀 기준 월 평균 20팩씩 반복 구매했어요.",
      },
      {
        id: "src-p02", name: "한국제지 밀크 A4 80g 2,500매", price: 27500,
        brand: "한국제지", category: "용지", source: "internal", sourceLabel: "입점",
        purchaseCount: 27, deliveryFee: 0, deliveryDays: 2, options: ["2,500매 박스", "고백색형"],
        savingsPercent: 6,
        aiNote: "대량 인쇄가 많은 팀에서 박스 단위로 많이 선택하는 대안입니다.",
      },
      {
        id: "src-p03", name: "삼성물산 A4 복사용지 80g 2500매", price: 23900,
        brand: "삼성물산", category: "용지", source: "external", platform: "쿠팡",
        platformUrl: "https://www.coupang.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "외부 마켓 최저가 후보입니다. 묶음 구성과 배송 조건은 상세 수집 후 확정할 수 있어요.",
      },
    ],
    candidates: [
      {
        id: "src-p04", name: "더블에이 A4 복사용지 75g 500매", price: 11800,
        brand: "Double A", category: "용지", source: "internal", sourceLabel: "자체",
        purchaseCount: 11, deliveryFee: 3000, deliveryDays: 2, options: ["75g 경량형"],
        aiNote: "예산 절감용 대안입니다. 얇은 용지라 양면 인쇄 많은 팀에는 비추천이에요.",
      },
      {
        id: "src-p05", name: "Mondi Color Copy A4 100g 500매", price: 16400,
        brand: "Mondi", category: "용지", source: "internal", sourceLabel: "입점",
        purchaseCount: 5, deliveryFee: 0, deliveryDays: 3, options: ["100g 프리미엄"],
        aiNote: "제안서나 외부 제출 문서처럼 두께감이 필요한 팀에 적합합니다.",
      },
      {
        id: "src-p06", name: "밀크 친환경 A4 복사용지 80g 2500매", price: 28900,
        brand: "한국제지", category: "용지", source: "external", platform: "네이버쇼핑",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "친환경 조달 기준이 있을 때 비교할 만한 외부 옵션입니다.",
      },
    ],
  },
  {
    keywords: ["노트북", "랩탑", "컴퓨터"],
    intent: "노트북 구매 요청 — 휴대성, 성능, 사내 표준 스펙 기준으로 비교 검색합니다.",
    products: [
      {
        id: "prod-013", name: "LG gram Pro 16인치 노트북", price: 1890000,
        brand: "LG", category: "전자기기", source: "internal", sourceLabel: "자체",
        purchaseCount: 16, deliveryFee: 0, deliveryDays: 2, options: ["16인치 기본형", "RTX 탑재형", "도킹 번들"],
        savingsPercent: 8, isRecommended: true,
        aiNote: "사내 업무 표준 스펙과 가장 잘 맞는 주력 노트북입니다. 이동성과 성능 균형이 좋아요.",
      },
      {
        id: "src-l02", name: "삼성 갤럭시북4 Pro 16", price: 1790000,
        brand: "Samsung", category: "전자기기", source: "internal", sourceLabel: "입점",
        purchaseCount: 11, deliveryFee: 0, deliveryDays: 3, options: ["16인치 기본형", "메모리 업그레이드형"],
        savingsPercent: 5,
        aiNote: "삼성 생태계 사용 조직에서 선호하는 대안입니다. 휴대성과 배터리 만족도가 높아요.",
      },
      {
        id: "src-l03", name: "Lenovo ThinkPad X1 Carbon Gen 12", price: 2090000,
        brand: "Lenovo", category: "전자기기", source: "external", platform: "네이버쇼핑",
        platformUrl: "https://shopping.naver.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "기업용 노트북 대표 외부 대안입니다. 내구성과 키감 평이 좋아요.",
      },
    ],
    candidates: [
      {
        id: "src-l04", name: "Apple MacBook Air 15 M3", price: 1990000,
        brand: "Apple", category: "전자기기", source: "internal", sourceLabel: "입점",
        purchaseCount: 6, deliveryFee: 0, deliveryDays: 4, options: ["15인치 16GB", "15인치 24GB"],
        aiNote: "디자인/마케팅 직군 선호도가 높지만 운영체제 호환성 확인이 필요합니다.",
      },
      {
        id: "src-l05", name: "HP EliteBook 840 G11", price: 1690000,
        brand: "HP", category: "전자기기", source: "internal", sourceLabel: "자체",
        purchaseCount: 7, deliveryFee: 0, deliveryDays: 3, options: ["14인치 기본형", "독 포함"],
        aiNote: "보안과 관리 편의성이 강점인 기업용 대안입니다.",
      },
      {
        id: "src-l06", name: "Dell XPS 14", price: 2290000,
        brand: "Dell", category: "전자기기", source: "external", platform: "11번가",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "프리미엄 외부 대안입니다. 고해상도 패널과 마감 만족도가 높아요.",
      },
    ],
  },
  {
    keywords: ["데스크", "책상"],
    intent: "데스크 구매 요청 — 높이조절 여부와 상판 구성, 설치 편의성 기준으로 검색합니다.",
    products: [
      {
        id: "prod-010", name: "한화 전동 높이조절 데스크 HED-1200", price: 389000,
        brand: "한화", category: "가구", source: "internal", sourceLabel: "자체",
        purchaseCount: 12, deliveryFee: 0, deliveryDays: 4, options: ["화이트 상판", "우드 상판", "케이블 트레이 포함"],
        savingsPercent: 9, isRecommended: true,
        aiNote: "사내에서 가장 무난하게 쓰는 전동 데스크입니다. 설치 난이도와 가격 균형이 좋아요.",
      },
      {
        id: "src-d02", name: "퍼시스 모션데스크 1400", price: 529000,
        brand: "퍼시스", category: "가구", source: "internal", sourceLabel: "입점",
        purchaseCount: 8, deliveryFee: 0, deliveryDays: 6, options: ["1400 화이트", "1400 우드"],
        savingsPercent: 4,
        aiNote: "내구성과 사무실 인테리어 적합성이 장점인 대안입니다.",
      },
      {
        id: "src-d03", name: "이케아 BEKANT 전동 높이조절 책상", price: 459000,
        brand: "이케아", category: "가구", source: "external", platform: "이케아코리아",
        platformUrl: "https://www.ikea.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "외부에서 많이 비교하는 데스크입니다. 배송비와 설치 방식 확인이 필요해요.",
      },
    ],
    candidates: [
      {
        id: "src-d04", name: "코아스 스탠딩 데스크 1200", price: 329000,
        brand: "코아스", category: "가구", source: "internal", sourceLabel: "자체",
        purchaseCount: 10, deliveryFee: 0, deliveryDays: 5, options: ["1200 화이트", "1200 블랙"],
        aiNote: "실속형 대안입니다. 예산을 낮추고 싶을 때 적합해요.",
      },
      {
        id: "src-d05", name: "데스커 베이직 데스크 1400", price: 219000,
        brand: "DESKER", category: "가구", source: "internal", sourceLabel: "입점",
        purchaseCount: 14, deliveryFee: 0, deliveryDays: 3, options: ["화이트", "메이플"],
        aiNote: "고정형 책상 기준에서는 가장 인기 있는 대안입니다.",
      },
      {
        id: "src-d06", name: "FlexiSpot E7 Pro", price: 639000,
        brand: "FlexiSpot", category: "가구", source: "external", platform: "쿠팡",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "프리미엄 전동데스크 외부 대안입니다. 하중과 안정성이 장점이에요.",
      },
    ],
  },
  {
    keywords: ["포스트잇", "메모지"],
    intent: "포스트잇 구매 요청 — 규격, 점착력, 대량구매 단가 기준으로 검색합니다.",
    products: [
      {
        id: "prod-007", name: "3M 포스트잇 강한점착용 76×76mm 5팩", price: 8900,
        brand: "3M", category: "사무용품", source: "internal", sourceLabel: "자체",
        purchaseCount: 35, deliveryFee: 0, deliveryDays: 1, options: ["노랑 5팩", "네온 5색", "라인 노트형"],
        savingsPercent: 6, isRecommended: true,
        aiNote: "가장 많이 재구매되는 표준 규격입니다. 점착력이 안정적이라 사무실 공용으로 적합해요.",
      },
      {
        id: "src-s02", name: "3M 포스트잇 654 대용량 10팩", price: 14900,
        brand: "3M", category: "사무용품", source: "internal", sourceLabel: "입점",
        purchaseCount: 19, deliveryFee: 0, deliveryDays: 2, options: ["노랑 10팩", "혼합색 10팩"],
        savingsPercent: 8,
        aiNote: "대량구매 기준 단가가 가장 좋은 대안입니다.",
      },
      {
        id: "src-s03", name: "모닝글로리 점착 메모지 76×76 12팩", price: 7900,
        brand: "모닝글로리", category: "사무용품", source: "external", platform: "쿠팡",
        platformUrl: "https://www.coupang.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "리뷰·상세 정보 수집", done: false },
        ],
        aiNote: "최저가 외부 대안입니다. 점착력 리뷰 확인이 먼저 필요해요.",
      },
    ],
    candidates: [
      {
        id: "src-s04", name: "3M 포스트잇 플래그 세트", price: 6200,
        brand: "3M", category: "사무용품", source: "internal", sourceLabel: "자체",
        purchaseCount: 9, deliveryFee: 0, deliveryDays: 2, options: ["형광 플래그", "인덱스 플래그"],
        aiNote: "문서 표시용 용도가 강한 대안입니다.",
      },
      {
        id: "src-s05", name: "더블에이 접착 메모노트 5팩", price: 5400,
        brand: "Double A", category: "사무용품", source: "internal", sourceLabel: "입점",
        purchaseCount: 6, deliveryFee: 3000, deliveryDays: 3, options: ["기본형", "컬러형"],
        aiNote: "가성비 중심 대안입니다. 내구성은 3M 대비 조금 약해요.",
      },
      {
        id: "src-s06", name: "네이버 브랜드스토어 강한점착 메모지", price: 8300,
        brand: "오피스존", category: "사무용품", source: "external", platform: "네이버쇼핑",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "리뷰·상세 정보 수집", done: false },
        ],
        aiNote: "강한점착 외부 대안입니다. 번들 구성과 리뷰 편차를 봐야 해요.",
      },
    ],
  },
  {
    keywords: ["태블릿", "갤럭시탭", "아이패드"],
    intent: "태블릿 구매 요청 — 휴대성, 펜 사용성, 업무용 액세서리 기준으로 검색합니다.",
    products: [
      {
        id: "prod-008", name: "삼성 갤럭시탭 S9 FE 10.9인치", price: 549000,
        brand: "Samsung", category: "전자기기", source: "internal", sourceLabel: "자체",
        purchaseCount: 13, deliveryFee: 0, deliveryDays: 2, options: ["128GB Wi-Fi", "128GB 5G", "키보드 커버 번들"],
        savingsPercent: 7, isRecommended: true,
        aiNote: "업무 메모와 회의용으로 가장 무난한 태블릿입니다. S펜 포함이라 도입 장벽이 낮아요.",
      },
      {
        id: "src-tab02", name: "Apple iPad Air 11 M2", price: 899000,
        brand: "Apple", category: "전자기기", source: "internal", sourceLabel: "입점",
        purchaseCount: 8, deliveryFee: 0, deliveryDays: 3, options: ["Wi-Fi 128GB", "펜슬 프로 번들"],
        savingsPercent: 4,
        aiNote: "디자인/영업 직군에서 선호도가 높은 프리미엄 대안입니다.",
      },
      {
        id: "src-tab03", name: "레노버 Tab P12", price: 429000,
        brand: "Lenovo", category: "전자기기", source: "external", platform: "11번가",
        platformUrl: "https://www.11st.co.kr/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "예산 중심 외부 대안입니다. 액세서리 호환성 확인이 필요해요.",
      },
    ],
    candidates: [
      {
        id: "src-tab04", name: "Xiaomi Pad 6", price: 399000,
        brand: "Xiaomi", category: "전자기기", source: "internal", sourceLabel: "입점",
        purchaseCount: 4, deliveryFee: 0, deliveryDays: 3, options: ["Wi-Fi 128GB", "키보드 번들"],
        aiNote: "가성비 중심 태블릿입니다. 기업 관리툴 호환성은 확인이 필요합니다.",
      },
      {
        id: "src-tab05", name: "iPad 10세대 10.9인치", price: 599000,
        brand: "Apple", category: "전자기기", source: "internal", sourceLabel: "자체",
        purchaseCount: 5, deliveryFee: 0, deliveryDays: 2, options: ["Wi-Fi 64GB", "Wi-Fi 256GB"],
        aiNote: "기본 업무용으로 무난한 애플 대안입니다.",
      },
      {
        id: "src-tab06", name: "Surface Go 4", price: 829000,
        brand: "Microsoft", category: "전자기기", source: "external", platform: "네이버쇼핑",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "상세 스펙 수집", done: false },
        ],
        aiNote: "윈도우 기반 태블릿이 필요할 때 비교할 외부 대안입니다.",
      },
    ],
  },
  {
    keywords: ["정수기"],
    intent: "정수기 구매 요청 — 관리 방식, 렌탈 조건, 설치 편의성 기준으로 검색합니다.",
    products: [
      {
        id: "prod-009", name: "코웨이 아이콘 정수기 CHP-7210N", price: 38900,
        brand: "코웨이", category: "생활용품", source: "internal", sourceLabel: "자체",
        purchaseCount: 9, deliveryFee: 0, deliveryDays: 5, options: ["방문관리형", "자가관리형", "얼음 기능 포함"],
        savingsPercent: 5, isRecommended: true,
        aiNote: "사무실 도입 이력이 가장 많은 렌탈형 정수기입니다. 관리 안정성이 장점이에요.",
      },
      {
        id: "src-w02", name: "SK매직 올인원 직수정수기", price: 32900,
        brand: "SK매직", category: "생활용품", source: "internal", sourceLabel: "입점",
        purchaseCount: 6, deliveryFee: 0, deliveryDays: 6, options: ["방문관리형", "자가관리형"],
        savingsPercent: 7,
        aiNote: "예산을 낮추고 싶을 때 가장 많이 비교하는 대안입니다.",
      },
      {
        id: "src-w03", name: "브리타 정수기 디스펜서형", price: 129000,
        brand: "BRITA", category: "생활용품", source: "external", platform: "쿠팡",
        platformUrl: "https://www.coupang.com/...",
        scrapingStatus: "idle", scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "리뷰·상세 정보 수집", done: false },
        ],
        aiNote: "비렌탈 외부 대안입니다. 필터 교체 주기와 용량 확인이 필요해요.",
      },
    ],
    candidates: [
      {
        id: "src-w04", name: "청호나이스 직수정수기", price: 35900,
        brand: "청호나이스", category: "생활용품", source: "internal", sourceLabel: "입점",
        purchaseCount: 5, deliveryFee: 0, deliveryDays: 7, options: ["방문관리형", "냉온정수"],
        aiNote: "정수 성능 평이 좋은 대안입니다.",
      },
      {
        id: "src-w05", name: "LG 퓨리케어 오브제컬렉션 정수기", price: 45900,
        brand: "LG", category: "생활용품", source: "internal", sourceLabel: "자체",
        purchaseCount: 4, deliveryFee: 0, deliveryDays: 6, options: ["방문관리형", "얼음 기능 포함"],
        aiNote: "프리미엄 디자인 선호 시 비교할 대안입니다.",
      },
      {
        id: "src-w06", name: "쿠쿠 인스퓨어 정수기", price: 31900,
        brand: "쿠쿠", category: "생활용품", source: "external", platform: "11번가",
        scrapingStatus: "idle" as const, scrapingProgress: 0,
        scrapingSteps: [
          { label: "상품 페이지 접속", done: false },
          { label: "가격·옵션 정보 추출", done: false },
          { label: "배송비·배송일 확인", done: false },
          { label: "리뷰·상세 정보 수집", done: false },
        ],
        aiNote: "외부 최저가 렌탈 대안입니다. 약정 조건 확인이 필요해요.",
      },
    ],
  },
];

function findScenario(text: string): SearchScenario | null {
  const lower = text.toLowerCase();
  for (const sc of searchScenarios) {
    if (sc.keywords.some((kw) => lower.includes(kw))) return sc;
  }
  return null;
}

export function validateDemoScenarios() {
  const missingCoverage = DEMO_SCENARIO_KEYWORDS.filter((keyword) => !findScenario(keyword));
  const warnings: string[] = [];

  if (missingCoverage.length > 0) {
    warnings.push(`미커버 키워드: ${missingCoverage.join(", ")}`);
  }

  searchScenarios.forEach((scenario) => {
    const scenarioLabel = scenario.keywords[0] ?? "unknown";
    const scenarioProducts = [...scenario.products, ...scenario.candidates];

    if (scenarioProducts.length < 4) {
      warnings.push(`[${scenarioLabel}] 추천 후보 4개 미만: ${scenarioProducts.length}개`);
    }
    if (!scenarioProducts.some((product) => product.source === "external")) {
      warnings.push(`[${scenarioLabel}] external 상품 누락`);
    }

    scenarioProducts.forEach((product) => {
      if (!product.aiNote) warnings.push(`[${scenarioLabel}] aiNote 누락: ${product.name}`);
      if (product.source === "internal" && (!product.options || product.options.length === 0)) {
        warnings.push(`[${scenarioLabel}] internal options 누락: ${product.name}`);
      }
      if (product.source === "external" && (!product.scrapingSteps || product.scrapingSteps.length === 0)) {
        warnings.push(`[${scenarioLabel}] external scrapingSteps 누락: ${product.name}`);
      }
    });
  });

  return warnings;
}
