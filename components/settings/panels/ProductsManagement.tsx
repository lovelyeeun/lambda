"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  Folder as FolderIcon, FolderOpen, ChevronRight, ChevronDown,
  Search, Copy, Trash2, ArrowRightLeft,
  Package, X, Check, Users, FileText, Tag, MessageSquare,
  FolderPlus, Pencil, Shield,
} from "lucide-react";

/* ── 타입 ── */
interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
  productIds: string[];
  description?: string;
  accessScope?: string;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  brand: string;
  category: string;
  purpose: string;
  summary: string;
  memo: string;
  accessScope: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

/* ── 팀원 목 데이터 ── */
const teamMembers: TeamMember[] = [
  { id: "u-01", name: "김원균", email: "one@rawlabs.io", department: "경영", role: "관리자" },
  { id: "u-02", name: "박은서", email: "eun@rawlabs.io", department: "구매", role: "구매담당" },
  { id: "u-03", name: "이지현", email: "jihyun@rawlabs.io", department: "디자인", role: "매니저" },
  { id: "u-04", name: "최민수", email: "minsu@rawlabs.io", department: "개발", role: "일반" },
  { id: "u-05", name: "정서연", email: "seoyeon@rawlabs.io", department: "마케팅", role: "일반" },
  { id: "u-06", name: "한도윤", email: "doyun@rawlabs.io", department: "경영지원", role: "매니저" },
  { id: "u-07", name: "송유진", email: "yujin@rawlabs.io", department: "영업", role: "일반" },
  { id: "u-08", name: "윤재호", email: "jaeho@rawlabs.io", department: "개발", role: "일반" },
  { id: "u-09", name: "임하늘", email: "haneul@rawlabs.io", department: "CS", role: "일반" },
  { id: "u-10", name: "오승현", email: "sh@rawlabs.io", department: "구매", role: "구매담당" },
];

/* ── 초기 폴더 트리 ── */
const initialFolderTree: FolderNode[] = [
  {
    id: "f-office", name: "사무용품", description: "일상 사무 소모품", accessScope: "전체 직원", productIds: [],
    children: [
      { id: "f-paper", name: "용지류", description: "복사용지, 라벨지 등", accessScope: "전체 직원", productIds: ["p-01", "p-02"], children: [] },
      { id: "f-ink", name: "잉크/토너", description: "프린터 소모품", accessScope: "구매담당", productIds: ["p-03"], children: [] },
      {
        id: "f-stationery", name: "필기구/사무소모품", description: "펜, 포스트잇 등", accessScope: "전체 직원", productIds: ["p-04", "p-05"],
        children: [
          { id: "f-pen", name: "필기구", description: "볼펜, 마커, 형광펜", accessScope: "전체 직원", productIds: ["p-04"], children: [] },
          { id: "f-note", name: "메모/부착용품", description: "포스트잇, 테이프", accessScope: "전체 직원", productIds: ["p-05"], children: [] },
        ],
      },
    ],
  },
  {
    id: "f-it", name: "IT장비", description: "전자기기 및 IT 기기", accessScope: "관리자/매니저", productIds: [],
    children: [
      { id: "f-display", name: "모니터/디스플레이", description: "모니터, 빔프로젝터", accessScope: "관리자", productIds: ["p-06"], children: [] },
      { id: "f-printer", name: "프린터/복합기", description: "레이저, 잉크젯 프린터", accessScope: "관리자", productIds: ["p-07", "p-08"], children: [] },
      { id: "f-tablet", name: "태블릿/모바일", description: "업무용 태블릿", accessScope: "관리자/매니저", productIds: ["p-09"], children: [] },
    ],
  },
  {
    id: "f-furniture", name: "가구", description: "사무용 가구", accessScope: "관리자", productIds: [],
    children: [
      { id: "f-chair", name: "의자", description: "사무용 의자", accessScope: "관리자", productIds: ["p-10"], children: [] },
      { id: "f-desk", name: "데스크", description: "사무용 책상", accessScope: "관리자", productIds: ["p-11"], children: [] },
    ],
  },
  { id: "f-living", name: "생활용품", description: "사무실 생활 편의용품", accessScope: "전체 직원", productIds: ["p-12", "p-13"], children: [] },
];

