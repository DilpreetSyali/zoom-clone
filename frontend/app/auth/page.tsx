"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Video } from "lucide-react";
import { api } from "@/lib/api";
import { ApiClientError } from "@/lib/api";
import { saveSession } from "@/lib/auth";

type Mode = "login" | "register";

export default function AuthPage() {
  const router  = useRouter();
  const [mode, setMode]       = useState<Mode>("login");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register" && name.trim().length < 2) {
      setError("Enter your full name (at least 2 characters)."); return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }

    setLoading(true);
    try {
      const res = mode === "register"
        ? await api.register(name.trim(), email.trim().toLowerCase(), password)
        : await api.login(email.trim().toLowerCase(), password);

      saveSession(res.token, res.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #0f2a5c 0%, #1a4a8a 40%, #2D8CFF 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background blobs */}
      {[
        { top: -100, right: -100, size: 400, opacity: 0.08 },
        { bottom: -150, left: -80,  size: 500, opacity: 0.06 },
        { top: "30%", left: "55%", size: 250, opacity: 0.07 },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            borderRadius: "50%",
            background: "#fff",
            opacity: b.opacity,
            width: b.size,
            height: b.size,
            top: b.top,
            bottom: (b as { bottom?: number }).bottom,
            left: b.left,
            right: (b as { right?: number }).right,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Left panel — branding (hidden on small screens) */}
      <div
        className="hidden lg:flex"
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div
            style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.20)",
            }}
          >
            <Video size={22} color="#2D8CFF" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            zoom
          </span>
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.02em" }}>
          Connect, collaborate,<br />and celebrate.
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, maxWidth: 380 }}>
          From one-on-one calls to company all-hands, Zoom brings your team together from anywhere.
        </p>

        {/* Feature list */}
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: "🎥", text: "HD video & audio quality" },
            { icon: "💬", text: "In-meeting chat & reactions" },
            { icon: "🖥️", text: "Screen sharing & recording" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {icon}
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "40px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "40px 36px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          }}
        >
          {/* Logo for mobile */}
          <div
            className="flex lg:hidden"
            style={{ alignItems: "center", gap: 8, marginBottom: 28 }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--zoom-blue)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Video size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
              zoom
            </span>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4, letterSpacing: "-0.02em" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
            {mode === "login"
              ? "Sign in to your Zoom account"
              : "Join millions of people using Zoom"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <FormField label="Full name">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="Alex Morgan"
                  className="zoom-input"
                />
              </FormField>
            )}

            <FormField label="Email address">
              <input
                autoFocus={mode === "login"}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@example.com"
                className="zoom-input"
              />
            </FormField>

            <FormField label="Password">
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                  className="zoom-input"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#9CA3AF", padding: 0, display: "flex",
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                borderRadius: 10,
                background: loading ? "#93C5FD" : "var(--zoom-blue)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                padding: "12px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s, box-shadow 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "var(--zoom-blue-hover)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(45,140,255,0.40)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--zoom-blue)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {loading && (
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.35)",
                  borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite",
                  flexShrink: 0,
                }} />
              )}
              {loading
                ? (mode === "login" ? "Signing in…" : "Creating account…")
                : (mode === "login" ? "Sign in" : "Create account")}
            </button>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </form>

          {/* Toggle */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #F3F4F6",
              textAlign: "center",
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--zoom-blue)", fontWeight: 700, fontSize: 14,
              }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
