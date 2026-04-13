"use client";

/* ═══════════════════════════════════════
   Settings Store
   채팅 / 폼 / 대시보드가 공유하는 단일 설정 상태.
   범위: 예산, 회사 정보, 배송지, 결제수단.
   (팀원은 /data/users 가 다른 모듈에서도 참조되므로 건드리지 않음)
   ═══════════════════════════════════════ */

import { createContext, useContext, useState, useCallback, useMemo } from "react";

/* ───────── Budget ───────── */

export interface Department {
  name: string;
  annual: number;
  used: number;
}

export interface BudgetState {
  departments: Department[];
  carryOver: boolean;
  renewPeriod: string;
}

const DEFAULT_BUDGET: BudgetState = {
  departments: [
    { name: "경영지원", annual: 36000000, used: 14200000 },
    { name: "마케팅", annual: 48000000, used: 22800000 },
    { name: "디자인", annual: 24000000, used: 11500000 },
    { name: "개발", annual: 12000000, used: 5100000 },
  ],
  carryOver: false,
  renewPeriod: "매월 1일",
};

/* ───────── Company Info ───────── */

export interface CompanyState {
  name: string;
  bizNumber: string;
  ceo: string;
  address: string;
  industry: string;
  businessType: string;
  foundedAt: string;
}

const DEFAULT_COMPANY: CompanyState = {
  name: "주식회사 로랩스",
  bizNumber: "142-87-01234",
  ceo: "김원균",
  address: "서울특별시 강남구 테헤란로 152, 7층",
  industry: "소프트웨어 개발 및 공급",
  businessType: "정보통신업",
  foundedAt: "2022-03-15",
};

export type CompanyField = keyof CompanyState;

/* ───────── Shipping ───────── */

export interface ShippingAddress {
  id: string;
  name: string;
  /** 도로명 주소 (우편번호 검색 결과) */
  address: string;
  receiver: string;
  phone: string;
  isDefault: boolean;
  /** 우편번호 */
  zipcode?: string;
  /** 상세주소 (동·호수 등) */
  detailAddress?: string;
  /** 배송시 요청사항 */
  deliveryNote?: string;
}

const DEFAULT_SHIPPING: ShippingAddress[] = [
  { id: "addr-1", name: "본사 3층", address: "서울시 강남구 테헤란로 152, 7층", receiver: "박은서", phone: "02-555-1234", isDefault: true },
  { id: "addr-2", name: "본사 5층 마케팅팀", address: "서울시 강남구 테헤란로 152, 5층", receiver: "이준호", phone: "02-555-5678", isDefault: false },
  { id: "addr-3", name: "물류센터", address: "경기도 성남시 분당구 판교로 256", receiver: "김태환", phone: "031-789-1000", isDefault: false },
];

/* ───────── Description rules (적요 — 더존 회계코드 매핑) ─────────
   더존 4자리 계정과목 코드 체계 기준.
   매칭 키워드 → (계정과목 코드, 계정과목명, 기본 적요 텍스트) */

export interface DescriptionRule {
  id: string;
  /** 매칭 키워드 또는 카테고리 (예: "노트북", "사무용품") */
  category: string;
  /** 더존 계정과목 코드 (예: "8210") */
  code: string;
  /** 계정과목명 (예: "사무용품비") */
  account: string;
  /** 기본 적요 텍스트 (회계장부 기재용) */
  memo: string;
}

export type RuleHistoryAction = "add" | "update" | "delete" | "bulk-add";
export type RuleHistorySource = "chat" | "manual" | "upload-excel" | "upload-doc" | "upload-prompt";

export interface RuleHistoryEntry {
  id: string;
  ts: number;
  action: RuleHistoryAction;
  source: RuleHistorySource;
  /** 변경 전 (update/delete 시) */
  before?: DescriptionRule;
  /** 변경 후 (add/update 시) */
  after?: DescriptionRule;
  /** 일괄 추가 시 카운트 */
  count?: number;
  /** 일괄 변경 시 요약 (예: "신규 8 / 변경 2") */
  summary?: string;
}

