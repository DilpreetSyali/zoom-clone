"use client";

import { Phone, Search, UserPlus, Video } from "lucide-react";
import { useState } from "react";

const CONTACTS = [
  { id: 1, name: "Rahul Sharma",  initials: "RS", color: "#7C3AED", email: "rahul@example.com",  status: "online",  role: "Product Manager" },
  { id: 2, name: "Priya Mehta",   initials: "PM", color: "#DB2777", email: "priya@example.com",  status: "online",  role: "Designer" },
  { id: 3, name: "Vikram Nair",   initials: "VN", color: "#2D8CFF", email: "vikram@example.com", status: "away",    role: "Engineer" },
  { id: 4, name: "Ananya Iyer",   initials: "AI", color: "#EA580C", email: "ananya@example.com", status: "offline", role: "Marketing" },
  { id: 5, name: "Arjun Kapoor",  initials: "AK", color: "#059669", email: "arjun@example.com",  status: "online",  role: "Sales" },
  { id: 6, name: "Neha Singh",    initials: "NS", color: "#CA8A04", email: "neha@example.com",   status: "away",    role: "Finance" },
  { id: 7, name: "Dev Support",   initials: "DS", color: "#0891B2", email: "dev@example.com",    status: "online",  role: "Support" },
];

const STATUS_COLOR: Record<string, string> = {
  online: "#22C55E",
  away:   "#F59E0B",
  offline: "#9CA3AF",
};

export default function ContactsTab() {
  const [searchQ, setSearchQ] = useState("");

  const filtered = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQ.toLowerCase()),
  );

  const online  = filtered.filter((c) => c.status === "online");
  const others  = filtered.filter((c) => c.status !== "online");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Contacts</h1>
        <button
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            background: "var(--zoom-blue)", color: "#fff",
            fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
          }}
        >
          <UserPlus size={14} />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search contacts…"
          style={{
            width: "100%", padding: "10px 14px 10px 36px",
            borderRadius: 10, border: "1px solid #E5E7EB",
            fontSize: 13.5, outline: "none", background: "#fff",
          }}
        />
      </div>

      {/* Online */}
      {online.length > 0 && (
        <ContactGroup title="Online" count={online.length}>
          {online.map((c) => <ContactCard key={c.id} contact={c} />)}
        </ContactGroup>
      )}

      {/* Others */}
      {others.length > 0 && (
        <ContactGroup title="Other" count={others.length}>
          {others.map((c) => <ContactCard key={c.id} contact={c} />)}
        </ContactGroup>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
          <p style={{ fontSize: 20, marginBottom: 8 }}>🔍</p>
          <p style={{ fontSize: 13 }}>No contacts match &ldquo;{searchQ}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

function ContactGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{count}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </section>
  );
}

function ContactCard({ contact }: { contact: typeof CONTACTS[0] }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fff", borderRadius: 10, border: "1px solid var(--zoom-border-light)",
        padding: "12px 16px", gap: 12, transition: "box-shadow 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Avatar with status dot */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: contact.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
          }}>
            {contact.initials}
          </div>
          <span style={{
            position: "absolute", bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: "50%",
            background: STATUS_COLOR[contact.status],
            border: "2px solid #fff",
          }} />
        </div>

        <div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{contact.name}</p>
          <p style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>{contact.role} · {contact.email}</p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6 }}>
        {[Phone, Video].map((Icon, i) => (
          <button
            key={i}
            title={i === 0 ? "Voice call" : "Video call"}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "1px solid #E5E7EB", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--zoom-blue)",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#EBF3FF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
