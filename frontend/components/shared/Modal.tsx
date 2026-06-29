"use client";

import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number; // px value, e.g. 440
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 440,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    /* Backdrop — 40% black opacity, fade in */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in-fast"
      style={{ backgroundColor: "rgba(0,0,0,0.40)" }}
      onClick={onClose}
    >
      {/* Card — white, 12px radius, heavier shadow */}
      <div
        className="w-full bg-white animate-slide-up"
        style={{
          maxWidth,
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — 20px padding, 1px bottom border */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--zoom-border-light)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--zoom-text-primary)",
            }}
          >
            {title}
          </h2>
          {/* X button — 18px icon, secondary color */}
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            style={{ width: 28, height: 28, color: "var(--zoom-text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — 20px padding */}
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