const DEFAULT_DESC_RULES: DescriptionRule[] = [
  { id: "rule-001", category: "용지", code: "8210", account: "사무용품비", memo: "복사용지/문서용지" },
  { id: "rule-002", category: "잉크/토너", code: "8220", account: "소모품비", memo: "프린터 소모품" },
  { id: "rule-003", category: "사무기기", code: "8240", account: "비품", memo: "프린터/복합기" },
  { id: "rule-004", category: "가구", code: "8240", account: "비품", memo: "사무가구" },
  { id: "rule-005", category: "전자기기", code: "8240", account: "비품", memo: "IT기기 (노트북·모니터)" },
  { id: "rule-006", category: "사무용품", code: "8210", account: "사무용품비", memo: "문구/소모품" },
  { id: "rule-007", category: "생활용품", code: "8270", account: "복리후생비", memo: "사무실 생활용품" },
];

/* ───────── Team (invited members — /data/users 충돌 회피용 별도 상태) ───────── */

export interface InvitedMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  /** "메일" | "엑셀" — 초대 경로 */
  via: "email" | "excel";
}

const DEFAULT_INVITED: InvitedMember[] = [];

/* ───────── Payment ───────── */

export interface PaymentMethod {
  id: string;
  type: "카드결제" | "BNPL";
  name: string;
  subLabel: string;
  active: boolean; // 사용중 여부
  monthlyLimit?: number; // 월 한도 (원)
}

const DEFAULT_PAYMENTS: PaymentMethod[] = [
  { id: "pm-1", type: "카드결제", name: "종법기명_신한 (1)", subLabel: "[신한카드법인] 5525-76**-****-850*", active: true, monthlyLimit: 1000000 },
  { id: "pm-2", type: "카드결제", name: "종법기명_신한", subLabel: "[신한카드법인] 5525-76**-****-850*", active: true, monthlyLimit: 1000000 },
  { id: "pm-3", type: "카드결제", name: "김원균 (1)", subLabel: "[신한카드법인] 5525-76**-****-586*", active: false },
  { id: "pm-6", type: "BNPL", name: "소모품 구매", subLabel: "[로랩스] 2948701037", active: false },
  { id: "pm-7", type: "BNPL", name: "자산 구매용", subLabel: "[로랩스] 2948701037", active: false },
];

/* ───────── Patches ───────── */

export type SettingsPatch =
  // Budget
  | { target: "budget.dept.annual"; dept: string; annual: number }
  | { target: "budget.carryOver"; value: boolean }
  | { target: "budget.renewPeriod"; value: string }
  // Company
  | { target: "company.field"; field: CompanyField; value: string }
  // Shipping
  | { target: "shipping.add"; address: Omit<ShippingAddress, "id" | "isDefault"> & { isDefault?: boolean } }
  | { target: "shipping.remove"; id: string }
  | { target: "shipping.setDefault"; id: string }
  | { target: "shipping.update"; id: string; patch: Partial<Omit<ShippingAddress, "id">> }
  // Payment
  | { target: "payment.setActive"; id: string; active: boolean }
  | { target: "payment.setLimit"; id: string; monthlyLimit: number }
  | { target: "payment.add"; method: Omit<PaymentMethod, "id"> }
  // Team
  | { target: "team.invite"; members: Omit<InvitedMember, "id">[] }
  | { target: "team.removeInvite"; id: string }
  // Description (적요)
  | { target: "description.add"; rule: Omit<DescriptionRule, "id">; source?: RuleHistorySource }
  | { target: "description.update"; id: string; patch: Partial<Omit<DescriptionRule, "id">>; source?: RuleHistorySource }
  | { target: "description.remove"; id: string; source?: RuleHistorySource }
  | { target: "description.bulkApply"; rules: Omit<DescriptionRule, "id">[]; source?: RuleHistorySource }
  | { target: "description.toggleAi"; value: boolean };

/** 패치가 영향을 주는 우측 패널의 focus key 로 변환 (적용 후 강조용) */
export function patchToFocusKey(patch: SettingsPatch): string {
  switch (patch.target) {
    case "budget.dept.annual": return `budget.dept.${patch.dept}`;
    case "budget.carryOver":
    case "budget.renewPeriod": return "budget.total";
    case "company.field": return `company.field.${patch.field}`;
    case "shipping.add": return "shipping.list";
    case "shipping.remove": return "shipping.list";
    case "shipping.setDefault":
    case "shipping.update": return `shipping.${patch.id}`;
    case "payment.setActive":
    case "payment.setLimit": return `payment.${patch.id}`;
    case "payment.add": return "payment.list";
    case "team.invite": return "team.list";
    case "team.removeInvite": return "team.list";
    case "description.add": return "description.list";
    case "description.update": return `description.${patch.id}`;
    case "description.remove": return "description.list";
    case "description.bulkApply": return "description.list";
    case "description.toggleAi": return "description.ai";
  }
}

