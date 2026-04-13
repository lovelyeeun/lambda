"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type SettingsSection =
  | "personal-general"
  | "personal-plan"
  | "personal-connectors"
  | "company-info"
  | "company-info-edit"
  | "company-team"
  | "company-knowledge"
  | "company-shipping"
  | "accounting-payment"
  | "accounting-description"
  | "accounting-budget"
  | "agent-policy"
  | "approval-rules"
  | "products"
  | "apps"
  | "notifications";

interface SettingsState {
  open: boolean;
  section: SettingsSection;
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  setSection: (s: SettingsSection) => void;
}

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SettingsSection>("personal-general");

  const openSettings = useCallback((s?: SettingsSection) => {
    if (s) setSection(s);
    setOpen(true);
  }, []);

  const closeSettings = useCallback(() => setOpen(false), []);

  return (
    <SettingsContext.Provider value={{ open, section, openSettings, closeSettings, setSection }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
