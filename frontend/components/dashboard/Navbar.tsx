"use client";

import { ChevronDown, Settings, X, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { api } from "@/lib/api";
import type { User } from "@/types";

const NAV_TABS = ["Home", "Chat", "Team Chat", "Meetings"] as const;

type OpenModal = null | "profile" | "settings" | "shortcuts" | "help";

export default function Navbar({
  user,
  onUserUpdate,
  activeTab = "Home",
  onTabChange,
}: {
  user: User | null;
  onUserUpdate?: (u: User) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [openModal, setOpenModal]   = useState<OpenModal>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function openItem(modal: OpenModal) {
    setProfileOpen(false);
    setOpenModal(modal);
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 bg-white"
        style={{
          height: 54,
          borderBottom: "1px solid var(--zoom-border-light)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        }}
      >
        {/* Left */}
        <div className="flex items-center" style={{ gap: 32 }}>
          {/* Logo */}
          <a href="/" className="flex shrink-0 items-center" style={{ gap: 8 }}>
            <div
              className="flex items-center justify-center rounded-lg font-black text-white"
              style={{
                width: 28, height: 28,
                background: "linear-gradient(135deg, #2D8CFF 0%, #1A73E8 100%)",
                fontSize: 13,
                boxShadow: "0 2px 6px rgba(45,140,255,0.40)",
              }}
            >
              Z
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
              zoom
            </span>
          </a>

          {/* Tabs */}
          <nav className="hidden md:flex items-center">
            {NAV_TABS.map((tab) => {
              const active = tab === activeTab;
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange?.(tab)}
                  className="relative"
                  style={{
                    padding: "0 14px",
                    height: 54,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--zoom-blue)" : "var(--zoom-text-secondary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = "var(--zoom-text-secondary)";
                  }}
                >
                  {tab}
                  {active && (
                    <span
                      className="absolute bottom-0 left-2 right-2"
                      style={{
                        height: 2.5,
                        background: "var(--zoom-blue)",
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center" style={{ gap: 6 }}>
          <button
            aria-label="Settings"
            onClick={() => openItem("settings")}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{
              width: 34, height: 34,
              color: "var(--zoom-text-secondary)",
              border: "none",
              background: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <Settings size={17} />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center"
              style={{
                gap: 5,
                padding: "4px 6px 4px 4px",
                borderRadius: 99,
                border: "none",
                background: profileOpen ? "#F3F4F6" : "none",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
              onMouseLeave={(e) => {
                if (!profileOpen) e.currentTarget.style.background = "none";
              }}
            >
              <Avatar name={user?.name ?? "?"} color={user?.avatar_color} size={30} />
              <ChevronDown
                size={12}
                style={{
                  color: "#9CA3AF",
                  transform: profileOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.18s",
                }}
              />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 bg-white animate-fade-in"
                style={{
                  top: "calc(100% + 8px)",
                  width: 248,
                  borderRadius: 14,
                  border: "1px solid var(--zoom-border-light)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "linear-gradient(135deg, #EBF3FF 0%, #F0F4FF 100%)",
                    borderBottom: "1px solid var(--zoom-border-light)",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Avatar name={user?.name ?? "?"} color={user?.avatar_color} size={40} />
                    <span
                      style={{
                        position: "absolute",
                        bottom: 1,
                        right: 1,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#059669",
                        border: "2px solid #fff",
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }} className="truncate">
                      {user?.name ?? "Guest"}
                    </p>
                    <p style={{ fontSize: 11.5, color: "#6B7280", marginTop: 1 }} className="truncate">
                      {user?.email ?? ""}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: "6px 0" }}>
                  {([
                    { label: "My Profile",           icon: "👤", modal: "profile" as OpenModal },
                    { label: "Settings",              icon: "⚙️", modal: "settings" as OpenModal },
                    { label: "Keyboard Shortcuts",    icon: "⌨️", modal: "shortcuts" as OpenModal },
                    { label: "Help & Support",        icon: "💬", modal: "help" as OpenModal },
                  ]).map(({ label, icon, modal }) => (
                    <button
                      key={label}
                      onClick={() => openItem(modal)}
                      className="w-full text-left"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 16px",
                        fontSize: 13.5,
                        color: "#111827",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid var(--zoom-border-light)", padding: "6px 0" }}>
                  <button
                    onClick={() => {
                      import("@/lib/auth").then(({ clearSession }) => {
                        clearSession();
                        window.location.reload();
                      });
                    }}
                    className="w-full text-left"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 16px",
                      fontSize: 13.5,
                      color: "var(--zoom-red-danger)",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>🚪</span>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Modals ── */}
      <ProfileModal
        open={openModal === "profile"}
        onClose={() => setOpenModal(null)}
        user={user}
        onSaved={(u) => { onUserUpdate?.(u); setOpenModal(null); }}
      />
      <SettingsModal
        open={openModal === "settings"}
        onClose={() => setOpenModal(null)}
      />
      <ShortcutsModal
        open={openModal === "shortcuts"}
        onClose={() => setOpenModal(null)}
      />
      <HelpModal
        open={openModal === "help"}
        onClose={() => setOpenModal(null)}
      />
    </>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   My Profile Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfileModal({
  open, onClose, user, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: (u: User) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Sync fields when user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!open) { setSuccess(false); setError(""); }
  }, [open]);

  async function handleSave() {
    setSaving(true); setError(""); setSuccess(false);
    try {
      const updated = await api.updateProfile({ name: name.trim(), email: email.trim() });
      // Update local storage user too
      import("@/lib/auth").then(({ saveSession, getToken }) => {
        const tok = getToken();
        if (tok) saveSession(tok, updated);
      });
      onSaved(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const COLORS = [
    "#2D8CFF", "#059669", "#7C3AED", "#DB2777",
    "#EA580C", "#CA8A04", "#0891B2", "#4F46E5",
  ];

  return (
    <Modal open={open} onClose={onClose} title="My Profile" maxWidth={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Avatar preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar name={name || "?"} color={user?.avatar_color} size={64} />
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{name || "Your Name"}</p>
            <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{email || "your@email.com"}</p>
          </div>
        </div>

        {/* Avatar color picker */}
        <div>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#6B7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Avatar Color
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={async () => {
                  try {
                    const updated = await api.updateProfile({ avatar_color: c });
                    import("@/lib/auth").then(({ saveSession, getToken }) => {
                      const tok = getToken();
                      if (tok) saveSession(tok, updated);
                    });
                    onSaved(updated);
                  } catch { /* skip */ }
                }}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: c, border: user?.avatar_color === c ? "2.5px solid #111827" : "2px solid transparent",
                  cursor: "pointer", transition: "transform 0.12s, border 0.12s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {user?.avatar_color === c && <Check size={14} color="#fff" />}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Field label="Full Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="zoom-input"
            style={{ width: "100%" }}
          />
        </Field>

        {/* Email */}
        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="zoom-input"
            style={{ width: "100%" }}
          />
        </Field>

        {error && <p style={{ fontSize: 13, color: "var(--zoom-red-danger)" }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="zoom-btn-primary"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {success ? <><Check size={15} /> Saved!</> : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   Settings Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifs, setNotifs] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="Settings" maxWidth={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <SettingRow
          label="Desktop Notifications"
          description="Get notified when a meeting starts"
          checked={notifs}
          onChange={setNotifs}
        />
        <SettingRow
          label="Sound Effects"
          description="Play sounds for join/leave events"
          checked={sound}
          onChange={setSound}
        />
        <SettingRow
          label="Dark Mode"
          description="Use dark theme for the dashboard"
          checked={darkMode}
          onChange={setDarkMode}
        />

        <div style={{ borderTop: "1px solid var(--zoom-border-light)", marginTop: 12, paddingTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            About
          </p>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Zoom Clone v1.0.0</p>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Built with Next.js, FastAPI & PostgreSQL</p>
        </div>
      </div>
    </Modal>
  );
}

function SettingRow({
  label, description, checked, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 4px", borderBottom: "1px solid #F3F4F6",
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{label}</p>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 42, height: 24, borderRadius: 99, border: "none",
          background: checked ? "var(--zoom-blue)" : "#D1D5DB",
          cursor: "pointer", position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute",
          top: 2, left: checked ? 20 : 2,
          width: 20, height: 20,
          borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   Keyboard Shortcuts Modal
   ═══════════════════════════════════════════════════════════════════════════ */
const SHORTCUTS = [
  { keys: ["Alt", "A"], action: "Mute / Unmute audio" },
  { keys: ["Alt", "V"], action: "Start / Stop video" },
  { keys: ["Alt", "S"], action: "Share screen" },
  { keys: ["Alt", "H"], action: "Show / Hide chat" },
  { keys: ["Alt", "U"], action: "Show / Hide participants" },
  { keys: ["Alt", "F"], action: "Enter / Exit full screen" },
  { keys: ["Alt", "R"], action: "Start / Stop recording" },
  { keys: ["Alt", "Q"], action: "Leave meeting" },
  { keys: ["Ctrl", "Shift", "M"], action: "Mute all participants (host)" },
];

function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" maxWidth={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {SHORTCUTS.map(({ keys, action }) => (
          <div
            key={action}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 4px",
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <span style={{ fontSize: 13.5, color: "#374151" }}>{action}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {keys.map((k) => (
                <kbd
                  key={k}
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    color: "#374151",
                    background: "#F3F4F6",
                    border: "1px solid #D1D5DB",
                    borderRadius: 5,
                    boxShadow: "0 1px 0 #D1D5DB",
                    lineHeight: 1.3,
                  }}
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   Help & Support Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const supportEmail = "support@zoomclone.dev";

  function copyEmail() {
    navigator.clipboard.writeText(supportEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Help & Support" maxWidth={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* FAQ */}
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
            Frequently Asked
          </p>
          {[
            { q: "How do I start a meeting?", a: "Click \"New Meeting\" on the dashboard to start an instant meeting." },
            { q: "How do I invite others?", a: "Share the meeting link or code from the meeting room header." },
            { q: "Can I record meetings?", a: "Yes — click the Record button in the control bar during a meeting." },
            { q: "Why is my camera not working?", a: "Check your browser permissions. Click the camera icon in the address bar." },
          ].map(({ q, a }) => (
            <details
              key={q}
              style={{
                borderBottom: "1px solid #F3F4F6",
                padding: "10px 0",
              }}
            >
              <summary style={{ fontSize: 13.5, fontWeight: 500, color: "#111827", cursor: "pointer" }}>
                {q}
              </summary>
              <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6, paddingLeft: 4 }}>
                {a}
              </p>
            </details>
          ))}
        </div>

        {/* Contact */}
        <div
          style={{
            background: "linear-gradient(135deg, #EBF3FF 0%, #F0F4FF 100%)",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 4 }}>
            Need more help?
          </p>
          <p style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 10 }}>
            Contact our support team for assistance.
          </p>
          <button
            onClick={copyEmail}
            className="flex items-center gap-2"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--zoom-blue)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : supportEmail}
          </button>
        </div>
      </div>
    </Modal>
  );
}


/* ── Shared ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block", marginBottom: 6,
        fontSize: 12.5, fontWeight: 600, color: "#6B7280",
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