/* ───────── Store ───────── */

interface SettingsStore {
  budget: BudgetState;
  company: CompanyState;
  shipping: ShippingAddress[];
  payments: PaymentMethod[];
  invitedMembers: InvitedMember[];
  descriptionRules: DescriptionRule[];
  descriptionRuleHistory: RuleHistoryEntry[];
  aiDescriptionEnabled: boolean;

  // Budget setters
  updateDeptAnnual: (dept: string, annual: number) => void;
  setCarryOver: (v: boolean) => void;
  setRenewPeriod: (v: string) => void;

  // Company setters
  updateCompanyField: (field: CompanyField, value: string) => void;

  // Shipping setters
  addShipping: (a: Omit<ShippingAddress, "id" | "isDefault"> & { isDefault?: boolean }) => void;
  removeShipping: (id: string) => void;
  setDefaultShipping: (id: string) => void;
  updateShipping: (id: string, patch: Partial<Omit<ShippingAddress, "id">>) => void;

  // Payment setters
  setPaymentActive: (id: string, active: boolean) => void;
  setPaymentLimit: (id: string, monthlyLimit: number) => void;
  addPayment: (m: Omit<PaymentMethod, "id">) => void;

  // Team setters
  addInvitedMembers: (members: Omit<InvitedMember, "id">[]) => void;
  removeInvitedMember: (id: string) => void;

  // Description setters
  addDescriptionRule: (rule: Omit<DescriptionRule, "id">, source?: RuleHistorySource) => void;
  updateDescriptionRule: (id: string, patch: Partial<Omit<DescriptionRule, "id">>, source?: RuleHistorySource) => void;
  removeDescriptionRule: (id: string, source?: RuleHistorySource) => void;
  /** 일괄 적용 — 충돌(category 동일) 시 덮어쓰기, 신규는 추가, 동일 데이터는 무시 */
  applyDescriptionBulk: (rules: Omit<DescriptionRule, "id">[], source?: RuleHistorySource) => { added: number; updated: number; skipped: number };
  toggleAiDescription: (value: boolean) => void;

  // Patch API
  applyPatch: (patch: SettingsPatch) => void;
  applyPatches: (patches: SettingsPatch[]) => void;

  // Derived
  totalAnnual: number;
  totalUsed: number;
  defaultShipping: ShippingAddress | null;
  activePaymentsCount: number;
}

const SettingsStoreContext = createContext<SettingsStore | null>(null);

