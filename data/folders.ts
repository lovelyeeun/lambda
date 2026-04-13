import type { Folder } from "@/lib/types";

export const folders: Folder[] = [
  {
    id: "folder-001",
    name: "사무용품",
    icon: "Paperclip",
    productIds: ["prod-001", "prod-002", "prod-006", "prod-007"],
    description: "복사용지, 토너, 필기구 등 일상 소모품",
    children: [
      {
        id: "folder-001-a",
        name: "용지류",
        icon: "FileText",
        productIds: ["prod-001"],
        description: "복사용지, 포스트잇 등",
      },
      {
        id: "folder-001-b",
        name: "잉크·토너",
        icon: "Droplet",
        productIds: ["prod-002"],
        description: "프린터 소모품",
      },
      {
        id: "folder-001-c",
        name: "필기·소모품",
        icon: "Pen",
        productIds: ["prod-006", "prod-007"],
        description: "볼펜, 형광펜, 스테이플러 등",
      },
    ],
  },
  {
    id: "folder-002",
    name: "IT장비",
    icon: "Monitor",
    productIds: ["prod-005", "prod-008", "prod-011", "prod-003"],
    description: "모니터, 태블릿, 프린터 등 IT 기기",
    children: [
      {
        id: "folder-002-a",
        name: "디스플레이",
        icon: "Monitor",
        productIds: ["prod-005", "prod-008"],
        description: "모니터, 태블릿",
      },
      {
        id: "folder-002-b",
        name: "사무기기",
        icon: "Printer",
        productIds: ["prod-011", "prod-003"],
        description: "프린터, 복합기 등",
      },
    ],
  },
  {
    id: "folder-003",
    name: "가구",
    icon: "Armchair",
    productIds: ["prod-004", "prod-010"],
    description: "사무용 의자, 데스크 등 가구류",
    children: [
      {
        id: "folder-003-a",
        name: "의자",
        icon: "Armchair",
        productIds: ["prod-004"],
        description: "사무용 의자",
      },
      {
        id: "folder-003-b",
        name: "데스크",
        icon: "Square",
        productIds: ["prod-010"],
        description: "사무용 데스크",
      },
    ],
  },
  {
    id: "folder-004",
    name: "생활용품",
    icon: "Coffee",
    productIds: ["prod-009", "prod-012"],
    description: "정수기, 티포트 등 사무실 생활용품",
  },
];
