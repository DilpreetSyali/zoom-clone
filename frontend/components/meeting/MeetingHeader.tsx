"use client";

import { Check, Copy, Pencil, Shield } from "lucide-react";
import { useState } from "react";
import { formatElapsed } from "@/lib/utils";
import type { Meeting } from "@/types";

interface Props {
  meeting: Meeting;
  elapsedSeconds: number;
  localName: string;
  onRename: (newName: string) => void;
}

export default function MeetingHeader({ meeting, elapsedSeconds, localName, onRename }: Props) {
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");

  function copyId() {
    navigator.clipboard.writeText(meeting.meeting_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function openRename() {
    setDraft(localName);
    setRenaming(true);
  }

  function confirmRename() {
    if (draft.trim()) onRename(draft.trim());
    setRenaming(false);
  }

  return (
    <>
      <div
        className="flex items-center justify-between"
        style={{
          borderRadius: 10,
          padding: "8px 14px",
          background: "var(--zoom-meeting-header-bg)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* Left — title + meeting ID */}
        <div className="flex min-w-0 items-center" style={{ gap: 10 }}>
          <div
            className="flex shrink-0 items-center justify-center rounded-lg font-bold text-white"
            style={{
              width: 26,
              height: 26,
              background: "var(--zoom-blue)",
              fontSize: 11,
            }}
          >
            Z
          </div>
          <div className="min-w-0">
            <p
              className="truncate"
              style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}
            >
              {meeting.title}
            </p>
            <button
              onClick={copyId}
              className="flex items-center gap-1 transition-colors hover:text-gray-200"
              style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Shield size={10} />
              <span>ID: {meeting.meeting_code}</span>
              {copied ? (
                <Check size={10} style={{ color: "var(--zoom-green-active)" }} />
              ) : (
                <Copy size={10} />
              )}
            </button>
          </div>
        </div>

        {/* Centre — Your name with rename button */}
        <div
          className="flex items-center"
          style={{ gap: 6 }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>You:</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
            {localName || "Unnamed"}
          </span>
          <button
            onClick={openRename}
            title="Rename yourself"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
              border: "none", cursor: "pointer", color: "rgba(255,255,255,0.55)",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.20)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.10)";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            }}
          >
            <Pencil size={11} />
          </button>
        </div>

        {/* Right — live timer */}
        <div
          className="flex shrink-0 items-center"
          style={{
            gap: 6,
            background: "rgba(255,255,255,0.10)",
            borderRadius: 99,
            padding: "4px 10px",
          }}
        >
          <span
            className="live-dot"
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--zoom-green-active)",
            }}
          />
          <span
            className="tabular-nums"
            style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}
          >
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Rename modal — dark themed inline (no shared Modal component to keep in meeting style) */}
      {renaming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.60)" }}
          onClick={() => setRenaming(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 360,
              background: "#1E1F23",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.60)",
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
              Change Your Name
            </p>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              placeholder="Enter your display name"
              style={{
                width: "100%",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                padding: "10px 12px",
                fontSize: 14,
                color: "#fff",
                outline: "none",
                fontFamily: "inherit",
                marginBottom: 16,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--zoom-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setRenaming(false)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent", color: "rgba(255,255,255,0.75)",
                  fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                disabled={!draft.trim()}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8,
                  border: "none",
                  background: draft.trim() ? "var(--zoom-blue)" : "rgba(45,140,255,0.35)",
                  color: "#fff",
                  fontSize: 13.5, fontWeight: 600,
                  cursor: draft.trim() ? "pointer" : "not-allowed",
                }}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
