"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquarePlus,
  FolderOpen,
  Activity,
  BarChart3,
  Headphones,
  ArrowUpRight,
} from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { currentUser } from "@/data/users";
import { chats } from "@/data/chats";
import { MessagesSquare } from "lucide-react";
import ProfileMenu from "./ProfileMenu";

/* ─── Menu definition ─── */

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  adminOnly?: boolean;
}

const coreMenu: MenuItem[] = [
  { label: "회사 상품 폴더", href: "/folders",   icon: FolderOpen },
  { label: "내 활동",         href: "/orders",    icon: Activity },
  { label: "비용인텔리전스", href: "/cost-intel", icon: BarChart3, adminOnly: true },
];

const auxMenu: MenuItem[] = [
  { label: "CS", href: "/cs", icon: Headphones },
];

function formatRelativeTime(dateStr: string) {
  const now = new Date("2026-04-10T12:00:00");
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "방금";
  if (diffH < 24) return `${diffH}시간 전`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "어제";
  if (diffD < 7) return `${diffD}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const recentChats = [...chats]
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 5)
  .map((c) => ({
    id: c.id,
    label: c.title,
    href: `/chat?id=${c.id}`,
    time: formatRelativeTime(c.updatedAt),
  }));

const isAdmin = currentUser.role === "관리자" || currentUser.role === "매니저";
const visibleCore = coreMenu.filter((m) => !m.adminOnly || isAdmin);

function isActive(href: string, pathname: string) {
  return href === "/chat" ? pathname === "/chat" : pathname.startsWith(href);
}

/* ─── Component ─── */

export default function MainSidebar() {
  const pathname = usePathname();
  const { expanded, hidden } = useSidebar();

  // Hidden mode (chat-list full view)
  if (hidden) return null;

  /* ══════════════════════════════════
     Collapsed — icon rail (56px)
     ══════════════════════════════════ */
  if (!expanded) {
    return (
      <aside
        className="flex flex-col items-center shrink-0 bg-white h-full pt-4 pb-2"
        style={{
          width: "56px",
          minWidth: "56px",
          borderRight: "1px solid rgba(0,0,0,0.05)",
          transition: "width 200ms ease, min-width 200ms ease",
        }}
      >
        {/* New chat */}
        <CollapsedIcon href="/home" icon={MessageSquarePlus} label="새 채팅" active={isActive("/home", pathname)} highlight />

        <div className="h-3" />

        {/* Core group — subtle bg */}
        <div className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-1" style={{ backgroundColor: "rgba(0,0,0,0.025)" }}>
          {visibleCore.map((item) => (
            <CollapsedIcon key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href, pathname)} />
          ))}
        </div>

        {/* Divider */}
        <div className="w-6 border-b border-[#f0f0f0] my-2" />

        {/* Aux */}
        {auxMenu.map((item) => (
          <CollapsedIcon key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href, pathname)} muted />
        ))}

        {/* Chat list shortcut */}
        <div className="mt-2">
          <CollapsedIcon href="/chat-list" icon={MessagesSquare} label="채팅 리스트" active={pathname === "/chat-list"} muted />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile */}
        <div className="pb-1">
          <ProfileMenu collapsed />
        </div>
      </aside>
    );
  }

  /* ══════════════════════════════════
     Expanded — full sidebar (240px)
     ══════════════════════════════════ */
  return (
    <aside
      className="flex flex-col shrink-0 bg-white h-full"
      style={{
        width: "240px",
        minWidth: "240px",
        borderRight: "1px solid rgba(0,0,0,0.05)",
        transition: "width 200ms ease, min-width 200ms ease",
      }}
    >
      {/* ── New chat button (border style) ── */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/home"
          className="flex items-center gap-2.5 w-full px-3.5 py-[9px] rounded-[10px] text-[14px] font-medium cursor-pointer transition-all hover:border-[#ccc] hover:bg-[#f8f8f8]"
          style={{
            letterSpacing: "0.14px",
            border: "1px solid #e5e5e5",
            color: isActive("/home", pathname) ? "#000" : "#333",
            backgroundColor: isActive("/home", pathname) ? "#f5f5f5" : "#fff",
          }}
        >
          <MessageSquarePlus size={16} strokeWidth={1.5} />
          새 채팅
        </Link>
      </div>

      {/* ── Core menu group (with background) ── */}
      <div className="px-3 pt-1 pb-1">
        <div
          className="flex flex-col gap-[2px] rounded-lg px-1 py-1"
          style={{ backgroundColor: "rgba(0,0,0,0.025)" }}
        >
          {visibleCore.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-[8px] rounded-lg text-[13.5px] cursor-pointer transition-all hover:bg-[#f5f5f5]"
                style={{
                  letterSpacing: "0.14px",
                  backgroundColor: active ? "rgba(0,0,0,0.06)" : "transparent",
                  color: active ? "#111" : "#444",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <span className="shrink-0" style={{ color: active ? "#444" : "#777" }}><Icon size={18} strokeWidth={1.5} /></span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 my-1 border-b border-[#f0f0f0]" />

      {/* ── Aux menu (CS — visually lower) ── */}
      <nav className="px-3">
        {auxMenu.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3.5 py-[8px] rounded-lg text-[13.5px] cursor-pointer transition-all hover:bg-[#f5f5f5]"
              style={{
                letterSpacing: "0.14px",
                backgroundColor: active ? "#f0f0f0" : "transparent",
                color: active ? "#111" : "#888",
                fontWeight: active ? 500 : 400,
              }}
            >
              <span className="shrink-0" style={{ color: active ? "#444" : "#aaa" }}><Icon size={18} strokeWidth={1.5} /></span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Recent chats ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-4">
        <div className="flex items-center justify-between px-3.5 mb-1.5">
          <p className="text-[11.5px] font-medium text-[#999]" style={{ letterSpacing: "0.02em" }}>
            최근 채팅
          </p>
          <Link
            href="/chat-list"
            className="group relative flex items-center justify-center w-6 h-6 rounded-[5px] cursor-pointer transition-colors hover:bg-[#f0f0f0]"
            aria-label="채팅 리스트 전체보기"
          >
            <ArrowUpRight size={14} strokeWidth={1.5} color="#aaa" className="group-hover:text-[#666]" />
            <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[11px] font-medium text-white bg-[#333] rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              전체보기
            </span>
          </Link>
        </div>
        {recentChats.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center justify-between px-3.5 py-[8px] rounded-lg text-[13px] cursor-pointer transition-colors hover:bg-[#f5f5f5]"
          >
            <span className="truncate mr-3 text-[#444]">{item.label}</span>
            <span className="shrink-0 text-[11px] text-[#bbb]">{item.time}</span>
          </Link>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 border-b border-[#f0f0f0]" />

      {/* ── Profile — bottom fixed ── */}
      <div className="px-3 py-2.5">
        <ProfileMenu collapsed={false} />
      </div>
    </aside>
  );
}

/* ─── Collapsed icon button with tooltip ─── */

function CollapsedIcon({
  href,
  icon: Icon,
  label,
  active,
  highlight,
  muted,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  active: boolean;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors"
      style={{
        backgroundColor: highlight
          ? active ? "#f0f0f0" : "transparent"
          : active ? "rgba(0,0,0,0.06)" : "transparent",
        color: muted
          ? active ? "#444" : "#aaa"
          : highlight
            ? "#333"
            : active ? "#111" : "#777",
      }}
    >
      <Icon size={18} strokeWidth={1.5} />
      <span className="absolute left-full ml-2 px-2.5 py-1 text-[11px] font-medium text-white bg-[#333] rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </Link>
  );
}
