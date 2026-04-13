import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider } from "@/lib/settings-context";
import { SettingsStoreProvider } from "@/lib/settings-store";
import { AgentPolicyProvider } from "@/lib/agent-policy-context";
import SettingsOverlay from "@/components/settings/SettingsOverlay";

export const metadata: Metadata = {
  title: "Cockpit — 구매대행 AI 에이전트",
  description: "기업 구매대행 AI 에이전트 cockpit 프로토타입",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <AgentPolicyProvider>
        <SettingsStoreProvider>
        <SettingsProvider>
          {children}
          <SettingsOverlay />
        </SettingsProvider>
        </SettingsStoreProvider>
        </AgentPolicyProvider>
      </body>
    </html>
  );
}
