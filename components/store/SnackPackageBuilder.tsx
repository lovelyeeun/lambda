"use client";

/* ═════════════════════════════════════════════════
   간식 패키지 빌더 — /store?tab=간식+패키지
   4단계 위자드: 인원/예산 → 비율 조정 → 상품 추천 → 완료
   ═════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Sparkles, Check, ChevronLeft, RefreshCw, X, Info, Truck,
} from "lucide-react";

/* ─── 데이터 ─── */

type PresetKey = "daily" | "health" | "meeting" | "energy" | "hosting";
type CategoryKey = "sweet" | "salty" | "health" | "drink" | "other";

interface SnackProduct {
  id: string;
  name: string;
  price: number;
  tag: string;
  sub: string;
}

const PRESET_RATIOS: Record<PresetKey, [number, number, number, number, number]> = {
  daily:   [40, 27, 18, 11, 4],
  meeting: [30, 20, 15, 15, 20],
  health:  [15, 20, 45, 15, 5],
  energy:  [20, 25, 20, 10, 25],
  hosting: [38, 17, 10, 20, 15],
};

const PRESET_META: Record<PresetKey, { icon: string; label: string; tag: string }> = {
  daily:   { icon: "🍪", label: "사무실\n일상 간식", tag: "일상" },
  health:  { icon: "🥗", label: "건강한\n간식", tag: "건강" },
  meeting: { icon: "⚡", label: "집중을 위한\n에너지", tag: "에너지" },
  energy:  { icon: "☕", label: "회의하며\n먹는 간식", tag: "회의" },
  hosting: { icon: "🎁", label: "고객 응대를 위한 간식", tag: "응대" },
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  sweet: "달달한 간식",
  salty: "짭짤/고소한 간식",
  health: "건강/포만 간식",
  drink: "음료",
  other: "기타 (예비)",
};

const SNACK_POOL: Record<Exclude<CategoryKey, "other">, SnackProduct[]> = {
  sweet: [
    { id: "sn-s1",  name: "롯데 빈츠 102g×8입",       price: 17380, tag: "달달·고소",   sub: "102g×8입" },
    { id: "sn-s2",  name: "삼립 옛날밤만쥬 750g",     price: 8080,  tag: "달달·한입",   sub: "750g" },
    { id: "sn-s3",  name: "오리온 몽쉘 오리지널 408g", price: 5580,  tag: "달달·한입",   sub: "408g" },
    { id: "sn-s4",  name: "해태 오예스 30g×48입",     price: 16080, tag: "달달·한입",   sub: "30g×48입" },
    { id: "sn-s5",  name: "오리온 후레쉬베리 840g",   price: 12680, tag: "달달·공유형", sub: "840g" },
    { id: "sn-s6",  name: "노브랜드 카스타드",        price: 3480,  tag: "달달·한입",   sub: "기본" },
    { id: "sn-s7",  name: "킷캣 녹차 527g",           price: 15100, tag: "달달·고소",   sub: "527g" },
    { id: "sn-s8",  name: "크라운 쿠크다스 케이크 616g", price: 11280, tag: "달달·개별포장", sub: "616g" },
    { id: "sn-s9",  name: "로투스 비스킷 156g×6입",   price: 10180, tag: "달달·개별포장", sub: "156g×6입" },
    { id: "sn-s10", name: "엠앤엠즈 피라미드 밀크 945g", price: 22780, tag: "달달·공유형", sub: "945g" },
    { id: "sn-s11", name: "마이쮸 캔털루프멜론 284g×2", price: 8480, tag: "달달·한입",   sub: "284g×2" },
    { id: "sn-s12", name: "이클립스 쿨링소프트캔디 525g", price: 10980, tag: "달달·각성", sub: "525g" },
  ],
  salty: [
    { id: "sn-p1", name: "에낙 스파이시 레벨3 840g",    price: 13680, tag: "짭짤·공유형",   sub: "28g×30입" },
    { id: "sn-p2", name: "켈로그 프링글스 미니 19g×30", price: 14960, tag: "짭짤·한입",     sub: "19g×30개" },
    { id: "sn-p3", name: "밀크 클래식 쌀과자 720g",     price: 9680,  tag: "고소·공유형",   sub: "720g" },
    { id: "sn-p4", name: "노브랜드 참깨크래커 216g",    price: 1980,  tag: "고소·한입",     sub: "216g" },
    { id: "sn-p5", name: "우고래빗 밸런스 하루견과 50개", price: 27900, tag: "고소·개별포장", sub: "20g×50개" },
  ],
  health: [
    { id: "sn-h1", name: "구운란 짜라란 중란 60구",       price: 16500, tag: "건강·포만",     sub: "60구" },
    { id: "sn-h2", name: "오리온 단백질바 미니 324g",     price: 4980,  tag: "건강·고단백",   sub: "324g" },
    { id: "sn-h3", name: "노브랜드 간식소시지 504g",      price: 5680,  tag: "포만·고소",     sub: "504g" },
    { id: "sn-h4", name: "매일 두유 99.9% 190ml×24",      price: 9890,  tag: "건강·무카페인", sub: "190ml×24" },
  ],
  drink: [
    { id: "sn-d1", name: "곰곰 예가체프 드립백 커피",     price: 18490, tag: "음료·카페인",   sub: "8g×36개입" },
    { id: "sn-d2", name: "카프리썬 오렌지망고 200ml×20",  price: 9800,  tag: "음료·무카페인", sub: "200ml×20입" },
    { id: "sn-d3", name: "꽃샘 블랙 보리차",              price: 8940,  tag: "음료·무카페인", sub: "1g×100개입" },
    { id: "sn-d4", name: "이롬 검은콩 두유 190ml×20",     price: 9890,  tag: "음료·건강",     sub: "190ml×20입" },
  ],
};

