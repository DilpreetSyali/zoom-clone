"use client";

import { MessageSquare, Search, Phone, Video } from "lucide-react";
import { useState } from "react";
import type { User } from "@/types";

const SAMPLE_CHATS = [
  { id: 1, name: "Rahul Sharma", initials: "RS", color: "#7C3AED", msg: "Are we still on for the 10 AM call?", time: "9:42 AM", unread: 2 },
  { id: 2, name: "Priya Mehta",  initials: "PM", color: "#DB2777", msg: "I've shared the meeting notes 📎",    time: "9:15 AM", unread: 0 },
  { id: 3, name: "Dev Team",    initials: "DT", color: "#059669", msg: "New build deployed ✅",              time: "Yesterday", unread: 0 },
  { id: 4, name: "Ananya Iyer", initials: "AI", color: "#EA580C", msg: "Thanks! Talk later.",               time: "Yesterday", unread: 0 },
  { id: 5, name: "Vikram Nair", initials: "VN", color: "#2D8CFF", msg: "Can you send the invite link?",     time: "Mon",      unread: 0 },
];

export default function ChatTab({ user }: { user: User | null }) {
  const [selected, setSelected] = useState<number | null>(1);
  const [searchQ, setSearchQ] = useState("");
  const [draft, setDraft] = useState("");

  const filtered = SAMPLE_CHATS.filter((c) =>
    c.name.toLowerCase().includes(searchQ.toLowerCase()),
  );
  const active = SAMPLE_CHATS.find((c) => c.id === selected);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 54px)", background: "#fff" }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: "1px solid var(--zoom-border-light)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--zoom-border-light)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search messages"
              style={{
                width: "100%", padding: "7px 10px 7px 30px",
                borderRadius: 8, border: "1px solid #E5E7EB",
                fontSize: 13, color: "#374151", outline: "none",
                background: "#F9FAFB",
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", border: "none", textAlign: "left", cursor: "pointer",
                background: selected === c.id ? "#EBF3FF" : "transparent",
                transition: "background 0.12s",
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: "50%", background: c.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {c.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{c.name}</p>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{c.time}</span>
                </div>
                <p style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", marginTop: 1 }}>
                  {c.msg}
                </p>
              </div>
              {c.unread > 0 && (
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--zoom-blue)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      {active ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--zoom-border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: active.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {active.initials}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{active.name}</p>
                <p style={{ fontSize: 11.5, color: "#22C55E" }}>Active now</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[Phone, Video].map((Icon, i) => (
                <button key={i} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--zoom-blue)" }}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, padding: "24px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            <Bubble from={active.name} color={active.color} initials={active.initials} text="Hey! Are we still on for the 10 AM call?" time="9:40 AM" mine={false} />
            <Bubble from={user?.name ?? "You"} color={user?.avatar_color ?? "#2D8CFF"} initials={(user?.name ?? "Y").slice(0,2).toUpperCase()} text="Yes, I'll send the invite in a minute!" time="9:41 AM" mine={true} />
            <Bubble from={active.name} color={active.color} initials={active.initials} text="Perfect, thanks 👍" time="9:42 AM" mine={false} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--zoom-border-light)", display: "flex", gap: 10 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) setDraft(""); }}
              placeholder={`Message ${active.name}…`}
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
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#9CA3AF" }}>
          <MessageSquare size={40} />
          <p style={{ fontSize: 14 }}>Select a conversation</p>
        </div>
      )}
    </div>
  );
}

function Bubble({ from, color, initials, text, time, mine }: { from: string; color: string; initials: string; text: string; time: string; mine: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
      {!mine && (
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {initials}
        </div>
      )}
      <div>
        <div style={{
          padding: "9px 14px", borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: mine ? "var(--zoom-blue)" : "#F3F4F6",
          color: mine ? "#fff" : "#111827", fontSize: 13.5, maxWidth: 380,
        }}>
          {text}
        </div>
        <p style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 3, textAlign: mine ? "right" : "left" }}>{time}</p>
      </div>
    </div>
  );
}
