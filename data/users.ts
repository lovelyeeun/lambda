import type { User } from "@/lib/types";

export const users: User[] = [
  {
    id: "user-001",
    name: "박은서",
    email: "eunseo@rawlabs.kr",
    role: "관리자",
    department: "경영지원",
    permissions: {
      menuAccess: ["all"],
      canApprove: true,
      canPurchase: true,
      purchaseLimit: 0, // 무제한
      aiRestricted: false,
    },
    joinedAt: "2024-06-01",
  },
  {
    id: "user-002",
    name: "김지현",
    email: "jihyun@rawlabs.kr",
    role: "매니저",
    department: "경영지원",
    permissions: {
      menuAccess: ["all"],
      canApprove: true,
      canPurchase: true,
      purchaseLimit: 5000000,
      aiRestricted: false,
    },
    joinedAt: "2024-06-15",
  },
  {
    id: "user-003",
    name: "이준호",
    email: "junho@rawlabs.kr",
    role: "구매담당",
    department: "마케팅",
    permissions: {
      menuAccess: ["chat", "orders", "folders", "cs"],
      canApprove: false,
      canPurchase: true,
      purchaseLimit: 500000,
      aiRestricted: false,
    },
    joinedAt: "2025-01-10",
  },
  {
    id: "user-004",
    name: "정수민",
    email: "sumin@rawlabs.kr",
    role: "일반",
    department: "디자인",
    permissions: {
      menuAccess: ["chat", "orders", "folders"],
      canApprove: false,
      canPurchase: false,
      purchaseLimit: 0,
      aiRestricted: true,
    },
    joinedAt: "2025-03-01",
  },
  {
    id: "user-005",
    name: "최동현",
    email: "donghyun@rawlabs.kr",
    role: "구매담당",
    department: "개발",
    permissions: {
      menuAccess: ["chat", "orders", "folders", "cs", "cost-intel"],
      canApprove: false,
      canPurchase: true,
      purchaseLimit: 1000000,
      aiRestricted: false,
    },
    joinedAt: "2025-02-01",
  },
];

export const currentUser = users[0]; // 박은서 (로그인 유저)
