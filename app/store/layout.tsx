import AppShell from "@/components/shell/AppShell";
import StoreSidebar from "@/components/shell/StoreSidebar";
import RightPanel from "@/components/shell/RightPanel";
import { SidebarProvider } from "@/lib/sidebar-context";
import { RightPanelProvider } from "@/lib/right-panel-context";
import { PinProvider } from "@/lib/pin-context";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
    <RightPanelProvider>
    <PinProvider>
      <AppShell>
        <StoreSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
        <RightPanel />
      </AppShell>
    </PinProvider>
    </RightPanelProvider>
    </SidebarProvider>
  );
}