/* ── 상품 데이터 ── */
const allProducts: ProductItem[] = [
  { id: "p-01", name: "더블에이 A4 복사용지 80g 500매", price: 12900, brand: "Double A", category: "용지", purpose: "일반 사무 인쇄/복사", summary: "사무용품비", memo: "월 10박스 정기 주문", accessScope: "전체 직원" },
  { id: "p-02", name: "한국제지 밀크 A4 80g 2,500매", price: 27500, brand: "한국제지", category: "용지", purpose: "대량 인쇄용", summary: "사무용품비", memo: "분기 단위 발주", accessScope: "전체 직원" },
  { id: "p-03", name: "HP 206A 정품 토너 검정", price: 89000, brand: "HP", category: "잉크/토너", purpose: "7층 복합기 전용", summary: "사무용품비", memo: "재고 2개 이하 시 발주", accessScope: "구매담당" },
  { id: "p-04", name: "스테들러 트리플러스 파인라이너 20색", price: 24000, brand: "STAEDTLER", category: "필기구", purpose: "디자인팀 시안 작업", summary: "사무용품비", memo: "", accessScope: "전체 직원" },
  { id: "p-05", name: "3M 포스트잇 강한점착용 76x76mm 5팩", price: 8900, brand: "3M", category: "사무소모품", purpose: "회의/브레인스토밍", summary: "사무용품비", memo: "네온 5색 지정", accessScope: "전체 직원" },
  { id: "p-06", name: "LG 27인치 4K UHD 모니터 27UP850", price: 459000, brand: "LG", category: "모니터", purpose: "신규 입사자 지급용", summary: "비품비", memo: "USB-C 96W 충전 지원 모델", accessScope: "관리자" },
  { id: "p-07", name: "후지제록스 DocuCentre S2520 복합기", price: 1890000, brand: "FUJIFILM", category: "복합기", purpose: "7층 공용 복합기", summary: "비품비", memo: "유지보수 계약 포함", accessScope: "관리자" },
  { id: "p-08", name: "브라더 HL-L2350DW 흑백 레이저 프린터", price: 159000, brand: "Brother", category: "프린터", purpose: "경영지원팀 전용", summary: "비품비", memo: "Wi-Fi 연결 필수", accessScope: "관리자" },
  { id: "p-09", name: "삼성 갤럭시탭 S9 FE 10.9인치", price: 549000, brand: "Samsung", category: "태블릿", purpose: "외근직 업무용", summary: "비품비", memo: "S펜 포함, 보호케이스 별도 구매", accessScope: "관리자/매니저" },
  { id: "p-10", name: "시디즈 T50 AIR 메쉬 사무용 의자", price: 498000, brand: "시디즈", category: "의자", purpose: "신규 입사자 지급", summary: "비품비", memo: "블랙/그레이 중 선택", accessScope: "관리자" },
  { id: "p-11", name: "한화 전동 높이조절 데스크 HED-1200", price: 389000, brand: "한화", category: "데스크", purpose: "스탠딩 데스크 희망자", summary: "비품비", memo: "사전 신청 후 구매", accessScope: "관리자" },
  { id: "p-12", name: "코웨이 아이콘 정수기 CHP-7210N", price: 38900, brand: "코웨이", category: "정수기", purpose: "7층 탕비실", summary: "복리후생비", memo: "월 렌탈료 38,900원", accessScope: "전체 직원" },
  { id: "p-13", name: "킨토 UNITEA 원터치 티포트 720ml", price: 28000, brand: "KINTO", category: "주방용품", purpose: "탕비실 비치", summary: "복리후생비", memo: "", accessScope: "전체 직원" },
];

/* ── 유틸 ── */
function formatPrice(n: number) { return n.toLocaleString("ko-KR") + "원"; }

function collectProductIds(folder: FolderNode): string[] {
  const ids = [...folder.productIds];
  for (const child of folder.children) { ids.push(...collectProductIds(child)); }
  return ids;
}

function findFolder(tree: FolderNode[], id: string): FolderNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findFolder(node.children, id);
    if (found) return found;
  }
  return null;
}

