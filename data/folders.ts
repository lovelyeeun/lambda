import type { Folder } from "@/lib/types";

export const folders: Folder[] = [
  {
    id: "folder-001",
    name: "사무용품",
    icon: "Paperclip",
    productIds: ["prod-001", "prod-002", "prod-006", "prod-007"],
    description: "복사용지, 토너, 필기구 등 일상 소모품",
  },
  {
    id: "folder-002",
    name: "IT장비",
    icon: "Monitor",
    productIds: ["prod-005", "prod-008", "prod-011", "prod-003"],
    description: "모니터, 태블릿, 프린터 등 IT 기기",
  },
  {
    id: "folder-003",
    name: "가구",
    icon: "Armchair",
    productIds: ["prod-004", "prod-010"],
    description: "사무용 의자, 데스크 등 가구류",
  },
  {
    id: "folder-004",
    name: "생활용품",
    icon: "Coffee",
    productIds: ["prod-009", "prod-012"],
    description: "정수기, 티포트 등 사무실 생활용품",
  },
];
