"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Paperclip, Monitor, Armchair, Coffee, Search,
  ChevronDown, ChevronRight, Settings, Users, TrendingDown, Plus,
  ShoppingCart, ShoppingBag,
  FileText, Droplet, Pen, Printer, Square, Folder as FolderIcon,
} from "lucide-react";
import { folders as seedFolders } from "@/data/folders";
import { products } from "@/data/products";
import { useCart } from "@/lib/cart-context";
import CartSidePanel from "@/components/commerce/CartSidePanel";
import type { Folder, Product, ProductCategory } from "@/lib/types";

/* ─── Icon map ─── */
const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  Paperclip, Monitor, Armchair, Coffee,
  FileText, Droplet, Pen, Printer, Square,
  FolderIcon,
};

/* ─── Source styles ─── */
const sourceStyles: Record<string, { color: string }> = {
  "쿠팡": { color: "#e44d2e" },
  "SmartStore": { color: "#03c75a" },
  "오늘의집": { color: "#35c5f0" },
  "기타 플랫폼": { color: "#999" },
};

const tagStyles: Record<string, { bg: string; color: string }> = {
  "무료배송": { bg: "#f5f5f5", color: "#777" },
  "로켓배송": { bg: "#e8f4fd", color: "#0074e8" },
};

/* ─── Category tabs ─── */
const allCategoryTabs: ProductCategory[] = [
  "가구", "전자기기", "사무기기", "생활용품", "사무용품", "용지", "잉크/토너",
];

/* ─── Sort ─── */
type SortKey = "recent" | "priceAsc" | "priceDesc" | "name";
const sortOptions: { key: SortKey; label: string }[] = [
  { key: "recent", label: "최근 등록한 순" },
  { key: "priceAsc", label: "가격 낮은 순" },
  { key: "priceDesc", label: "가격 높은 순" },
  { key: "name", label: "이름순" },
];

/* ─── Insights ─── */
const insights: Record<string, { team: string; freq: string; benchmark: string }> = {
  "prod-001": { team: "마케팅팀", freq: "월 2회", benchmark: "동종업계 평균 대비 8% 저렴" },
  "prod-002": { team: "마케팅팀", freq: "분기 1회", benchmark: "동종업계 평균 대비 12% 저렴" },
  "prod-003": { team: "경영지원", freq: "연 1회", benchmark: "동종업계 평균가 수준" },
  "prod-004": { team: "디자인팀", freq: "분기 2회", benchmark: "동종업계 평균 대비 5% 저렴" },
  "prod-005": { team: "개발팀", freq: "월 1회", benchmark: "동종업계 평균 대비 15% 저렴" },
  "prod-006": { team: "디자인팀", freq: "월 1회", benchmark: "동종업계 평균가 수준" },
  "prod-007": { team: "전 부서", freq: "월 3회", benchmark: "동종업계 평균 대비 3% 저렴" },
  "prod-008": { team: "개발팀", freq: "분기 1회", benchmark: "동종업계 평균 대비 10% 저렴" },
  "prod-009": { team: "경영지원", freq: "월 렌탈", benchmark: "동종업계 평균 대비 7% 저렴" },
  "prod-010": { team: "개발팀", freq: "분기 1회", benchmark: "동종업계 평균 대비 12% 저렴" },
  "prod-011": { team: "경영지원", freq: "연 2회", benchmark: "동종업계 평균가 수준" },
  "prod-012": { team: "경영지원", freq: "분기 1회", benchmark: "동종업계 평균 대비 5% 저렴" },
};

/* ═══════════════════════════════════════
   Main Component
   ═══════════════════════════════════════ */