function cloneTree(tree: FolderNode[]): FolderNode[] {
  return tree.map((n) => ({ ...n, children: cloneTree(n.children) }));
}

function removeFolderFromTree(tree: FolderNode[], id: string): { tree: FolderNode[]; removed: FolderNode | null } {
  let removed: FolderNode | null = null;
  const filter = (nodes: FolderNode[]): FolderNode[] =>
    nodes.reduce<FolderNode[]>((acc, node) => {
      if (node.id === id) { removed = { ...node, children: cloneTree(node.children) }; return acc; }
      acc.push({ ...node, children: filter(node.children) });
      return acc;
    }, []);
  return { tree: filter(tree), removed };
}

function addFolderToTree(tree: FolderNode[], parentId: string, newFolder: FolderNode): FolderNode[] {
  return tree.map((node) => {
    if (node.id === parentId) return { ...node, children: [...node.children, newFolder] };
    return { ...node, children: addFolderToTree(node.children, parentId, newFolder) };
  });
}

function isDescendant(tree: FolderNode[], parentId: string, childId: string): boolean {
  const parent = findFolder(tree, parentId);
  if (!parent) return false;
  if (parent.children.some((c) => c.id === childId)) return true;
  return parent.children.some((c) => isDescendant(tree, c.id, childId));
}

