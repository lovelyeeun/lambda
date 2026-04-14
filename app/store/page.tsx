"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, FolderPlus, Check, ChevronRight, RefreshCw,
  Coffee, Monitor, Armchair, Printer, FileText, Droplets,
  Building2, Factory, Briefcase, Landmark, Sparkles,
  Clock, TrendingUp, Star, Tag,
} from "lucide-react";
import { products } from "@/data/products";
import { folders } from "@/data/folders";
import type { Product, ProductCategory } from "@/lib/types";
import ProductCard from "@/components/commerce/ProductCard";
import { useRightPanel } from "@/lib/right-panel-context";
import ProductDetailPanel from "@/components/chat/ProductDetailPanel";
import { usePin, sortByPinned } from "@/lib/pin-context";
import SnackPackageBuilder from "@/components/store/SnackPackageBuilder";

/* ─── Constants ─── */

type StoreTab = "스토어 홈" | "간식 패키지" | "업종별 탐색" | "기획전";
const storeTabs: StoreTab[] = ["스토어 홈", "간식 패키지", "업종별 탐색", "기획전"];

const categories: ProductCategory[] = ["용지", "잉크/토너", "사무기기", "가구", "전자기기", "사무용품", "생활용품"];
const brands = [...new Set(products.map((p) => p.brand))];

const categoryIcons: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  "용지": FileText, "잉크/토너": Printer, "사무기기": Printer,
  "가구": Armchair, "전자기기": Monitor, "사무용품": Coffee, "생활용품": Droplets,
};

/* ─── Dummy data for new sections ─── */

const frequentProducts = [
  { ...products[0], cycle: "월 2회" },
  { ...products[1], cycle: "분기 1회" },
  { ...products[6], cycle: "월 3회" },
  { ...products[5], cycle: "월 1회" },
  { ...products[11], cycle: "분기 1회" },
];

const industryTypes = [
  { id: "it", name: "IT/소프트웨어", icon: Monitor },
  { id: "mfg", name: "제조업", icon: Factory },
  { id: "svc", name: "서비스업", icon: Briefcase },
  { id: "fin", name: "금융/보험", icon: Landmark },
];

const promos = [
  { id: "promo-1", name: "봄맞이 사무용품 특가", tag: "할인행사", desc: "최대 30% 할인", count: 8, period: "4/1 ~ 4/30" },
  { id: "promo-2", name: "친환경 오피스 기획전", tag: "혜택", desc: "재생용지·친환경 제품 모음", count: 5, period: "상시 진행" },
  { id: "promo-3", name: "IT장비 대량 구매 할인", tag: "할인행사", desc: "10대 이상 15% 할인", count: 6, period: "4/15 ~ 5/15" },
  { id: "promo-4", name: "신규 가입 웰컴 혜택", tag: "혜택", desc: "첫 주문 배송비 무료", count: 12, period: "상시 진행" },
];

const brandList = [
  { name: "Double A", initial: "D" },
  { name: "HP", initial: "H" },
  { name: "FUJIFILM", initial: "F" },
  { name: "시디즈", initial: "시" },
  { name: "LG", initial: "L" },
  { name: "Samsung", initial: "S" },
  { name: "3M", initial: "3" },
  { name: "STAEDTLER", initial: "S" },
  { name: "Brother", initial: "B" },
  { name: "코웨이", initial: "코" },
];

/* ─── Helpers ─── */

function formatPrice(n: number) { return n.toLocaleString("ko-KR") + "원"; }

/* ═══════════════════════════════
   Main Store Page
   ═══════════════════════════════ */

export default function StorePageWrapper() {
  return (
    <Suspense fallback={<div className="h-full" />}>
      <StorePage />
    </Suspense>
  );
}

function StorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openPanel } = useRightPanel();
  const { togglePin, pinnedIds } = usePin();

  /* ── 탭 상태를 URL searchParams로 유지 ── */
  const tabParam = searchParams.get("tab") as StoreTab | null;
  const activeTab: StoreTab = tabParam && storeTabs.includes(tabParam) ? tabParam : "스토어 홈";

  const setActiveTab = useCallback((tab: StoreTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "스토어 홈") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(`/store${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  const [toast, setToast] = useState<string | null>(null);
  const [folderDropdown, setFolderDropdown] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleView = useCallback((product: Product) => {
    router.push(`/store/${product.id}`);
  }, [router]);

  const handleAddToCart = useCallback((product: Product) => {
    openPanel(
      <ProductDetailPanel
        product={product}
        onAddToCart={() => {}}
        showCartButton={false}
      />
    );
  }, [openPanel]);

  const handlePin = useCallback((product: Product) => {
    const wasPinned = pinnedIds.includes(product.id);
    togglePin(product.id);
    showToast(
      wasPinned
        ? `${product.name} 고정이 해제되었습니다`
        : `${product.name} — 상단에 고정되었습니다`
    );
  }, [pinnedIds, togglePin, showToast]);

  const handleAddToFolders = useCallback((productId: string, folderIds: string[]) => {
    setFolderDropdown(null);
    if (folderIds.length === 0) return;
    const names = folderIds
      .map((id) => folders.find((f) => f.id === id)?.name)
      .filter(Boolean);
    showToast(
      names.length === 1
        ? `${names[0]} 폴더에 담기 완료`
        : `${names.length}개 폴더(${names.join(", ")})에 담기 완료`
    );
  }, [showToast]);

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium"
          style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.2) 0px 4px 12px" }}
        >
          <Check size={14} strokeWidth={2} />{toast}
        </div>
      )}

      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white px-6" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-[960px] mx-auto flex items-center gap-6">
          {storeTabs.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative py-3 text-[14px] cursor-pointer transition-colors"
                style={{
                  color: active ? "#000" : "#777",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {tab}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#000] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-[960px] mx-auto px-6 py-6">
        {activeTab === "스토어 홈" && (
          <StoreHomeTab
            onView={handleView}
            onAddToCart={handleAddToCart}
            onPin={handlePin}
            folderDropdown={folderDropdown}
            setFolderDropdown={setFolderDropdown}
            onAddToFolders={handleAddToFolders}
            pinnedIds={pinnedIds}
            showToast={showToast}
          />
        )}
        {activeTab === "간식 패키지" && <SnackPackageTab />}
        {activeTab === "업종별 탐색" && (
          <IndustryBrowseTab onView={handleView} onAddToCart={handleAddToCart} onPin={handlePin} />
        )}
        {activeTab === "기획전" && (
          <PromotionsTab onView={handleView} onAddToCart={handleAddToCart} onPin={handlePin} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   스토어 홈 탭
   ═══════════════════════════════ */

function StoreHomeTab({
  onView, onAddToCart, onPin, folderDropdown, setFolderDropdown, onAddToFolders, pinnedIds, showToast,
}: {
  onView: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onPin?: (p: Product) => void;
  folderDropdown: string | null;
  setFolderDropdown: (v: string | null) => void;
  onAddToFolders: (id: string, folderIds: string[]) => void;
  pinnedIds: string[];
  showToast: (msg: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedBrand, setSelectedBrand] = useState("전체");
  const [freqFilter, setFreqFilter] = useState("전체");
  const [bestCategory, setBestCategory] = useState("전체");

  // 드롭다운별 다중선택된 폴더 ID 목록
  const [pickedFolderIds, setPickedFolderIds] = useState<string[]>([]);

  // 드롭다운이 열리거나 상품이 바뀔 때 선택 초기화
  useEffect(() => {
    setPickedFolderIds([]);
  }, [folderDropdown]);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (selectedCategory !== "전체") list = list.filter((p) => p.category === selectedCategory);
    if (selectedBrand !== "전체") list = list.filter((p) => p.brand === selectedBrand);
    return sortByPinned(list, pinnedIds);
  }, [search, selectedCategory, selectedBrand, pinnedIds]);

  const bestProducts = useMemo(() => {
    const base = bestCategory === "전체"
      ? products.slice(0, 8)
      : products.filter((p) => p.category === bestCategory).slice(0, 8);
    return sortByPinned(base, pinnedIds);
  }, [bestCategory, pinnedIds]);

  const toggleFolderPick = (folderId: string) => {
    setPickedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  return (
    <div className="flex flex-col gap-10">
      {/* ── Search bar ── */}
      <div
        className="flex items-center gap-2.5 w-full px-4 py-3 bg-white"
        style={{ borderRadius: "14px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}
      >
        <Search size={18} strokeWidth={1.5} color="#999" />
        <input
          type="text"
          placeholder="상품명, 브랜드, 카테고리로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-[14px] outline-none bg-transparent placeholder:text-[#bbb]"
        />
      </div>

      {/* ── Banner carousel (placeholder) ── */}
      <div
        className="relative overflow-hidden"
        style={{ borderRadius: "16px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
      >
        <div className="bg-[#f5f2ef] px-8 py-10 flex items-center justify-between">
          <div>
            <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-[#777] bg-white rounded-full mb-3">이번 주 추천</span>
            <h2 className="text-[22px] font-semibold mb-2" style={{ letterSpacing: "-0.3px" }}>
              사무실 필수템 모음
            </h2>
            <p className="text-[14px] text-[#777169] mb-4">가장 많이 주문하는 사무용품을 한 번에</p>
            <button
              className="px-4 py-[7px] text-[13px] font-medium text-white bg-black rounded-full cursor-pointer transition-opacity hover:opacity-80"
            >
              둘러보기
            </button>
          </div>
          <div className="text-[48px] opacity-30">📦</div>
        </div>
        {/* Carousel dots */}
        <div className="flex items-center justify-center gap-1.5 py-3 bg-white">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: i === 0 ? "#000" : "#e5e5e5" }} />
          ))}
        </div>
      </div>

      {/* ── Frequently purchased ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} strokeWidth={1.5} color="#777" />
            <h3 className="text-[16px] font-semibold">자주 구매하는 상품</h3>
          </div>
          <div className="flex items-center gap-1">
            {["전체", "주간", "격주", "월간"].map((f) => (
              <button
                key={f}
                onClick={() => setFreqFilter(f)}
                className="px-2.5 py-[4px] text-[12px] cursor-pointer transition-all"
                style={{
                  borderRadius: "6px",
                  backgroundColor: freqFilter === f ? "#f0f0f0" : "transparent",
                  color: freqFilter === f ? "#111" : "#999",
                  fontWeight: freqFilter === f ? 500 : 400,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {frequentProducts.map((fp) => (
            <button
              key={fp.id}
              onClick={() => onView(fp)}
              className="flex flex-col items-center p-3 bg-white cursor-pointer transition-all hover:translate-y-[-2px]"
              style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px" }}
            >
              <div className="w-full h-[80px] bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[10px] text-[#999] mb-2">
                {fp.brand}
              </div>
              <p className="text-[12px] font-medium text-center line-clamp-2 leading-tight mb-1">{fp.name}</p>
              <p className="text-[13px] font-semibold">{formatPrice(fp.price)}</p>
              <span className="mt-1 px-2 py-0.5 text-[10px] font-medium text-[#3b82f6] bg-[#eff6ff] rounded-full">
                {fp.cycle}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Industry recommendations ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={16} strokeWidth={1.5} color="#777" />
          <h3 className="text-[16px] font-semibold">IT/소프트웨어 업종 추천</h3>
          <span className="text-[12px] text-[#999]">비슷한 업종의 고객들이 구매하는 상품</span>
        </div>

        {/* Category tabs + subcategory chips */}
        <div className="flex items-center gap-1 mb-3">
          {categories.slice(0, 5).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(active ? "전체" : cat)}
                className="flex items-center gap-1.5 px-3 py-[5px] text-[12px] cursor-pointer transition-all"
                style={{
                  borderRadius: "8px",
                  backgroundColor: active ? "#f0f0f0" : "transparent",
                  color: active ? "#111" : "#777",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {cat}
              </button>
            );
          })}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="ml-auto text-[12px] px-2.5 py-[5px] bg-white cursor-pointer"
            style={{ borderRadius: "6px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", border: "none", outline: "none" }}
          >
            <option>전체</option>
            {brands.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.slice(0, 10).map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} onView={onView} onAddToCart={onAddToCart} onPin={onPin} />
              <div className="relative mt-1.5 px-1">
                <button
                  onClick={() => setFolderDropdown(folderDropdown === product.id ? null : product.id)}
                  className="flex items-center gap-1 text-[11px] text-[#999] cursor-pointer hover:text-[#444] transition-colors"
                >
                  <FolderPlus size={12} strokeWidth={1.5} />폴더에 담기
                </button>
                {folderDropdown === product.id && (
                  <div
                    className="absolute bottom-full mb-1 left-0 w-[200px] bg-white py-1.5 z-50"
                    style={{ borderRadius: "10px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 8px" }}
                  >
                    <p className="px-3 pt-1 pb-1.5 text-[11px] text-[#777169]" style={{ letterSpacing: "0.14px" }}>
                      여러 폴더를 선택할 수 있어요
                    </p>
                    <div className="max-h-[200px] overflow-y-auto">
                      {folders.map((f) => {
                        const picked = pickedFolderIds.includes(f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={(e) => { e.stopPropagation(); toggleFolderPick(f.id); }}
                            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] cursor-pointer transition-colors"
                            style={{
                              color: picked ? "#000" : "#444",
                              backgroundColor: picked ? "#f5f2ef" : "transparent",
                              fontWeight: picked ? 500 : 400,
                            }}
                            onMouseEnter={(e) => {
                              if (!picked) e.currentTarget.style.backgroundColor = "#fafafa";
                            }}
                            onMouseLeave={(e) => {
                              if (!picked) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <span
                              className="flex items-center justify-center w-4 h-4 rounded-[4px] shrink-0"
                              style={{
                                backgroundColor: picked ? "#000" : "transparent",
                                boxShadow: picked ? "none" : "rgba(0,0,0,0.15) 0px 0px 0px 1px inset",
                              }}
                            >
                              {picked && <Check size={10} strokeWidth={3} color="#fff" />}
                            </span>
                            {f.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-1 border-t" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFolderDropdown(null); }}
                        className="flex-1 px-2 py-1.5 text-[12px] text-[#777169] rounded-[6px] cursor-pointer hover:bg-[#fafafa]"
                      >
                        취소
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pickedFolderIds.length === 0) return;
                          onAddToFolders(product.id, pickedFolderIds);
                        }}
                        disabled={pickedFolderIds.length === 0}
                        className="flex-1 px-2 py-1.5 text-[12px] font-medium rounded-[6px] cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: pickedFolderIds.length > 0 ? "#000" : "#e5e5e5",
                          color: pickedFolderIds.length > 0 ? "#fff" : "#999",
                        }}
                      >
                        담기{pickedFolderIds.length > 0 ? ` (${pickedFolderIds.length})` : ""}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[#999] mt-2">{filtered.length}개 상품</p>
      </section>

      {/* ── Category BEST ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} strokeWidth={1.5} color="#777" />
          <h3 className="text-[16px] font-semibold">카테고리 BEST</h3>
        </div>
        <div className="flex items-center gap-1 mb-3">
          {["전체", ...categories.slice(0, 5)].map((cat) => (
            <button
              key={cat}
              onClick={() => setBestCategory(cat)}
              className="px-3 py-[5px] text-[12px] cursor-pointer transition-all"
              style={{
                borderRadius: "9999px",
                backgroundColor: bestCategory === cat ? "#000" : "#f5f5f5",
                color: bestCategory === cat ? "#fff" : "#777",
                fontWeight: bestCategory === cat ? 500 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {bestProducts.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onView(p)}
              className="flex items-center gap-3 p-3 bg-white text-left cursor-pointer transition-all hover:bg-[#fafafa]"
              style={{ borderRadius: "12px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
            >
              <span className="text-[16px] font-semibold text-[#000] w-5 shrink-0">{i + 1}</span>
              <div className="w-10 h-10 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[9px] text-[#999] shrink-0">{p.brand}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate">{p.name}</p>
                <p className="text-[12px] font-semibold text-[#000]">{formatPrice(p.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Brand showcase ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Star size={16} strokeWidth={1.5} color="#777" />
          <h3 className="text-[16px] font-semibold">브랜드</h3>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {brandList.map((b) => (
            <div key={b.name} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
              <div
                className="w-14 h-14 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[16px] font-semibold text-[#777] transition-colors group-hover:bg-[#ebebeb]"
              >
                {b.initial}
              </div>
              <span className="text-[11px] text-[#777] group-hover:text-[#444]">{b.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════
   간식 패키지 탭 — SnackPackageBuilder 위임
   ═══════════════════════════════ */

function SnackPackageTab() {
  return <SnackPackageBuilder />;
}

/* ═══════════════════════════════
   업종별 탐색 탭
   ═══════════════════════════════ */

function IndustryBrowseTab({ onView, onAddToCart, onPin }: { onView: (p: Product) => void; onAddToCart: (p: Product) => void; onPin?: (p: Product) => void }) {
  const [selectedIndustry, setSelectedIndustry] = useState("it");
  const [subCategory, setSubCategory] = useState("전체");

  const filteredProducts = useMemo(() => {
    if (subCategory === "전체") return products;
    return products.filter((p) => p.category === subCategory);
  }, [subCategory]);

  return (
    <div className="flex gap-6">
      {/* Sidebar tree */}
      <div className="w-[200px] shrink-0">
        <p className="text-[11px] font-medium text-[#999] uppercase tracking-wider mb-2 px-2">업종 선택</p>
        <div className="flex flex-col gap-0.5">
          {industryTypes.map((ind) => {
            const Icon = ind.icon;
            const active = selectedIndustry === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className="flex items-center gap-2.5 px-3 py-[8px] rounded-lg text-[13px] cursor-pointer transition-all hover:bg-[#f5f5f5] text-left"
                style={{
                  backgroundColor: active ? "#f0f0f0" : "transparent",
                  color: active ? "#111" : "#777",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={16} strokeWidth={1.5} />
                {ind.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product pane */}
      <div className="flex-1">
        <h3 className="text-[16px] font-semibold mb-1">
          {industryTypes.find((i) => i.id === selectedIndustry)?.name} 추천 상품
        </h3>
        <p className="text-[13px] text-[#777] mb-4">이 업종에서 자주 구매하는 상품입니다</p>

        {/* Subcategory chips */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {["전체", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSubCategory(cat)}
              className="px-3 py-[5px] text-[12px] cursor-pointer transition-all"
              style={{
                borderRadius: "9999px",
                backgroundColor: subCategory === cat ? "#000" : "#f5f5f5",
                color: subCategory === cat ? "#fff" : "#777",
                fontWeight: subCategory === cat ? 500 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} onView={onView} onAddToCart={onAddToCart} onPin={onPin} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   기획전 탭
   ═══════════════════════════════ */

function PromotionsTab({ onView, onAddToCart, onPin }: { onView: (p: Product) => void; onAddToCart: (p: Product) => void; onPin?: (p: Product) => void }) {
  const [selectedPromo, setSelectedPromo] = useState<string | null>(null);

  if (selectedPromo) {
    const promo = promos.find((p) => p.id === selectedPromo);
    if (!promo) return null;
    return (
      <div>
        <button
          onClick={() => setSelectedPromo(null)}
          className="flex items-center gap-1 text-[13px] text-[#777] cursor-pointer hover:text-[#444] mb-6"
        >
          ← 기획전 목록으로
        </button>
        <div className="px-6 py-8 mb-6" style={{ borderRadius: "16px", backgroundColor: "#f5f2ef" }}>
          <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-[#777] bg-white rounded-full mb-2">{promo.tag}</span>
          <h2 className="text-[22px] font-semibold mb-1">{promo.name}</h2>
          <p className="text-[14px] text-[#777]">{promo.desc} · {promo.period}</p>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
          {products.slice(0, promo.count).map((p) => (
            <ProductCard key={p.id} product={p} onView={onView} onAddToCart={onAddToCart} onPin={onPin} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[18px] font-semibold mb-1">기획전</h2>
      <p className="text-[13px] text-[#777] mb-5">브랜드별 특별 할인가 기획전. 수시 업데이트됩니다.</p>
      <div className="grid grid-cols-2 gap-4">
        {promos.map((promo) => (
          <button
            key={promo.id}
            onClick={() => setSelectedPromo(promo.id)}
            className="text-left overflow-hidden bg-white cursor-pointer transition-all hover:translate-y-[-2px]"
            style={{ borderRadius: "16px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px" }}
          >
            <div className="px-5 py-5" style={{ backgroundColor: "#f5f2ef" }}>
              <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-[#777] bg-white rounded-full mb-2">{promo.tag}</span>
              <h3 className="text-[16px] font-semibold mb-0.5">{promo.name}</h3>
              <p className="text-[12px] text-[#777]">{promo.desc}</p>
              <p className="flex items-center gap-1 text-[12px] text-[#444] font-medium mt-2">
                상품 {promo.count}개 보기 <ChevronRight size={12} strokeWidth={1.5} />
              </p>
            </div>
            <div className="px-5 py-3 flex items-center justify-between text-[11px] text-[#999]">
              <span>{promo.period}</span>
              <span>{promo.count}개 상품</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
