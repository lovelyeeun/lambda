import AppShell from "@/components/shell/AppShell";
import MainSidebar from "@/components/shell/MainSidebar";
import RightPanel from "@/components/shell/RightPanel";
import { SidebarProvider } from "@/lib/sidebar-context";
import { RightPanelProvider } from "@/lib/right-panel-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
    <RightPanelProvider>
      <AppShell>
        {/* Left sidebar */}
        <MainSidebar />

        {/* Center content — scrollbar-gutter: stable로 스크롤바 유무에 따른 너비 shift 방지 */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
          {children}
        </main>

        {/* Right GUI panel */}
        <RightPanel />
      </AppShell>
    </RightPanelProvider>
    </SidebarProvider>
  );
}