/* ── 메인 컴포넌트 ── */
export default function ProductsManagement() {
  const [folders, setFolders] = useState<FolderNode[]>(() => cloneTree(initialFolderTree));
  const [selectedFolderId, setSelectedFolderId] = useState<string>("f-office");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["f-office", "f-it", "f-furniture"]));
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [editFields, setEditFields] = useState<{ purpose: string; summary: string; memo: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessSearch, setAccessSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(teamMembers.map((m) => m.id)));

  /* ── 드래그앤드롭 ── */
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /* ── 폴더 추가 모달 ── */
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const folderIdCounter = useRef(100);

  const selectedFolder = selectedFolderId === "__all__" ? null : findFolder(folders, selectedFolderId);
  const folderProductIds = selectedFolder ? collectProductIds(selectedFolder) : allProducts.map((p) => p.id);

  const products = useMemo(() => {
    let list = allProducts.filter((p) => folderProductIds.includes(p.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.purpose.includes(searchQuery));
    }
    return list;
  }, [selectedFolderId, searchQuery, folderProductIds]);

  /* ── 드래그앤드롭 핸들러 ── */
  const handleDragStart = useCallback((id: string) => { setDraggedId(id); }, []);
  const handleDragOver = useCallback((id: string) => { setDragOverId(id); }, []);
  const handleDragLeave = useCallback(() => { setDragOverId(null); }, []);
  const handleDragEnd = useCallback(() => { setDraggedId(null); setDragOverId(null); }, []);
  const handleDrop = useCallback((targetId: string) => {
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }
    // 자기 자신의 하위로 이동 방지
    if (isDescendant(folders, draggedId, targetId)) { handleDragEnd(); return; }
    setFolders((prev) => {
      const { tree, removed } = removeFolderFromTree(prev, draggedId);
      if (!removed) return prev;
      return addFolderToTree(tree, targetId, removed);
    });
    setExpandedIds((prev) => new Set([...prev, targetId]));
    showToast("폴더가 이동되었습니다");
    handleDragEnd();
  }, [draggedId, folders]);

  /* ── 폴더 추가 ── */
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newId = "f-new-" + (folderIdCounter.current++);
    const newFolder: FolderNode = { id: newId, name: newFolderName.trim(), children: [], productIds: [], description: "", accessScope: "전체 직원" };
    if (selectedFolderId === "__all__") {
      // 루트에 추가
      setFolders((prev) => [...prev, newFolder]);
    } else {
      setFolders((prev) => addFolderToTree(prev, selectedFolderId, newFolder));
      setExpandedIds((prev) => new Set([...prev, selectedFolderId]));
    }
    setNewFolderName("");
    setShowAddFolderModal(false);
    showToast(`"${newFolder.name}" 폴더가 생성되었습니다`);
  };

  const toggleExpand = (id: string) => { setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleSelectProduct = (id: string) => { setSelectedProductIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleSelectAll = () => { selectedProductIds.size === products.length ? setSelectedProductIds(new Set()) : setSelectedProductIds(new Set(products.map((p) => p.id))); };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
  const handleBulkAction = (action: string) => { const c = selectedProductIds.size; showToast(c + "개 상품이 " + (action === "delete" ? "삭제" : action === "copy" ? "복사" : "이동") + "되었습니다"); setSelectedProductIds(new Set()); };
  const handleSingleAction = (product: ProductItem, action: string) => { showToast(product.name + " " + (action === "delete" ? "삭제" : action === "copy" ? "복사" : "이동") + " 완료"); };

  const openDetail = (product: ProductItem) => {
    setDetailProduct(product);
    setEditFields(null);
  };

  const startEditFields = () => {
    if (detailProduct) {
      setEditFields({ purpose: detailProduct.purpose, summary: detailProduct.summary, memo: detailProduct.memo });
    }
  };

  const saveEditFields = () => {
    if (detailProduct && editFields) {
      setDetailProduct({ ...detailProduct, ...editFields });
      setEditFields(null);
      showToast("저장되었습니다");
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const filteredMembers = teamMembers.filter((m) =>
    !accessSearch || m.name.includes(accessSearch) || m.email.includes(accessSearch) || m.department.includes(accessSearch)
  );

  return (
    <div className="flex h-full -mx-10 -my-8">
      {/* ── 좌측: 폴더 트리 ── */}
      <div className="w-[240px] shrink-0 overflow-y-auto py-4 px-3" style={{ borderRight: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#fcfcfc" }}>
        <div className="flex items-center justify-between px-2 mb-3">
          <p className="text-[12px] font-semibold text-[#333]">폴더</p>
          <button className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-[#f0f0f0]" onClick={() => { setNewFolderName(""); setShowAddFolderModal(true); }}><FolderPlus size={14} strokeWidth={1.5} color="#999" /></button>
        </div>
        <button onClick={() => { setSelectedFolderId("__all__"); setSelectedProductIds(new Set()); }} className="flex items-center gap-2 w-full px-2 py-[6px] rounded-lg text-[12px] mb-1 cursor-pointer transition-all hover:bg-[#f0f0f0]" style={{ backgroundColor: selectedFolderId === "__all__" ? "#fff" : "transparent", color: selectedFolderId === "__all__" ? "#111" : "#666", fontWeight: selectedFolderId === "__all__" ? 600 : 400, boxShadow: selectedFolderId === "__all__" ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "none" }}>
          <Package size={13} strokeWidth={1.5} />전체 상품 ({allProducts.length})
        </button>
        <div className="h-px bg-[rgba(0,0,0,0.06)] mx-2 my-2" />
        {folders.map((node) => (
          <FolderTreeItem key={node.id} node={node} depth={0} selectedId={selectedFolderId} expandedIds={expandedIds} onSelect={(id) => { setSelectedFolderId(id); setSelectedProductIds(new Set()); }} onToggleExpand={toggleExpand} draggedId={draggedId} dragOverId={dragOverId} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDragEnd={handleDragEnd} onDrop={handleDrop} />
        ))}
      </div>

      {/* ── 우측: 상품 리스트 ── */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="shrink-0 px-6 pt-6 pb-4">
          {/* 폴더 제목 + 접근권한 */}
          <div className="mb-1">
            <h2 className="text-[17px] font-semibold text-[#111]">{selectedFolderId === "__all__" ? "전체 상품" : selectedFolder?.name ?? "전체 상품"}</h2>
            {selectedFolder && selectedFolderId !== "__all__" && (
              <div className="flex items-center gap-3 mt-1.5">
                {selectedFolder.description && <span className="text-[12px] text-[#999]">{selectedFolder.description}</span>}
                <button
                  onClick={() => { setShowAccessModal(true); setAccessSearch(""); }}
                  className="flex items-center gap-1.5 text-[11px] text-[#666] bg-[#f5f5f5] px-2.5 py-1 rounded-full cursor-pointer transition-colors hover:bg-[#eee]"
                  style={{ boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
                >
                  <Shield size={11} strokeWidth={1.5} />
                  접근권한: {selectedFolder.accessScope}
                  <Pencil size={10} strokeWidth={1.5} color="#aaa" />
                </button>
              </div>
            )}
          </div>

          {/* 검색 + 일괄 액션 */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-2 flex-1 px-3 py-2" style={{ borderRadius: "10px", backgroundColor: "#f8f8f8", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}>
              <Search size={14} strokeWidth={1.5} color="#bbb" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="상품명, 브랜드, 용도로 검색..." className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#ccc]" />
            </div>
            {selectedProductIds.size > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-[#999] mr-1">{selectedProductIds.size}개 선택</span>
                <button onClick={() => handleBulkAction("copy")} className="flex items-center gap-1 px-2.5 py-[5px] text-[11px] text-[#555] rounded-lg cursor-pointer hover:bg-[#f0f0f0]" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}><Copy size={12} strokeWidth={1.5} />복사</button>
                <button onClick={() => handleBulkAction("move")} className="flex items-center gap-1 px-2.5 py-[5px] text-[11px] text-[#555] rounded-lg cursor-pointer hover:bg-[#f0f0f0]" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}><ArrowRightLeft size={12} strokeWidth={1.5} />이동</button>
                <button onClick={() => handleBulkAction("delete")} className="flex items-center gap-1 px-2.5 py-[5px] text-[11px] text-[#ef4444] rounded-lg cursor-pointer hover:bg-[#fef2f2]" style={{ boxShadow: "rgba(239,68,68,0.15) 0px 0px 0px 1px" }}><Trash2 size={12} strokeWidth={1.5} />삭제</button>
              </div>
            )}
          </div>
        </div>

        {/* 테이블 헤더 */}
        <div className="shrink-0 grid items-center px-6 py-2 text-[11px] font-medium text-[#999] uppercase tracking-wider" style={{ gridTemplateColumns: "32px 1fr 100px 90px 100px 120px 96px", borderTop: "1px solid rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#fafafa" }}>
          <div className="flex justify-center">
            <button onClick={toggleSelectAll} className="w-4 h-4 rounded flex items-center justify-center cursor-pointer" style={{ backgroundColor: selectedProductIds.size === products.length && products.length > 0 ? "#111" : "#fff", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}>
              {selectedProductIds.size === products.length && products.length > 0 && <Check size={10} strokeWidth={3} color="#fff" />}
            </button>
          </div>
          <span>상품명</span><span>가격</span><span>브랜드</span><span>적요</span><span>접근범위</span><span className="text-center">관리</span>
        </div>

        {/* 상품 행 */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#bbb]"><Package size={32} strokeWidth={1} /><p className="text-[13px] mt-3">이 폴더에 상품이 없습니다</p></div>
          ) : (
            products.map((product) => {
              const isSelected = selectedProductIds.has(product.id);
              return (
                <div key={product.id} className="grid items-center px-6 py-3 text-[13px] transition-colors hover:bg-[#fafafa] cursor-pointer" style={{ gridTemplateColumns: "32px 1fr 100px 90px 100px 120px 96px", borderBottom: "1px solid rgba(0,0,0,0.04)", backgroundColor: isSelected ? "rgba(0,0,0,0.02)" : "transparent" }} onClick={() => openDetail(product)}>
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleSelectProduct(product.id)} className="w-4 h-4 rounded flex items-center justify-center cursor-pointer" style={{ backgroundColor: isSelected ? "#111" : "#fff", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}>
                      {isSelected && <Check size={10} strokeWidth={3} color="#fff" />}
                    </button>
                  </div>
                  <span className="font-medium text-[#222] truncate pr-2">{product.name}</span>
                  <span className="text-[#555]">{formatPrice(product.price)}</span>
                  <span className="text-[#888]">{product.brand}</span>
                  <span className="text-[#999]">{product.summary}</span>
                  <span className="flex items-center gap-1 text-[11px] text-[#888]"><Users size={10} strokeWidth={1.5} color="#bbb" />{product.accessScope}</span>
                  <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleSingleAction(product, "copy")} className="flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-colors hover:bg-[#f0f0f0]" title="복사"><Copy size={13} strokeWidth={1.5} color="#999" /></button>
                    <button onClick={() => handleSingleAction(product, "move")} className="flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-colors hover:bg-[#f0f0f0]" title="이동"><ArrowRightLeft size={13} strokeWidth={1.5} color="#999" /></button>
                    <button onClick={() => handleSingleAction(product, "delete")} className="flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-colors hover:bg-[#fef2f2]" title="삭제"><Trash2 size={13} strokeWidth={1.5} color="#ccc" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 상품 상세 모달 (용도/적요/메모 수정 가능) ── */}
      {detailProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => { setDetailProduct(null); setEditFields(null); }} />
          <div className="relative w-[460px] max-h-[75vh] overflow-y-auto bg-white" style={{ borderRadius: "18px", boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px" }}>
            <button onClick={() => { setDetailProduct(null); setEditFields(null); }} className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full cursor-pointer hover:bg-[#f0f0f0]"><X size={16} strokeWidth={1.5} color="#888" /></button>

            <div className="px-6 pt-6 pb-2">
              <h3 className="text-[17px] font-semibold text-[#111] pr-8">{detailProduct.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[14px] font-semibold text-[#111]">{formatPrice(detailProduct.price)}</span>
                <span className="text-[12px] text-[#999]">{detailProduct.brand}</span>
              </div>
            </div>

            <div className="px-6 pb-6">
              {editFields ? (
                /* ── 수정 모드 ── */
                <div className="flex flex-col gap-3 mt-4">
                  <div>
                    <p className="text-[11px] text-[#999] mb-1 flex items-center gap-1"><Tag size={11} strokeWidth={1.5} />용도</p>
                    <input type="text" value={editFields.purpose} onChange={(e) => setEditFields({ ...editFields, purpose: e.target.value })} className="w-full px-3 py-2.5 text-[13px] rounded-lg outline-none bg-white" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1.5px" }} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#999] mb-1 flex items-center gap-1"><FileText size={11} strokeWidth={1.5} />적요</p>
                    <input type="text" value={editFields.summary} onChange={(e) => setEditFields({ ...editFields, summary: e.target.value })} className="w-full px-3 py-2.5 text-[13px] rounded-lg outline-none bg-white" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1.5px" }} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#999] mb-1 flex items-center gap-1"><MessageSquare size={11} strokeWidth={1.5} />메모</p>
                    <textarea value={editFields.memo} onChange={(e) => setEditFields({ ...editFields, memo: e.target.value })} rows={3} className="w-full px-3 py-2.5 text-[13px] rounded-lg outline-none bg-white resize-none" style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1.5px" }} placeholder="메모를 입력하세요..." />
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button onClick={() => setEditFields(null)} className="px-3.5 py-[7px] text-[12px] text-[#777] rounded-lg cursor-pointer hover:bg-[#f0f0f0]" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>취소</button>
                    <button onClick={saveEditFields} className="flex items-center gap-1 px-3.5 py-[7px] text-[12px] text-white font-medium rounded-lg cursor-pointer hover:opacity-80" style={{ backgroundColor: "#111" }}><Check size={13} strokeWidth={2} />저장</button>
                  </div>
                </div>
              ) : (
                /* ── 보기 모드 ── */
                <>
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <span className="text-[12px] font-medium text-[#999]">상품 정보</span>
                    <button onClick={startEditFields} className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#666] rounded-md cursor-pointer hover:bg-[#f0f0f0]" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>
                      <Pencil size={11} strokeWidth={1.5} />수정
                    </button>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <InfoRow icon={Tag} label="용도" value={detailProduct.purpose} />
                    <InfoRow icon={FileText} label="적요" value={detailProduct.summary} />
                    <InfoRow icon={MessageSquare} label="메모" value={detailProduct.memo || "메모 없음"} muted={!detailProduct.memo} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 접근권한 수정 모달 (팀원 체크박스 + 검색) ── */}
      {showAccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => setShowAccessModal(false)} />
          <div className="relative w-[420px] max-h-[70vh] flex flex-col bg-white" style={{ borderRadius: "18px", boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px" }}>
            {/* 헤더 */}
            <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h3 className="text-[16px] font-semibold text-[#111]">접근권한 설정</h3>
                <p className="text-[12px] text-[#999] mt-0.5">{selectedFolder?.name} 폴더에 접근할 수 있는 팀원</p>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer hover:bg-[#f0f0f0]"><X size={16} strokeWidth={1.5} color="#888" /></button>
            </div>

            {/* 검색 */}
            <div className="shrink-0 px-6 pb-3">
              <div className="flex items-center gap-2 px-3 py-2" style={{ borderRadius: "10px", backgroundColor: "#f8f8f8", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}>
                <Search size={14} strokeWidth={1.5} color="#bbb" />
                <input type="text" value={accessSearch} onChange={(e) => setAccessSearch(e.target.value)} placeholder="이름, 이메일, 부서로 검색..." className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#ccc]" />
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[11px] text-[#999]">{selectedMembers.size}/{teamMembers.length}명 선택</span>
                <button
                  onClick={() => selectedMembers.size === teamMembers.length ? setSelectedMembers(new Set()) : setSelectedMembers(new Set(teamMembers.map((m) => m.id)))}
                  className="text-[11px] text-[#555] cursor-pointer hover:text-[#111]"
                >
                  {selectedMembers.size === teamMembers.length ? "전체 해제" : "전체 선택"}
                </button>
              </div>
            </div>

            {/* 팀원 리스트 */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="flex flex-col gap-1">
                {filteredMembers.map((member) => {
                  const isChecked = selectedMembers.has(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className="flex items-center gap-3 w-full p-2.5 rounded-lg text-left cursor-pointer transition-colors hover:bg-[#fafafa]"
                      style={{ backgroundColor: isChecked ? "rgba(0,0,0,0.02)" : "transparent" }}
                    >
                      <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: isChecked ? "#111" : "#fff", boxShadow: "rgba(0,0,0,0.12) 0px 0px 0px 1px" }}>
                        {isChecked && <Check size={10} strokeWidth={3} color="#fff" />}
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-[11px] font-bold text-white" style={{ backgroundColor: "#" + ((member.id.charCodeAt(2) * 987654) % 0xFFFFFF).toString(16).padStart(6, "0").slice(0, 6) }}>
                        {member.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[#222]">{member.name}</span>
                          <span className="text-[10px] text-[#999] bg-[#f5f5f5] px-1.5 py-0 rounded">{member.role}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-[#999]">{member.department}</span>
                          <span className="text-[11px] text-[#ccc]">&middot;</span>
                          <span className="text-[11px] text-[#bbb]">{member.email}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <p className="text-center text-[13px] text-[#bbb] py-8">검색 결과가 없습니다</p>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="shrink-0 px-6 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <button
                onClick={() => { setShowAccessModal(false); showToast("접근권한이 저장되었습니다"); }}
                className="w-full py-2.5 text-[14px] font-medium text-white rounded-xl cursor-pointer hover:opacity-80"
                style={{ backgroundColor: "#111" }}
              >
                {selectedMembers.size}명에게 접근권한 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 폴더 추가 모달 ── */}
      {showAddFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }} onClick={() => setShowAddFolderModal(false)} />
          <div className="relative w-[360px] bg-white" style={{ borderRadius: "18px", boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 16px 48px" }}>
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-[16px] font-semibold text-[#111]">새 폴더</h3>
              <p className="text-[12px] text-[#999] mt-1">
                {selectedFolderId === "__all__"
                  ? "최상위에 폴더가 생성됩니다"
                  : `"${selectedFolder?.name ?? ""}" 하위에 생성됩니다`}
              </p>
            </div>
            <div className="px-6 py-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddFolder(); }}
                placeholder="폴더 이름을 입력하세요"
                className="w-full px-3 py-2.5 text-[13px] rounded-lg outline-none bg-white"
                style={{ boxShadow: "rgba(0,0,0,0.08) 0px 0px 0px 1.5px" }}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <button onClick={() => setShowAddFolderModal(false)} className="px-4 py-[8px] text-[13px] text-[#777] rounded-lg cursor-pointer hover:bg-[#f0f0f0]" style={{ boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}>취소</button>
              <button onClick={handleAddFolder} className="px-4 py-[8px] text-[13px] text-white font-medium rounded-lg cursor-pointer hover:opacity-80" style={{ backgroundColor: newFolderName.trim() ? "#111" : "#ccc" }} disabled={!newFolderName.trim()}>생성</button>
            </div>
          </div>
        </div>
      )}

      {toast && (<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 bg-[#1a1a1a] text-white text-[13px] font-medium" style={{ borderRadius: "10px" }}>{toast}</div>)}
    </div>
  );
}

/* ── 폴더 트리 아이템 (드래그앤드롭 지원) ── */
interface FolderTreeItemProps {
  node: FolderNode; depth: number; selectedId: string; expandedIds: Set<string>;
  onSelect: (id: string) => void; onToggleExpand: (id: string) => void;
  draggedId: string | null; dragOverId: string | null;
  onDragStart: (id: string) => void; onDragOver: (id: string) => void;
  onDragLeave: () => void; onDragEnd: () => void; onDrop: (targetId: string) => void;
}

function FolderTreeItem({ node, depth, selectedId, expandedIds, onSelect, onToggleExpand, draggedId, dragOverId, onDragStart, onDragOver, onDragLeave, onDragEnd, onDrop }: FolderTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isDragging = draggedId === node.id;
  const isDropTarget = dragOverId === node.id && draggedId !== node.id;
  const totalProducts = collectProductIds(node).length;

  return (
    <>
      <div
        draggable
        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(node.id); }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(node.id); }}
        onDragLeave={onDragLeave}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(node.id); }}
        onDragEnd={onDragEnd}
        onClick={() => { onSelect(node.id); if (hasChildren) onToggleExpand(node.id); }}
        className="flex items-center gap-1.5 w-full py-[5px] rounded-lg text-[12px] cursor-grab transition-all hover:bg-[#f0f0f0]"
        style={{
          paddingLeft: (8 + depth * 16) + "px", paddingRight: "8px",
          backgroundColor: isDropTarget ? "#e8f0fe" : isSelected ? "#fff" : "transparent",
          color: isSelected ? "#111" : "#555",
          fontWeight: isSelected ? 600 : 400,
          boxShadow: isDropTarget ? "inset 0 0 0 1.5px #4285f4" : isSelected ? "rgba(0,0,0,0.06) 0px 0px 0px 1px" : "none",
          opacity: isDragging ? 0.4 : 1,
        }}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (isExpanded ? <ChevronDown size={12} strokeWidth={1.5} color="#999" /> : <ChevronRight size={12} strokeWidth={1.5} color="#ccc" />) : <span className="w-1 h-1 rounded-full bg-[#ddd]" />}
        </span>
        {isExpanded && hasChildren ? <FolderOpen size={13} strokeWidth={1.5} color={isSelected ? "#333" : "#aaa"} /> : <FolderIcon size={13} strokeWidth={1.5} color={isSelected ? "#333" : "#aaa"} />}
        <span className="flex-1 truncate text-left">{node.name}</span>
        <span className="text-[10px] text-[#bbb] shrink-0">{totalProducts}</span>
      </div>
      {hasChildren && isExpanded && (<div>{node.children.map((child) => (<FolderTreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} expandedIds={expandedIds} onSelect={onSelect} onToggleExpand={onToggleExpand} draggedId={draggedId} dragOverId={dragOverId} onDragStart={onDragStart} onDragOver={onDragOver} onDragLeave={onDragLeave} onDragEnd={onDragEnd} onDrop={onDrop} />))}</div>)}
    </>
  );
}

/* ── 정보 행 ── */
function InfoRow({ icon: Icon, label, value, muted = false }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>; label: string; value: string; muted?: boolean; }) {
  return (
    <div className="flex items-start gap-3 p-3" style={{ borderRadius: "10px", backgroundColor: "#fafafa" }}>
      <div className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: "#fff", boxShadow: "rgba(0,0,0,0.06) 0px 0px 0px 1px" }}><Icon size={13} strokeWidth={1.5} color="#999" /></div>
      <div><p className="text-[11px] text-[#999]">{label}</p><p className="text-[13px] mt-0.5" style={{ color: muted ? "#ccc" : "#333" }}>{value}</p></div>
    </div>
  );
}