export function SettingsStoreProvider({ children }: { children: React.ReactNode }) {
  const [budget, setBudget] = useState<BudgetState>(DEFAULT_BUDGET);
  const [company, setCompany] = useState<CompanyState>(DEFAULT_COMPANY);
  const [shipping, setShipping] = useState<ShippingAddress[]>(DEFAULT_SHIPPING);
  const [payments, setPayments] = useState<PaymentMethod[]>(DEFAULT_PAYMENTS);
  const [invitedMembers, setInvitedMembers] = useState<InvitedMember[]>(DEFAULT_INVITED);
  const [descriptionRules, setDescriptionRules] = useState<DescriptionRule[]>(DEFAULT_DESC_RULES);
  const [descriptionRuleHistory, setDescriptionRuleHistory] = useState<RuleHistoryEntry[]>([]);
  const [aiDescriptionEnabled, setAiDescriptionEnabled] = useState(true);

  const pushHistory = useCallback((entry: Omit<RuleHistoryEntry, "id" | "ts">) => {
    setDescriptionRuleHistory((prev) => [
      { ...entry, id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ts: Date.now() },
      ...prev,
    ]);
  }, []);

  /* Budget */
  const updateDeptAnnual = useCallback((dept: string, annual: number) => {
    setBudget((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => (d.name === dept ? { ...d, annual } : d)),
    }));
  }, []);
  const setCarryOver = useCallback((v: boolean) => setBudget((p) => ({ ...p, carryOver: v })), []);
  const setRenewPeriod = useCallback((v: string) => setBudget((p) => ({ ...p, renewPeriod: v })), []);

  /* Company */
  const updateCompanyField = useCallback((field: CompanyField, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  }, []);

  /* Shipping */
  const addShipping = useCallback((a: Omit<ShippingAddress, "id" | "isDefault"> & { isDefault?: boolean }) => {
    setShipping((prev) => {
      const id = `addr-${Date.now()}`;
      const next: ShippingAddress = {
        id,
        name: a.name,
        address: a.address,
        receiver: a.receiver,
        phone: a.phone,
        zipcode: a.zipcode,
        detailAddress: a.detailAddress,
        deliveryNote: a.deliveryNote,
        isDefault: !!a.isDefault,
      };
      if (next.isDefault) {
        return [...prev.map((x) => ({ ...x, isDefault: false })), next];
      }
      return [...prev, next];
    });
  }, []);
  const removeShipping = useCallback((id: string) => {
    setShipping((prev) => prev.filter((x) => x.id !== id));
  }, []);
  const setDefaultShipping = useCallback((id: string) => {
    setShipping((prev) => prev.map((x) => ({ ...x, isDefault: x.id === id })));
  }, []);
  const updateShipping = useCallback((id: string, patch: Partial<Omit<ShippingAddress, "id">>) => {
    setShipping((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  /* Payment */
  const setPaymentActive = useCallback((id: string, active: boolean) => {
    setPayments((prev) => prev.map((x) => (x.id === id ? { ...x, active } : x)));
  }, []);
  const setPaymentLimit = useCallback((id: string, monthlyLimit: number) => {
    setPayments((prev) => prev.map((x) => (x.id === id ? { ...x, monthlyLimit } : x)));
  }, []);
  const addPayment = useCallback((m: Omit<PaymentMethod, "id">) => {
    setPayments((prev) => [...prev, { ...m, id: `pm-${Date.now()}` }]);
  }, []);

  /* Team */
  const addInvitedMembers = useCallback((members: Omit<InvitedMember, "id">[]) => {
    setInvitedMembers((prev) => [
      ...prev,
      ...members.map((m, i) => ({ ...m, id: `inv-${Date.now()}-${i}` })),
    ]);
  }, []);
  const removeInvitedMember = useCallback((id: string) => {
    setInvitedMembers((prev) => prev.filter((x) => x.id !== id));
  }, []);

  /* Description (적요) */
  const addDescriptionRule = useCallback((rule: Omit<DescriptionRule, "id">, source: RuleHistorySource = "manual") => {
    const newRule: DescriptionRule = { ...rule, id: `rule-${Date.now()}` };
    setDescriptionRules((prev) => [...prev, newRule]);
    pushHistory({ action: "add", source, after: newRule });
  }, [pushHistory]);

  const updateDescriptionRule = useCallback((id: string, patch: Partial<Omit<DescriptionRule, "id">>, source: RuleHistorySource = "manual") => {
    setDescriptionRules((prev) => {
      const before = prev.find((r) => r.id === id);
      if (!before) return prev;
      const after = { ...before, ...patch };
      pushHistory({ action: "update", source, before, after });
      return prev.map((r) => (r.id === id ? after : r));
    });
  }, [pushHistory]);

  const removeDescriptionRule = useCallback((id: string, source: RuleHistorySource = "manual") => {
    setDescriptionRules((prev) => {
      const before = prev.find((r) => r.id === id);
      if (before) pushHistory({ action: "delete", source, before });
      return prev.filter((r) => r.id !== id);
    });
  }, [pushHistory]);

  const applyDescriptionBulk = useCallback((rules: Omit<DescriptionRule, "id">[], source: RuleHistorySource = "upload-excel") => {
    let added = 0, updated = 0, skipped = 0;
    setDescriptionRules((prev) => {
      const next = [...prev];
      for (const r of rules) {
        const existingIdx = next.findIndex((x) => x.category === r.category);
        if (existingIdx === -1) {
          next.push({ ...r, id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` });
          added++;
        } else {
          const existing = next[existingIdx];
          if (existing.code === r.code && existing.account === r.account && existing.memo === r.memo) {
            skipped++;
          } else {
            next[existingIdx] = { ...existing, ...r };
            updated++;
          }
        }
      }
      return next;
    });
    pushHistory({
      action: "bulk-add",
      source,
      count: added + updated,
      summary: `신규 ${added} / 변경 ${updated} / 무시 ${skipped}`,
    });
    return { added, updated, skipped };
  }, [pushHistory]);

  const toggleAiDescription = useCallback((value: boolean) => {
    setAiDescriptionEnabled(value);
  }, []);

  /* Patches */
  const applyPatch = useCallback((patch: SettingsPatch) => {
    switch (patch.target) {
      case "budget.dept.annual": updateDeptAnnual(patch.dept, patch.annual); break;
      case "budget.carryOver": setCarryOver(patch.value); break;
      case "budget.renewPeriod": setRenewPeriod(patch.value); break;
      case "company.field": updateCompanyField(patch.field, patch.value); break;
      case "shipping.add": addShipping(patch.address); break;
      case "shipping.remove": removeShipping(patch.id); break;
      case "shipping.setDefault": setDefaultShipping(patch.id); break;
      case "shipping.update": updateShipping(patch.id, patch.patch); break;
      case "payment.setActive": setPaymentActive(patch.id, patch.active); break;
      case "payment.setLimit": setPaymentLimit(patch.id, patch.monthlyLimit); break;
      case "payment.add": addPayment(patch.method); break;
      case "team.invite": addInvitedMembers(patch.members); break;
      case "team.removeInvite": removeInvitedMember(patch.id); break;
      case "description.add": addDescriptionRule(patch.rule, patch.source); break;
      case "description.update": updateDescriptionRule(patch.id, patch.patch, patch.source); break;
      case "description.remove": removeDescriptionRule(patch.id, patch.source); break;
      case "description.bulkApply": applyDescriptionBulk(patch.rules, patch.source); break;
      case "description.toggleAi": toggleAiDescription(patch.value); break;
    }
  }, [updateDeptAnnual, setCarryOver, setRenewPeriod, updateCompanyField, addShipping, removeShipping, setDefaultShipping, updateShipping, setPaymentActive, setPaymentLimit, addPayment, addInvitedMembers, removeInvitedMember, addDescriptionRule, updateDescriptionRule, removeDescriptionRule, applyDescriptionBulk, toggleAiDescription]);

  const applyPatches = useCallback((patches: SettingsPatch[]) => {
    patches.forEach(applyPatch);
  }, [applyPatch]);

  /* Derived */
  const totalAnnual = useMemo(() => budget.departments.reduce((s, d) => s + d.annual, 0), [budget.departments]);
  const totalUsed = useMemo(() => budget.departments.reduce((s, d) => s + d.used, 0), [budget.departments]);
  const defaultShipping = useMemo(() => shipping.find((x) => x.isDefault) ?? shipping[0] ?? null, [shipping]);
  const activePaymentsCount = useMemo(() => payments.filter((p) => p.active).length, [payments]);

  const value = useMemo<SettingsStore>(() => ({
    budget, company, shipping, payments, invitedMembers,
    descriptionRules, descriptionRuleHistory, aiDescriptionEnabled,
    updateDeptAnnual, setCarryOver, setRenewPeriod,
    updateCompanyField,
    addShipping, removeShipping, setDefaultShipping, updateShipping,
    setPaymentActive, setPaymentLimit, addPayment,
    addInvitedMembers, removeInvitedMember,
    addDescriptionRule, updateDescriptionRule, removeDescriptionRule, applyDescriptionBulk, toggleAiDescription,
    applyPatch, applyPatches,
    totalAnnual, totalUsed, defaultShipping, activePaymentsCount,
  }), [
    budget, company, shipping, payments, invitedMembers,
    descriptionRules, descriptionRuleHistory, aiDescriptionEnabled,
    updateDeptAnnual, setCarryOver, setRenewPeriod,
    updateCompanyField,
    addShipping, removeShipping, setDefaultShipping, updateShipping,
    setPaymentActive, setPaymentLimit, addPayment,
    addInvitedMembers, removeInvitedMember,
    addDescriptionRule, updateDescriptionRule, removeDescriptionRule, applyDescriptionBulk, toggleAiDescription,
    applyPatch, applyPatches,
    totalAnnual, totalUsed, defaultShipping, activePaymentsCount,
  ]);

  return (
    <SettingsStoreContext.Provider value={value}>
      {children}
    </SettingsStoreContext.Provider>
  );
}

export function useSettingsStore() {
  const ctx = useContext(SettingsStoreContext);
  if (!ctx) throw new Error("useSettingsStore must be used within SettingsStoreProvider");
  return ctx;
}