const CAT_ORDER: CategoryKey[] = ["sweet", "salty", "health", "drink", "other"];
const EDITABLE_CATS: Exclude<CategoryKey, "other">[] = ["sweet", "salty", "health", "drink"];

/* 각 단계에서 카테고리 비율별 종 수 산정 — 간단한 범위 매핑 */
function countForPercent(pct: number): number {
  if (pct <= 0) return 0;
  if (pct < 10) return 1;
  if (pct < 20) return 2;
  if (pct < 30) return 3;
  if (pct < 45) return Math.round(pct / 6);
  return Math.round(pct / 5);
}

function formatWon(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

/* ═════════════════════════════════════════════════
   메인
   ═════════════════════════════════════════════════ */

export default function SnackPackageBuilder() {
  const [page, setPage] = useState<0 | 1>(0);

  return (
    <div className="flex flex-col">
      {page === 0 ? (
        <SnackHero onStart={() => setPage(1)} />
      ) : (
        <SnackWizard onBack={() => setPage(0)} />
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════
   PAGE 0 — 히어로
   ═════════════════════════════════════════════════ */

function SnackHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-[1120px] mx-auto px-10 py-20">
      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-12 items-center">
        {/* 좌측 — 카피 + CTA */}
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-[5px] mb-6 text-[11px] font-bold uppercase text-[#4e4e4e]"
            style={{
              borderRadius: "9999px",
              backgroundColor: "rgba(245,242,239,0.8)",
              boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(78,50,23,0.04) 0px 6px 16px",
              fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif",
              letterSpacing: "0.7px",
            }}
          >
            <Sparkles size={11} strokeWidth={1.75} color="#000" />
            AI 간식 패키지
          </div>

          <h1
            className="text-[56px] font-light text-[#000] mb-5"
            style={{
              fontFamily: "Waldenburg, 'Waldenburg Fallback', sans-serif",
              letterSpacing: "-1.2px",
              lineHeight: 1.04,
            }}
          >
            예산만 알려주면<br />
            <em className="not-italic text-[#777169]">간식은 알아서</em> 채워드려요
          </h1>

          <p
            className="text-[16px] text-[#4e4e4e] leading-[1.65] mb-8 max-w-[480px]"
            style={{ letterSpacing: "0.16px" }}
          >
            구매 데이터 기반으로 우리 회사에 딱 맞는 간식 조합을 자동으로 구성합니다.
            카테고리 비율 조정부터 상품 교체까지 3분이면 끝.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 px-7 py-[13px] text-[14px] font-medium text-white bg-[#000] cursor-pointer transition-opacity hover:opacity-85"
              style={{ borderRadius: "9999px", letterSpacing: "0.14px" }}
            >
              <Sparkles size={15} strokeWidth={1.5} />
              간식 세트 만들기
            </button>
            <span className="text-[12.5px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
              3분이면 완성 · 25종 이상 · 87% 만족도
            </span>
          </div>
        </div>

        {/* 우측 — 플로팅 간식 카드 씬 */}
        <div className="relative h-[420px] hidden md:block">
          <FloatSnackCard emoji="🍫" name="빈츠 102g" price="17,380원" className="absolute top-[10%] left-[8%]" delay={0} />
          <FloatSnackCard emoji="☕" name="드립백 커피" price="18,490원" className="absolute top-[22%] right-[6%]" delay={0.6} />
          <FloatSnackCard emoji="🥜" name="하루견과 50개" price="27,900원" className="absolute top-[54%] left-[2%]" delay={1.2} />
          <FloatSnackCard emoji="🧃" name="카프리썬 20입" price="9,800원" className="absolute top-[62%] right-[10%]" delay={0.3} />
          <FloatSnackCard emoji="🍪" name="오예스 48입" price="16,080원" className="absolute top-[36%] left-[36%]" delay={0.9} size="lg" />

          {/* 배경 원형 웜스톤 글로우 */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(245,242,239,0.9) 0%, rgba(245,242,239,0.3) 45%, transparent 70%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function FloatSnackCard({
  emoji, name, price, className, delay = 0, size = "md",
}: {
  emoji: string; name: string; price: string;
  className?: string; delay?: number; size?: "md" | "lg";
}) {
  const isLg = size === "lg";
  return (
    <div
      className={`flex items-center gap-2.5 bg-white ${className ?? ""}`}
      style={{
        padding: isLg ? "12px 16px" : "10px 14px",
        borderRadius: "14px",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 4px 16px",
        animation: `hero-float 3.6s ease-in-out ${delay}s infinite`,
      }}
    >
      <span style={{ fontSize: isLg ? "32px" : "26px" }} aria-hidden>{emoji}</span>
      <div>
        <div
          className="text-[11.5px] font-medium text-[#000]"
          style={{ letterSpacing: "0.14px", lineHeight: 1.2 }}
        >
          {name}
        </div>
        <div
          className="text-[10.5px] text-[#777169]"
          style={{ letterSpacing: "0.14px" }}
        >
          {price}
        </div>
      </div>
      <style jsx>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}


/* ═════════════════════════════════════════════════
   PAGE 1 — 4단계 위자드
   ═════════════════════════════════════════════════ */

function SnackWizard({ onBack }: { onBack: () => void }) {
  /* 공통 세트 정보 */
  const [setName, setSetName] = useState("4월 로랩스 간식");
  const [nameEdited, setNameEdited] = useState(false);

  /* Step 상태 */
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());

  /* Step 1: 인원/예산/프리셋 */
  const [people, setPeople] = useState<string>("20");
  const [budget, setBudget] = useState<string>("300,000");
  const [preset, setPreset] = useState<PresetKey | null>(null);

  const peopleNum = parseInt(people.replace(/,/g, "")) || 0;
  const budgetNum = parseInt(budget.replace(/,/g, "")) || 0;

  const peopleValid = peopleNum >= 5;
  const budgetValid = budgetNum >= 100_000;
  const step1Valid = peopleValid && budgetValid && preset !== null;

  /* Step 2: 비율 (4개 조절 + 기타 auto) */
  const [ratios, setRatios] = useState<[number, number, number, number, number]>([40, 27, 18, 11, 4]);

  /* Step 3: 활성 상품 */
  const [activeProducts, setActiveProducts] = useState<Record<Exclude<CategoryKey, "other">, SnackProduct[]>>({
    sweet: [], salty: [], health: [], drink: [],
  });
  const [poolCursors, setPoolCursors] = useState<Record<Exclude<CategoryKey, "other">, number>>({
    sweet: 0, salty: 0, health: 0, drink: 0,
  });

  /* 토스트 */
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* 프리셋 변경 시 비율 자동 설정 */
  useEffect(() => {
    if (preset) setRatios([...PRESET_RATIOS[preset]]);
  }, [preset]);

  /* 비율 슬라이더 조절 — 4개 합이 100 초과 방지, 기타 = 100 - sum */
  const adjustRatio = useCallback((idx: 0 | 1 | 2 | 3, v: number) => {
    setRatios((prev) => {
      const next = [...prev] as [number, number, number, number, number];
      next[idx] = Math.max(0, Math.min(100, v));
      const sumFirst4 = next[0] + next[1] + next[2] + next[3];
      if (sumFirst4 > 100) {
        // 초과분만큼 해당 슬라이더 축소
        next[idx] = Math.max(0, next[idx] - (sumFirst4 - 100));
      }
      next[4] = 100 - (next[0] + next[1] + next[2] + next[3]);
      return next;
    });
  }, []);

  /* Step 2 완료 시 → 상품 활성 채우기 */
  const buildProducts = useCallback(() => {
    const out: Record<Exclude<CategoryKey, "other">, SnackProduct[]> = { sweet: [], salty: [], health: [], drink: [] };
    const cursors: Record<Exclude<CategoryKey, "other">, number> = { sweet: 0, salty: 0, health: 0, drink: 0 };
    EDITABLE_CATS.forEach((k, i) => {
      const pool = SNACK_POOL[k];
      const n = Math.min(countForPercent(ratios[i as 0 | 1 | 2 | 3]), pool.length);
      for (let idx = 0; idx < n; idx++) out[k].push(pool[idx % pool.length]);
      cursors[k] = n;
    });
    setActiveProducts(out);
    setPoolCursors(cursors);
  }, [ratios]);

  /* 상품 교체 */
  const replaceProduct = useCallback((cat: Exclude<CategoryKey, "other">, slotIdx: number) => {
    const pool = SNACK_POOL[cat];
    const current = activeProducts[cat];
    let cursor = poolCursors[cat];
    let candidate: SnackProduct | null = null;
    for (let tries = 0; tries < pool.length; tries++) {
      const nextIdx = cursor % pool.length;
      const c = pool[nextIdx];
      cursor = cursor + 1;
      if (!current.some((p, j) => j !== slotIdx && p.id === c.id)) {
        candidate = c;
        break;
      }
    }
    if (!candidate) return;
    setActiveProducts((prev) => ({
      ...prev,
      [cat]: prev[cat].map((p, i) => (i === slotIdx ? candidate! : p)),
    }));
    setPoolCursors((prev) => ({ ...prev, [cat]: cursor }));
  }, [activeProducts, poolCursors]);

  /* 상품 삭제 */
  const deleteProduct = useCallback((cat: Exclude<CategoryKey, "other">, slotIdx: number) => {
    if (activeProducts[cat].length <= 1) {
      showToast("카테고리에 최소 1종 이상 있어야 해요");
      return;
    }
    setActiveProducts((prev) => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== slotIdx),
    }));
  }, [activeProducts, showToast]);

  /* Step 진입/완료 로직 */
  const goToStep = useCallback((s: 1 | 2 | 3 | 4) => {
    setActiveStep(s);
  }, []);

  const completeStep1 = useCallback(() => {
    if (!step1Valid) return;
    setDoneSteps((prev) => new Set(prev).add(1));
    goToStep(2);
  }, [step1Valid, goToStep]);

  const completeStep2 = useCallback(() => {
    setDoneSteps((prev) => new Set(prev).add(2));
    buildProducts();
    goToStep(3);
  }, [buildProducts, goToStep]);

  const completeStep3 = useCallback(() => {
    setDoneSteps((prev) => new Set(prev).add(3));
    goToStep(4);
  }, [goToStep]);

  /* Step 1 수정 시 이후 초기화 */
  const handleStep1Reopen = useCallback(() => {
    if (doneSteps.has(1)) {
      setDoneSteps(new Set());
      setActiveProducts({ sweet: [], salty: [], health: [], drink: [] });
    }
    goToStep(1);
  }, [doneSteps, goToStep]);

  const handleStep2Reopen = useCallback(() => {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      next.delete(2); next.delete(3);
      return next;
    });
    setActiveProducts({ sweet: [], salty: [], health: [], drink: [] });
    goToStep(2);
  }, [goToStep]);

  /* 예산 배분 계산 — 카테고리별 예산 */
  const categoryBudgets = useMemo(() => {
    const b: Record<CategoryKey, number> = { sweet: 0, salty: 0, health: 0, drink: 0, other: 0 };
    CAT_ORDER.forEach((k, i) => { b[k] = Math.round(budgetNum * ratios[i] / 100); });
    return b;
  }, [budgetNum, ratios]);

  /* 최종 요약 */
  const finalRows = useMemo(() => {
    return EDITABLE_CATS.map((k, i) => ({
      key: k,
      label: CATEGORY_LABELS[k],
      count: activeProducts[k].length,
      amount: categoryBudgets[k],
      pi: i,
    }));
  }, [activeProducts, categoryBudgets]);

  const finalTotal = useMemo(() =>
    finalRows.reduce((s, r) => s + r.amount, 0), [finalRows]);

  /* 세트 이름 포커스 시 기본값 삭제 */
  const handleNameFocus = () => {
    if (!nameEdited && setName === "4월 로랩스 간식") {
      setSetName("");
    }
  };
  const handleNameBlur = () => {
    if (setName.trim() === "") {
      setSetName("4월 로랩스 간식");
      setNameEdited(false);
    } else {
      setNameEdited(true);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto px-10 py-10">
      {/* 뒤로가기 */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 mb-6 text-[13px] text-[#777169] cursor-pointer transition-colors hover:text-[#000] group"
        style={{ letterSpacing: "0.14px" }}
      >
        <ChevronLeft size={14} strokeWidth={1.5} className="transition-transform group-hover:-translate-x-0.5" />
        돌아가기
      </button>

      {/* 세트 이름 */}
      <div className="mb-10">
        <label
          className="block text-[11px] font-bold uppercase text-[#777169] mb-1.5"
          style={{
            fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif",
            letterSpacing: "0.7px",
          }}
        >
          세트 이름
        </label>
        <input
          type="text"
          value={setName}
          onChange={(e) => { setSetName(e.target.value); setNameEdited(true); }}
          onFocus={handleNameFocus}
          onBlur={handleNameBlur}
          className={`w-full text-[32px] font-light bg-transparent outline-none transition-colors ${nameEdited ? "text-[#000]" : "text-[#777169]"}`}
          style={{
            fontFamily: "Waldenburg, 'Waldenburg Fallback', sans-serif",
            letterSpacing: "-0.6px",
            lineHeight: 1.15,
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            paddingBottom: "8px",
          }}
        />
        {!nameEdited && (
          <p className="flex items-center gap-1 text-[11px] text-[#b8b2a8] mt-1.5" style={{ letterSpacing: "0.14px" }}>
            <Info size={10} strokeWidth={1.5} /> 입력하지 않으면 이 이름으로 저장돼요
          </p>
        )}
      </div>

      {/* 스텝 영역 */}
      <div className="flex flex-col">
        {/* STEP 1 */}
        <StepSection
          stepNum={1}
          title="어떤 간식을 주로 구매하시나요?"
          subtitle="목적에 맞게 간식 비율을 자동으로 잡아드려요"
          done={doneSteps.has(1)}
          active={activeStep === 1}
          onReopen={handleStep1Reopen}
          showLine
        >
          {activeStep === 1 && (
            <>
              {doneSteps.size > 0 && (
                <Notice tone="warn">Step 1을 수정하면 이후 단계(비율·상품)가 초기화돼요</Notice>
              )}

              {/* 인원 / 예산 카드 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <InputCard
                  label="회사 인원"
                  value={people}
                  onChange={setPeople}
                  suffix="명"
                  warn={!peopleValid && people.length > 0 ? "최소 5명 이상" : null}
                />
                <InputCard
                  label="월 간식 예산"
                  value={budget}
                  onChange={(v) => {
                    const n = v.replace(/[^0-9]/g, "");
                    setBudget(n ? parseInt(n).toLocaleString("ko-KR") : "");
                  }}
                  suffix="원"
                  warn={!budgetValid && budget.length > 0 ? "최소 100,000원 이상" : null}
                />
              </div>

              {/* 프리셋 선택 — 직원 복지형 2×2 + 고객 응대형 */}
              <div className="grid grid-cols-[1fr_1fr] gap-6 mb-6">
                <div>
                  <MicroLabel>직원 복지형</MicroLabel>
                  <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                    {(["daily", "health", "meeting", "energy"] as const).map((k) => (
                      <PresetCard
                        key={k}
                        presetKey={k}
                        selected={preset === k}
                        onClick={() => setPreset(k)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <MicroLabel>고객 응대형</MicroLabel>
                  <div className="mt-2.5">
                    <HostingCard selected={preset === "hosting"} onClick={() => setPreset("hosting")} />
                  </div>
                  <div
                    className="mt-3 px-3.5 py-2.5 text-[11.5px] text-[#4e4e4e] leading-[1.55]"
                    style={{
                      borderRadius: "10px",
                      backgroundColor: "rgba(245,242,239,0.5)",
                      boxShadow: "rgba(0,0,0,0.05) 0px 0px 0px 1px",
                      letterSpacing: "0.14px",
                    }}
                  >
                    인원수는 <b>일 평균 방문객 수</b> 기준으로 입력해주세요.
                  </div>
                </div>
              </div>

              <StepNextButton active={step1Valid} onClick={completeStep1}>
                다음 — 비율 조정하기 →
              </StepNextButton>
            </>
          )}
        </StepSection>

        {/* STEP 2 */}
        {doneSteps.has(1) && (
          <StepSection
            stepNum={2}
            title="카테고리 비율을 조정해보세요"
            subtitle="비율을 바꾸면 추천 상품 수와 예산이 함께 바뀌어요"
            done={doneSteps.has(2)}
            active={activeStep === 2}
            onReopen={handleStep2Reopen}
            showLine
          >
            {activeStep === 2 && (
              <>
                {doneSteps.has(3) && (
                  <Notice tone="warn">Step 2를 수정하면 상품 추천이 초기화돼요</Notice>
                )}
                <Notice tone="info">
                  동종 업계 기업들의 실제 구매 데이터를 기반으로 최적 비율을 자동 설정했어요.
                </Notice>

                {/* 분포 바 + 슬라이더 — 단일 카드로 anchoring */}
                <div
                  className="px-6 py-5 mb-5"
                  style={{
                    borderRadius: "14px",
                    backgroundColor: "#fff",
                    boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
                  }}
                >
                  <DistributionBar ratios={ratios} />

                  <div className="flex flex-col mt-5">
                    {EDITABLE_CATS.map((k, i) => (
                      <SliderRow
                        key={k}
                        label={CATEGORY_LABELS[k]}
                        pct={ratios[i as 0 | 1 | 2 | 3]}
                        amount={categoryBudgets[k]}
                        countLabel={`약 ${countForPercent(ratios[i as 0 | 1 | 2 | 3])}종`}
                        onChange={(v) => adjustRatio(i as 0 | 1 | 2 | 3, v)}
                      />
                    ))}
                    <SliderRowReadonly
                      pct={ratios[4]}
                      amount={categoryBudgets.other}
                    />
                  </div>

                  {/* 총합 표시 — 카드 내부 하단 */}
                  <div
                    className="flex items-center justify-between pt-4 mt-2"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <span className="text-[12px] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
                      예산 배정 현황
                    </span>
                    <span className="text-[12.5px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
                      예비 {ratios[4]}% ({formatWon(categoryBudgets.other)}) 남음
                    </span>
                  </div>
                </div>

                <StepNextButton active onClick={completeStep2}>
                  추천 상품 보러가기 →
                </StepNextButton>
              </>
            )}
          </StepSection>
        )}

        {/* STEP 3 */}
        {doneSteps.has(2) && (
          <StepSection
            stepNum={3}
            title="이런 간식 어때요?"
            subtitle="카드에 마우스를 올리면 교체 또는 삭제를 할 수 있어요"
            done={doneSteps.has(3)}
            active={activeStep === 3}
            onReopen={() => goToStep(3)}
            showLine
          >
            {activeStep === 3 && (
              <>
                <Notice tone="info">
                  <b>수량은 어떻게 정했나요?</b> 카테고리 예산 ÷ 추천 종류 수로 자동 계산했어요. 상품을 삭제하면 나머지에 예산이 균등 재배분돼요.
                </Notice>

                <div className="flex flex-col gap-5 mt-3">
                  {EDITABLE_CATS.map((k, i) => {
                    const prods = activeProducts[k];
                    if (prods.length === 0) return null;
                    const slotBudget = Math.round(categoryBudgets[k] / prods.length);
                    return (
                      <div key={k}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] font-semibold text-[#000]" style={{ letterSpacing: "0.14px" }}>
                            {CATEGORY_LABELS[k]}
                          </span>
                          <span className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                            {prods.length}종 · {formatWon(categoryBudgets[k])}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {prods.map((p, idx) => (
                            <ProductSlot
                              key={`${p.id}-${idx}`}
                              product={p}
                              slotBudget={slotBudget}
                              qty={Math.max(1, Math.floor(slotBudget / p.price))}
                              onReplace={() => replaceProduct(k, idx)}
                              onDelete={() => deleteProduct(k, idx)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <StepNextButton active onClick={completeStep3}>
                  이 구성으로 확정하기 →
                </StepNextButton>
              </>
            )}
          </StepSection>
        )}

        {/* STEP 4 */}
        {doneSteps.has(3) && (
          <StepSection
            stepNum={4}
            title="간식 고민 끝! 간식 세트가 완성됐어요"
            subtitle="예산·인원·목적에 딱 맞게 완성됐어요"
            done={false}
            active
            final
          >
            {/* 구성 요약 — 전폭 블록, 카테고리를 2열 그리드로 펼쳐서 가로 공간 활용 */}
            <div
              className="px-7 py-6 mb-4"
              style={{
                borderRadius: "16px",
                backgroundColor: "rgba(245,242,239,0.8)",
                boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(78,50,23,0.04) 0px 6px 16px",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="text-[11px] font-bold uppercase text-[#4e4e4e]"
                  style={{
                    fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif",
                    letterSpacing: "0.7px",
                  }}
                >
                  구성 요약
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-[4px] text-[11px] font-medium text-[#000]"
                  style={{
                    borderRadius: "9999px",
                    backgroundColor: "#fff",
                    boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                    letterSpacing: "0.14px",
                  }}
                >
                  <Truck size={11} strokeWidth={1.75} color="#000" />
                  배송비 무료
                </div>
              </div>

              {/* 카테고리 — 2열 그리드로 전폭 활용 */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
                {finalRows.map((r) => (
                  <div
                    key={r.key}
                    className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <span className="text-[13px] text-[#4e4e4e]" style={{ letterSpacing: "0.14px" }}>
                      {r.label}
                    </span>
                    <span className="text-[13px] text-[#000]" style={{ letterSpacing: "0.14px" }}>
                      <span className="text-[#777169]">{r.count}종 · </span>
                      <span className="font-medium">{formatWon(r.amount)}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* 총액 */}
              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}
              >
                <span className="text-[13px] font-semibold text-[#000]" style={{ letterSpacing: "0.14px" }}>
                  상품 금액
                </span>
                <span
                  className="text-[28px] font-light text-[#000]"
                  style={{
                    fontFamily: "Waldenburg, 'Waldenburg Fallback', sans-serif",
                    letterSpacing: "-0.5px",
                    lineHeight: 1,
                  }}
                >
                  {formatWon(finalTotal)}
                </span>
              </div>
            </div>

            {/* 최종 CTA — 전폭 블랙 바 */}
            <button
              onClick={() => showToast("간식 세트를 회사 상품 폴더에 담았어요")}
              className="w-full py-[14px] text-[14px] font-semibold text-white bg-[#000] cursor-pointer transition-opacity hover:opacity-85"
              style={{ borderRadius: "12px", letterSpacing: "0.14px" }}
            >
              간식 세트 만들기
            </button>
          </StepSection>
        )}
      </div>

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white"
          style={{
            borderRadius: "9999px",
            backgroundColor: "#000",
            boxShadow: "rgba(0,0,0,0.25) 0px 8px 24px",
            letterSpacing: "0.14px",
          }}
        >
          <Check size={14} strokeWidth={2} />
          {toast}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════
   서브 컴포넌트
   ═════════════════════════════════════════════════ */

function StepSection({
  stepNum, title, subtitle, done, active, onReopen, showLine, final, children,
}: {
  stepNum: number; title: string; subtitle: string;
  done: boolean; active: boolean; onReopen?: () => void;
  showLine?: boolean; final?: boolean;
  children?: React.ReactNode;
}) {
  const collapsible = done && !active && !final;

  return (
    <div className="relative pl-10 pb-8">
      {/* 스텝 dot */}
      <div
        className="absolute left-0 top-[2px] w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: done || active ? "#000" : "rgba(0,0,0,0.08)",
          color: done || active ? "#fff" : "#777169",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.14px",
        }}
      >
        {done ? <Check size={13} strokeWidth={2.5} /> : stepNum}
      </div>

      {/* 연결선 */}
      {showLine && (
        <div
          className="absolute left-[13px] top-8 bottom-0"
          style={{ width: "2px", backgroundColor: done ? "#000" : "rgba(0,0,0,0.08)" }}
        />
      )}

      {/* 헤더 */}
      <div
        className={collapsible ? "cursor-pointer group" : ""}
        onClick={collapsible ? onReopen : undefined}
      >
        <div className="flex items-center gap-2 mb-1">
          <h2
            className="text-[19px] font-semibold text-[#000]"
            style={{ letterSpacing: "-0.3px" }}
          >
            {title}
          </h2>
          {done && !active && !final && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[#000]"
              style={{
                borderRadius: "9999px",
                backgroundColor: "rgba(245,242,239,0.8)",
                boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset",
                letterSpacing: "0.14px",
              }}
            >
              <Check size={10} strokeWidth={2.5} />
              완료
            </span>
          )}
          {collapsible && (
            <span
              className="ml-auto text-[11px] text-[#777169] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ letterSpacing: "0.14px" }}
            >
              클릭해서 수정
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
          {subtitle}
        </p>
      </div>

      {/* 바디 */}
      {active && children && (
        <div className="mt-5">
          {children}
        </div>
      )}
    </div>
  );
}

function InputCard({
  label, value, onChange, suffix, warn,
}: {
  label: string; value: string; onChange: (v: string) => void;
  suffix: string; warn: string | null;
}) {
  return (
    <div
      className="px-5 py-4"
      style={{
        borderRadius: "14px",
        backgroundColor: "#fff",
        boxShadow: warn
          ? "rgba(0,0,0,0.2) 0px 0px 0px 1px"
          : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
      }}
    >
      <label
        className="block text-[10px] font-bold uppercase text-[#777169] mb-2"
        style={{
          fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif",
          letterSpacing: "0.7px",
        }}
      >
        {label}
      </label>
      <div className="flex items-baseline gap-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent outline-none text-[28px] font-light text-[#000]"
          style={{
            fontFamily: "Waldenburg, 'Waldenburg Fallback', sans-serif",
            letterSpacing: "-0.4px",
            lineHeight: 1.1,
          }}
        />
        <span className="text-[14px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
          {suffix}
        </span>
      </div>
      {warn && (
        <p className="text-[10.5px] text-[#000] mt-1.5" style={{ letterSpacing: "0.14px" }}>
          {warn}
        </p>
      )}
    </div>
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-bold uppercase text-[#777169]"
      style={{
        fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif",
        letterSpacing: "0.7px",
      }}
    >
      {children}
    </span>
  );
}

function PresetCard({
  presetKey, selected, onClick,
}: {
  presetKey: PresetKey; selected: boolean; onClick: () => void;
}) {
  const meta = PRESET_META[presetKey];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center text-center px-3 py-5 cursor-pointer transition-all"
      style={{
        borderRadius: "12px",
        backgroundColor: selected ? "rgba(245,242,239,0.8)" : "#fff",
        boxShadow: selected
          ? "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.5) 0px 0px 0px 1px, rgba(78,50,23,0.04) 0px 6px 16px"
          : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
      }}
    >
      <div className="text-[26px] mb-1.5" aria-hidden>{meta.icon}</div>
      <div
        className="text-[12.5px] font-medium text-[#000] leading-[1.35] whitespace-pre-line"
        style={{ letterSpacing: "0.14px" }}
      >
        {meta.label}
      </div>
    </button>
  );
}

function HostingCard({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  const meta = PRESET_META.hosting;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3.5 py-4 text-left cursor-pointer transition-all"
      style={{
        borderRadius: "12px",
        backgroundColor: selected ? "rgba(245,242,239,0.8)" : "#fff",
        boxShadow: selected
          ? "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.5) 0px 0px 0px 1px, rgba(78,50,23,0.04) 0px 6px 16px"
          : "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
      }}
    >
      <div className="text-[26px] shrink-0" aria-hidden>{meta.icon}</div>
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-[#000] mb-0.5" style={{ letterSpacing: "0.14px" }}>
          {meta.label}
        </div>
        <div className="text-[10.5px] text-[#777169] leading-[1.5]" style={{ letterSpacing: "0.14px" }}>
          공유오피스·쇼룸·딜러사<br />
          개별포장·프리미엄 상품 위주
        </div>
      </div>
    </button>
  );
}

function Notice({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  const isWarn = tone === "warn";
  return (
    <div
      className="flex items-start gap-2 px-3 py-2.5 mb-3"
      style={{
        borderRadius: "10px",
        backgroundColor: isWarn ? "#fff" : "rgba(245,242,239,0.5)",
        boxShadow: isWarn
          ? "rgba(0,0,0,0.2) 0px 0px 0px 1px"
          : "rgba(0,0,0,0.05) 0px 0px 0px 1px",
      }}
    >
      <Info size={12} strokeWidth={1.75} color={isWarn ? "#000" : "#777169"} className="shrink-0 mt-0.5" />
      <p className="text-[11.5px] text-[#4e4e4e] leading-[1.55]" style={{ letterSpacing: "0.14px" }}>
        {children}
      </p>
    </div>
  );
}

function StepNextButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={!active}
      className={`w-full mt-6 py-3 text-[13.5px] font-semibold cursor-pointer transition-all ${active ? "text-white bg-[#000] hover:opacity-85" : "text-[#777169] bg-[rgba(0,0,0,0.04)] cursor-not-allowed"}`}
      style={{ borderRadius: "12px", letterSpacing: "0.14px" }}
    >
      {children}
    </button>
  );
}

function DistributionBar({ ratios }: { ratios: [number, number, number, number, number] }) {
  const colors = ["#000000", "#4e4e4e", "#777169", "#a8a29a", "#d4d0c7"];
  return (
    <div>
      <div
        className="flex h-[28px] overflow-hidden"
        style={{
          borderRadius: "8px",
          boxShadow: "rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset",
        }}
      >
        {ratios.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-[10px] font-medium text-white overflow-hidden transition-all"
            style={{
              width: `${r}%`,
              backgroundColor: colors[i],
              minWidth: r > 0 ? "auto" : "0",
              letterSpacing: "0.14px",
            }}
          >
            {r >= 10 && `${r}%`}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {(["달달한", "짭짤/고소한", "건강/포만", "음료", "예비"] as const).map((l, i) => (
          <span key={l} className="flex items-center gap-1 text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: colors[i] }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function SliderRow({
  label, pct, amount, countLabel, onChange,
}: {
  label: string; pct: number; amount: number; countLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-[#000]" style={{ letterSpacing: "0.14px" }}>
            {label}
          </span>
          <span
            className="text-[10px] font-medium text-[#4e4e4e] px-2 py-[1px]"
            style={{
              borderRadius: "9999px",
              backgroundColor: "rgba(245,242,239,0.8)",
              boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px",
              letterSpacing: "0.14px",
            }}
          >
            {countLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-[#000]" style={{ letterSpacing: "-0.1px" }}>
            {pct}%
          </span>
          <span className="text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
            {formatWon(amount)}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[#000]"
      />
    </div>
  );
}

function SliderRowReadonly({ pct, amount }: { pct: number; amount: number }) {
  return (
    <div className="py-3 opacity-60">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
            기타 (예비)
          </span>
          <span
            className="text-[9px] font-bold uppercase text-[#777169] px-2 py-[1px]"
            style={{
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.04)",
              fontFamily: "WaldenburgFH, 'WaldenburgFH Fallback', sans-serif",
              letterSpacing: "0.7px",
            }}
          >
            AUTO
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] text-[#777169]" style={{ letterSpacing: "-0.1px" }}>
            {pct}%
          </span>
          <span className="text-[11px] text-[#b8b2a8]" style={{ letterSpacing: "0.14px" }}>
            {formatWon(amount)}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        disabled
        className="w-full accent-[#d4d0c7]"
      />
    </div>
  );
}

function ProductSlot({
  product, slotBudget, qty, onReplace, onDelete,
}: {
  product: SnackProduct; slotBudget: number; qty: number;
  onReplace: () => void; onDelete: () => void;
}) {
  return (
    <div
      className="group relative px-3 py-3 cursor-default"
      style={{
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px",
      }}
    >
      {/* hover 액션 */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onReplace}
          aria-label="교체"
          className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-[rgba(245,242,239,0.8)]"
          style={{ backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        >
          <RefreshCw size={11} strokeWidth={1.75} color="#4e4e4e" />
        </button>
        <button
          onClick={onDelete}
          aria-label="삭제"
          className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-[rgba(245,242,239,0.8)]"
          style={{ backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
        >
          <X size={11} strokeWidth={1.75} color="#4e4e4e" />
        </button>
      </div>

      <div
        className="text-[9px] font-medium text-[#777169] mb-1"
        style={{ letterSpacing: "0.14px" }}
      >
        {product.tag}
      </div>
      <p
        className="text-[12px] font-medium text-[#000] leading-[1.35] mb-1 line-clamp-2 pr-14"
        style={{ letterSpacing: "0.14px" }}
      >
        {product.name}
      </p>
      <p className="text-[10px] text-[#777169] mb-2" style={{ letterSpacing: "0.14px" }}>
        {product.sub}
      </p>
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold text-[#000]" style={{ letterSpacing: "-0.1px" }}>
          {formatWon(product.price)}
        </span>
        <span className="text-[10px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
          약 {qty}개 · {formatWon(slotBudget)}
        </span>
      </div>
    </div>
  );
}