/* ─── Folder tree helpers ─── */
function findFolderDeep(list: Folder[], id: string): Folder | undefined {
  for (const f of list) {
    if (f.id === id) return f;
    if (f.children) {
      const hit = findFolderDeep(f.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

function addFolderToTree(list: Folder[], parentId: string, newFolder: Folder): Folder[] {
  return list.map((f) => {
    if (f.id === parentId) {
      return { ...f, children: [...(f.children ?? []), newFolder] };
    }
    if (f.children) {
      return { ...f, children: addFolderToTree(f.children, parentId, newFolder) };
    }
    return f;
  });
}

/** 주어진 id의 모든 조상 폴더 id를 루트→직계부모 순으로 반환 (대상 자신은 포함하지 않음) */
function findAncestors(list: Folder[], id: string, trail: string[] = []): string[] {
  for (const f of list) {
    if (f.id === id) return trail;
    if (f.children && f.children.length > 0) {
      const hit = findAncestors(f.children, id, [...trail, f.id]);
      if (hit.length > 0) return hit;
    }
  }
  return [];
}

export default function FoldersPage() {
  const router = useRouter();
  const cart = useCart();
  const [folders, setFolders] = useState<Folder[]>(() => seedFolders);
  const [activeFolderId, setActiveFolderId] = useState(seedFolders[0]?.id ?? "");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "전체">("전체");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  // 펼쳐진 상위 폴더 — 기본: 첫 폴더만 펼침
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const first = seedFolders[0];
    return first?.children?.length ? { [first.id]: true } : {};
  });
  const toggleFolderExpand = (id: string) =>
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));

  /* ── 폴더 추가 모달 상태 ── */
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null); // null = 최상위
  const folderIdCounter = useRef(100);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const openAddFolderModal = () => {
    // 현재 선택된 폴더를 부모로 기본 설정 (깊이 무관) — 선택 없으면 최상위
    setNewFolderParentId(activeFolderId || null);
    setNewFolderName("");
    setShowAddFolderModal(true);
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const newId = `folder-new-${folderIdCounter.current++}`;
    const newFolder: Folder = {
      id: newId,
      name,
      icon: "FolderIcon",
      productIds: [],
      children: [],
    };
    if (newFolderParentId === null) {
      setFolders((prev) => [...prev, newFolder]);
    } else {
      setFolders((prev) => addFolderToTree(prev, newFolderParentId, newFolder));
      setExpandedFolders((prev) => ({ ...prev, [newFolderParentId]: true }));
    }
    setActiveFolderId(newId);
    setActiveCategory("전체");
    setSearchQuery("");
    setFreeShippingOnly(false);
    setShowAddFolderModal(false);
    showToast(`"${name}" 폴더가 생성되었습니다`);
  };

  const activeFolder = findFolderDeep(folders, activeFolderId);

  const folderProducts = useMemo(() => {
    if (!activeFolder) return [];
    return activeFolder.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [activeFolder]);

  const availableCategories = useMemo(() => {
    const cats = new Set(folderProducts.map((p) => p.category));
    return allCategoryTabs.filter((c) => cats.has(c));
  }, [folderProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...folderProducts];
    if (activeCategory !== "전체") result = result.filter((p) => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (freeShippingOnly) result = result.filter((p) => p.tags?.includes("무료배송"));
    switch (sortKey) {
      case "priceAsc": result.sort((a, b) => a.price - b.price); break;
      case "priceDesc": result.sort((a, b) => b.price - a.price); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name, "ko")); break;
    }
    return result;
  }, [folderProducts, activeCategory, searchQuery, freeShippingOnly, sortKey]);

  const selectFolder = (id: string) => {
    setActiveFolderId(id);
    setActiveCategory("전체");
    setSearchQuery("");
    setFreeShippingOnly(false);
    // 선택된 폴더의 모든 조상을 자동 펼침 (무제한 중첩 지원)
    const ancestors = findAncestors(folders, id);
    if (ancestors.length > 0) {
      setExpandedFolders((prev) => {
        const next = { ...prev };
        for (const a of ancestors) next[a] = true;
        return next;
      });
    }
  };

  return (
    <div className="h-full flex">
      {/* ══ 좌측: 폴더 세로 탭 ══ */}
      <div
        className="w-[200px] shrink-0 h-full overflow-y-auto bg-[#fafafa] py-4 px-3 flex flex-col"
        style={{ borderRight: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-[12px] font-semibold text-[#999] uppercase tracking-wider">폴더</span>
          <div className="flex items-center gap-1">
            <button
              onClick={openAddFolderModal}
              className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer hover:bg-[#eee] transition-colors"
              aria-label="새 폴더 만들기"
              title="새 폴더"
            >
              <Plus size={13} strokeWidth={1.5} color="#999" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer hover:bg-[#eee] transition-colors">
              <Settings size={13} strokeWidth={1.5} color="#999" />
            </button>
          </div>
        </div>

        {folders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            depth={0}
            activeFolderId={activeFolderId}
            expandedFolders={expandedFolders}
            onSelect={selectFolder}
            onToggleExpand={toggleFolderExpand}
          />
        ))}
      </div>

      {/* ══ 중앙: 상품 그리드 ══ */}
      <div className="flex-1 h-full overflow-y-auto min-w-0">
        <div className="px-6 py-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[17px]">📁</span>
              <h1 className="text-[17px] font-semibold" style={{ letterSpacing: "-0.2px" }}>
                {activeFolder?.name ?? "폴더"}
              </h1>
              <span className="text-[13px] text-[#999]">({filteredProducts.length})</span>
            </div>

            {/* 장바구니 아이콘 */}
            <button
              onClick={cart.toggleCart}
              className="relative flex items-center gap-2 px-3 py-[7px] text-[13px] cursor-pointer transition-colors hover:bg-[#f5f5f5]"
              style={{
                borderRadius: "10px",
                boxShadow: cart.isOpen ? "rgba(0,0,0,0.1) 0px 0px 0px 1.5px" : "rgba(0,0,0,0.06) 0px 0px 0px 1px",
                backgroundColor: cart.isOpen ? "#f8f8f8" : "#fff",
              }}
            >
              <ShoppingBag size={15} strokeWidth={1.5} color={cart.totalItems > 0 ? "#111" : "#999"} />
              <span className="text-[#555]">장바구니</span>
              {cart.totalItems > 0 && (
                <span
                  className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#111] rounded-full"
                >
                  {cart.totalItems}
                </span>
              )}
            </button>
          </div>

          {/* 카테고리 탭 */}
          {availableCategories.length > 1 && (
            <div className="flex items-center gap-0.5 mb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <TabBtn label="전체" active={activeCategory === "전체"} onClick={() => setActiveCategory("전체")} />
              {availableCategories.map((cat) => (
                <TabBtn key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
              ))}
            </div>
          )}

          {/* 도구바 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1.5 px-3 py-[7px] text-[12px] text-[#555] bg-white cursor-pointer hover:bg-[#fafafa]"
                  style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
                >
                  {sortOptions.find((s) => s.key === sortKey)?.label}
                  <ChevronDown size={12} strokeWidth={1.5} />
                </button>
                {sortOpen && (
                  <div className="absolute left-0 top-full mt-1 w-[160px] bg-white py-1 z-20" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 12px" }}>
                    {sortOptions.map((opt) => (
                      <button key={opt.key} onClick={() => { setSortKey(opt.key); setSortOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] cursor-pointer hover:bg-[#f5f5f5]" style={{ color: sortKey === opt.key ? "#000" : "#777", fontWeight: sortKey === opt.key ? 500 : 400 }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-1.5 text-[12px] text-[#555] cursor-pointer select-none">
                <input type="checkbox" checked={freeShippingOnly} onChange={(e) => setFreeShippingOnly(e.target.checked)} className="w-3.5 h-3.5 accent-black cursor-pointer" />
                무료배송
              </label>
            </div>
            <div className="flex items-center gap-2 px-3 py-[7px] bg-white" style={{ borderRadius: "8px", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px", width: "200px" }}>
              <Search size={13} strokeWidth={1.5} color="#bbb" />
              <input type="text" placeholder="상품명" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 text-[12px] outline-none bg-transparent placeholder:text-[#ccc]" />
            </div>
          </div>

          {/* 상품 그리드 */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center"><p className="text-[14px] text-[#bbb]">조건에 맞는 상품이 없습니다</p></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-6">
              {filteredProducts.map((product) => {
                const insight = insights[product.id];
                const src = sourceStyles[product.source ?? ""] ?? sourceStyles["기타 플랫폼"];
                const inCart = cart.items.some((i) => i.product.id === product.id);
                return (
                  <div key={product.id} className="flex flex-col group">
                    <div
                      onClick={() => router.push(`/folders/${activeFolderId}/${product.id}`)}
                      className="relative w-full aspect-square bg-[#f8f8f8] overflow-hidden cursor-pointer mb-2.5"
                      style={{ borderRadius: "10px" }}
                      role="link"
                    >
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-[#ccc]">이미지 준비중입니다</div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" style={{ borderRadius: "10px" }} />
                      {/* 빠른 장바구니 담기 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cart.addItem(product, 1);
                        }}
                        className="absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 bg-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                        style={{
                          borderRadius: "8px",
                          boxShadow: "rgba(0,0,0,0.1) 0px 2px 8px, rgba(0,0,0,0.06) 0px 0px 0px 1px",
                        }}
                        title="장바구니 담기"
                      >
                        {inCart ? (
                          <ShoppingCart size={14} strokeWidth={2} color="#111" />
                        ) : (
                          <Plus size={14} strokeWidth={1.5} color="#555" />
                        )}
                      </button>
                    </div>
                    {product.source && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: src.color }} />
                        <span className="text-[11px] font-medium" style={{ color: src.color }}>{product.source}</span>
                      </div>
                    )}
                    <button onClick={() => router.push(`/folders/${activeFolderId}/${product.id}`)} className="text-left text-[13px] text-[#333] leading-[1.45] cursor-pointer hover:text-[#000] transition-colors line-clamp-2 mb-1">
                      {product.name}
                    </button>
                    <p className="text-[14px] font-semibold text-[#111] mb-1.5" style={{ letterSpacing: "-0.2px" }}>
                      {product.price.toLocaleString("ko-KR")}원
                    </p>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex items-center gap-1 mb-1.5">
                        {product.tags.map((tag) => {
                          const ts = tagStyles[tag] ?? { bg: "#f5f5f5", color: "#999" };
                          return <span key={tag} className="px-1.5 py-[2px] text-[10px] font-medium" style={{ borderRadius: "4px", backgroundColor: ts.bg, color: ts.color }}>{tag}</span>;
                        })}
                      </div>
                    )}
                    {insight && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-[#999]"><Users size={10} strokeWidth={1.5} /><span>{insight.team} {insight.freq}</span></div>
                        <div className="flex items-center gap-1 text-[10px] text-[#22c55e]"><TrendingDown size={10} strokeWidth={1.5} /><span>{insight.benchmark}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ 우측: 장바구니 사이드 패널 ══ */}
      <CartSidePanel />

      {/* ══ 새 폴더 모달 (설정-전체상품관리 UX 공유) ══ */}
      {showAddFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowAddFolderModal(false)}
          />
          <div
            className="relative w-[380px] bg-white"
            style={{
              borderRadius: "18px",
              boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px",
            }}
          >
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-[16px] font-semibold text-[#111]">새 폴더</h3>
              <p className="text-[12px] text-[#999] mt-1">
                {newFolderParentId === null
                  ? "최상위에 폴더가 생성됩니다"
                  : `"${findFolderDeep(folders, newFolderParentId)?.name ?? ""}" 하위에 생성됩니다`}
              </p>
            </div>

            {/* 위치 선택 — 전체 트리에서 부모 선택 가능 (무제한 중첩) */}
            <div className="px-6 pt-2 pb-3">
              <p className="text-[11px] font-medium text-[#888] mb-2" style={{ letterSpacing: "0.14px" }}>
                위치
              </p>
              <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto">
                <button
                  onClick={() => setNewFolderParentId(null)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[12.5px] rounded-lg text-left cursor-pointer hover:bg-[#fafafa] transition-colors"
                  style={{
                    backgroundColor: newFolderParentId === null ? "#f5f5f5" : "transparent",
                    color: newFolderParentId === null ? "#111" : "#666",
                    fontWeight: newFolderParentId === null ? 500 : 400,
                    boxShadow: newFolderParentId === null ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "none",
                  }}
                >
                  <FolderIcon size={13} strokeWidth={1.5} color={newFolderParentId === null ? "#333" : "#aaa"} />
                  최상위
                </button>
                {folders.map((f) => (
                  <ParentPickerRow
                    key={f.id}
                    folder={f}
                    depth={0}
                    selectedId={newFolderParentId}
                    onSelect={setNewFolderParentId}
                  />
                ))}
              </div>
            </div>

            {/* 이름 입력 */}
            <div className="px-6 pt-2 pb-4">
              <p className="text-[11px] font-medium text-[#888] mb-2" style={{ letterSpacing: "0.14px" }}>
                이름
              </p>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setShowAddFolderModal(false);
                }}
                placeholder="폴더 이름을 입력하세요"
                className="w-full px-3 py-2.5 text-[13px] rounded-lg outline-none bg-white"
                style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1.5px" }}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button
                onClick={() => setShowAddFolderModal(false)}
                className="px-4 py-[8px] text-[13px] text-[#777] rounded-lg cursor-pointer hover:bg-[#f0f0f0]"
                style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}
              >
                취소
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-[8px] text-[13px] text-white font-medium rounded-lg cursor-pointer hover:opacity-80 disabled:cursor-not-allowed"
                style={{ backgroundColor: newFolderName.trim() ? "#111" : "#ccc" }}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Toast ══ */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium"
          style={{ borderRadius: "10px" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-2 text-[13px] cursor-pointer transition-colors relative" style={{ color: active ? "#111" : "#999", fontWeight: active ? 600 : 400 }}>
      {label}
      {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[#111]" style={{ width: "calc(100% - 16px)", borderRadius: "1px" }} />}
    </button>
  );
}

/* ═══════════════════════════════════════
   ParentPickerRow — 새 폴더 모달의 부모 선택 트리 행 (재귀)
   ═══════════════════════════════════════ */

function ParentPickerRow({
  folder,
  depth,
  selectedId,
  onSelect,
}: {
  folder: Folder;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const ParentIcon = iconMap[folder.icon] ?? FolderIcon;
  const selected = selectedId === folder.id;
  return (
    <>
      <button
        onClick={() => onSelect(folder.id)}
        className="flex items-center gap-2 w-full py-2 pr-3 text-[12.5px] rounded-lg text-left cursor-pointer hover:bg-[#fafafa] transition-colors"
        style={{
          paddingLeft: `${12 + depth * 14}px`,
          backgroundColor: selected ? "#f5f5f5" : "transparent",
          color: selected ? "#111" : "#666",
          fontWeight: selected ? 500 : 400,
          boxShadow: selected ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "none",
        }}
      >
        <ParentIcon size={13} strokeWidth={1.5} color={selected ? "#333" : "#aaa"} />
        <span className="flex-1 truncate">{folder.name}</span>
        <span className="text-[10px] text-[#bbb]">하위</span>
      </button>
      {folder.children?.map((c) => (
        <ParentPickerRow key={c.id} folder={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════
   FolderRow — 폴더 트리의 한 행 (무제한 중첩 지원)
   ═══════════════════════════════════════ */

function FolderRow({
  folder,
  depth,
  activeFolderId,
  expandedFolders,
  onSelect,
  onToggleExpand,
}: {
  folder: Folder;
  depth: number;
  activeFolderId: string;
  expandedFolders: Record<string, boolean>;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}) {
  const Icon = iconMap[folder.icon] ?? Paperclip;
  const isActive = folder.id === activeFolderId;
  const hasChildren = !!folder.children && folder.children.length > 0;
  const isExpanded = !!expandedFolders[folder.id];
  const count = folder.productIds.length;

  return (
    <>
      <div
        className="flex items-center w-full rounded-lg text-[13px] transition-all mb-0.5"
        style={{
          backgroundColor: isActive ? "#fff" : "transparent",
          color: isActive ? "#111" : "#666",
          fontWeight: isActive ? 500 : 400,
          boxShadow: isActive ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "none",
          paddingLeft: depth > 0 ? `${depth * 14}px` : undefined,
        }}
      >
        {/* 펼침 토글 (자식 없으면 간격만 유지) */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(folder.id);
            }}
            className="w-5 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-[#eee] transition-colors shrink-0"
            aria-label={isExpanded ? "하위 폴더 접기" : "하위 폴더 펼치기"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown size={12} strokeWidth={1.8} color="#888" />
            ) : (
              <ChevronRight size={12} strokeWidth={1.8} color="#888" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" aria-hidden="true" />
        )}

        {/* 폴더 본체 */}
        <button
          onClick={() => onSelect(folder.id)}
          className="flex items-center gap-2 flex-1 min-w-0 pl-1 pr-3 py-[8px] text-left cursor-pointer"
        >
          <Icon size={depth === 0 ? 15 : 13} strokeWidth={1.5} color={isActive ? "#333" : "#aaa"} />
          <span className="flex-1 text-left truncate">{folder.name}</span>
          <span
            className="text-[10px] font-medium px-1.5 py-[1px] rounded-full shrink-0"
            style={{
              backgroundColor: isActive ? "#f0f0f0" : "rgba(0,0,0,0.04)",
              color: isActive ? "#444" : "#bbb",
            }}
          >
            {count}
          </span>
        </button>
      </div>

      {/* 하위 폴더 */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* 들여쓰기 가이드 라인 */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${depth * 14 + 14}px`,
              width: "1px",
              backgroundColor: "rgba(0,0,0,0.06)",
            }}
            aria-hidden="true"
          />
          {folder.children!.map((child) => (
            <FolderRow
              key={child.id}
              folder={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              expandedFolders={expandedFolders}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </>
  );
}
