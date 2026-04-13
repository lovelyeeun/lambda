"use client";

import { useEffect, useCallback, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Full-screen overlay style (for settings). Default false gives centered dialog. */
  fullscreen?: boolean;
}

export default function Modal({ open, onClose, children, fullscreen = false }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 cursor-pointer"
          onClick={onClose}
        />
        {/* Content — full overlay with slight inset */}
        <div
          className="relative m-4 flex-1 bg-white overflow-hidden"
          style={{
            borderRadius: "16px",
            boxShadow:
              "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 40px",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 cursor-pointer"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        className="relative bg-white w-full max-w-[520px] max-h-[85vh] overflow-y-auto"
        style={{
          borderRadius: "16px",
          boxShadow:
            "rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.08) 0px 8px 40px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
