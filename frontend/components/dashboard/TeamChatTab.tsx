"use client";

import { Hash, Plus, Search, Users } from "lucide-react";
import { useState } from "react";

const CHANNELS = [
  { id: 1, name: "general",     unread: 3, desc: "Company-wide announcements" },
  { id: 2, name: "engineering", unread: 0, desc: "Tech discussions and updates" },
  { id: 3, name: "design",      unread: 1, desc: "Design reviews and feedback" },
  { id: 4, name: "marketing",   unread: 0, desc: "Campaigns and GTM strategy" },
  { id: 5, name: "random",      unread: 7, desc: "Off-topic conversations" },
];

const MESSAGES: Record<number, Array<{ from: string; text: string; time: string; initials: string; color: string }>> = {
  1: [
    { from: "Rahul Sharma",  initials: "RS", color: "#7C3AED", text: "Good morning everyone! 👋 Team standup at 10 AM.", time: "9:01 AM" },
    { from: "Priya Mehta",   initials: "PM", color: "#DB2777", text: "On it! I'll share the deck before then.",               time: "9:04 AM" },
    { from: "Vikram Nair",   initials: "VN", color: "#2D8CFF", text: "Sounds good. Meeting link sent.",                       time: "9:07 AM" },
  ],
  5: [
    { from: "Ananya Iyer",  initials: "AI", color: "#EA580C", text: "Anyone tried the new coffee machine? ☕",        time: "8:45 AM" },
    { from: "Arjun Kapoor", initials: "AK", color: "#059669", text: "Yes! It's amazing, highly recommend the latte.", time: "8:47 AM" },
    { from: "Neha Singh",   initials: "NS", color: "#CA8A04", text: "Will try it after standup 😄",                  time: "8:50 AM" },
  ],
};

export default function TeamChatTab() {
  const [selected, setSelected] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [draft, setDraft] = useState("");

  const filtered = CHANNELS.filter((c) => c.name.includes(searchQ.toLowerCase()));
  const msgs = MESSAGES[selected] ?? [];

  return (
    <div style={{ display: "flex", height: "calc(100vh - 54px)", background: "#fff" }}>
      {/* Channel sidebar */}
      <div style={{ width: 240, borderRight: "1px solid var(--zoom-border-light)", display: "flex", flexDirection: "column", background: "#FAFAFA", flexShrink: 0 }}>
        <div style={{ padding: "14px 14px 8px", borderBottom: "1px solid var(--zoom-border-light)" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Team Chat</p>
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search channels"
              style={{ width: "100%", padding: "6px 8px 6px 24px", borderRadius: 6, border: "1px solid #E5E7EB", fontSize: 12.5, outline: "none", background: "#fff" }}
            />
          </div>
        </div>

        {/* Channels */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          <div style={{ padding: "4px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Channels</p>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><Plus size={14} /></button>
          </div>
          {filtered.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelected(ch.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 14px", border: "none", textAlign: "left", cursor: "pointer",
                background: selected === ch.id ? "#EBF3FF" : "transparent",
                borderRadius: 0,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: selected === ch.id ? 600 : 400, color: selected === ch.id ? "var(--zoom-blue)" : "#374151" }}>
                <Hash size={13} /> {ch.name}
              </span>
              {ch.unread > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "var(--zoom-blue)", color: "#fff", borderRadius: 99, padding: "1px 6px" }}>
                  {ch.unread}
                </span>
              )}
            </button>
          ))}

          {/* Members */}
          <div style={{ padding: "12px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Members</p>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}><Users size={13} /></button>
          </div>
          {["Rahul", "Priya", "Vikram", "Ananya"].map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: i < 2 ? "#22C55E" : "#9CA3AF", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "#374151" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--zoom-border-light)", display: "flex", alignItems: "center", gap: 8 }}>
          <Hash size={15} style={{ color: "#6B7280" }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            {CHANNELS.find((c) => c.id === selected)?.name}
          </p>
          <p style={{ fontSize: 12.5, color: "#9CA3AF" }}>
            — {CHANNELS.find((c) => c.id === selected)?.desc}
          </p>
        </div>

        <div style={{ flex: 1, padding: "20px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {msgs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
              <Hash size={32} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13 }}>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 2 }}>
                  {m.initials}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{m.from}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.time}</p>
                  </div>
                  <p style={{ fontSize: 13.5, color: "#374151", marginTop: 2 }}>{m.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--zoom-border-light)", display: "flex", gap: 10 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) setDraft(""); }}
            placeholder={`Message #${CHANNELS.find((c) => c.id === selected)?.name}…`}
            style={{ flex: 1, padding: "9px 14px", borderRadius: 99, border: "1px solid #E5E7EB", fontSize: 13.5, outline: "none", background: "#F9FAFB" }}
          />
          <button
            onClick={() => setDraft("")}
            style={{ padding: "9px 18px", borderRadius: 99, background: "var(--zoom-blue)", color: "#fff", fontSize: 13.5, fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
