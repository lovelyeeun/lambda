"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  MonitorSmartphone,
  Flower2,
  PenTool,
  Building2,
} from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import ProfileMenu from "./ProfileMenu";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: string;
}

const storeMenu: MenuItem[] = [
  { label: "소모품 스토어", href: "/store", icon: ShoppingBag },
];

const appMenu: MenuItem[] = [
  { label: "렌탈", href: "/store/rental", icon: MonitorSmartphone, badge: "앱" },
  { label: "화환", href: "/store/flowers", icon: Flower2, badge: "앱" },
  { label: "주문제작", href: "/store/custom", icon: PenTool, badge: "앱" },
  { label: "SCM", href: "/store/scm", icon: Building2, badge: "앱" },
];

function isActive(href: string, pathname: string) {
  if (href === "/store") return pathname === "/store" || pathname.startsWith("/store/prod-");
  return pathname.startsWith(href);
}

export default function StoreSidebar() {
  const pathname = usePathname();
  const { expanded } = useSidebar();

  /* ── Collapsed ── */
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
        {[...storeMenu, ...appMenu].map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: active ? "rgba(0,0,0,0.06)" : "transparent",
                color: active ? "#111" : "#777",
              }}
            >
              <Icon size={18} strokeWidth={1.5} />
              <span className="absolute left-full ml-2 px-2.5 py-1 text-[11px] font-medium text-white bg-[#333] rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="flex-1" />
        <div className="pb-1">
          <ProfileMenu collapsed />
        </div>
      </aside>
    );
  }

  /* ── Expanded ── */
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
      {/* Store menu */}
      <nav className="px-3 pt-4 pb-1">
        {storeMenu.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3.5 py-[8px] rounded-lg text-[13.5px] font-medium cursor-pointer transition-all hover:bg-[#f5f5f5]"
              style={{
                backgroundColor: active ? "#f0f0f0" : "transparent",
                color: active ? "#111" : "#333",
              }}
            >
              <span style={{ color: active ? "#444" : "#777" }}><Icon size={18} strokeWidth={1.5} /></span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-1.5 border-b border-[#f0f0f0]" />

      {/* App menu */}
      <nav className="px-3">
        <p className="px-3.5 pb-1.5 text-[11px] font-medium text-[#999]" style={{ letterSpacing: "0.02em" }}>
          앱
        </p>
        {appMenu.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3.5 py-[7px] rounded-lg text-[13px] cursor-pointer transition-all hover:bg-[#f5f5f5]"
              style={{
                backgroundColor: active ? "#f0f0f0" : "transparent",
                color: active ? "#111" : "#888",
              }}
            >
              <span style={{ color: active ? "#444" : "#aaa" }}><Icon size={16} strokeWidth={1.5} /></span>
              {item.label}
              {item.badge && (
                <span className="ml-auto text-[10px] text-[#bbb] bg-[#f5f5f5] px-1.5 py-0 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Profile */}
      <div className="mx-4 border-b border-[#f0f0f0]" />
      <div className="px-3 py-2.5">
        <ProfileMenu collapsed={false} />
      </div>
    </aside>
  );
}
