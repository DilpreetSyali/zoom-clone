"use client";

import { Calendar, Clock, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Meeting } from "@/types";

export default function MeetingsTab({
  upcoming,
  recent,
  onSchedule,
}: {
  upcoming: Meeting[];
  recent: Meeting[];
  onSchedule: () => void;
}) {
  const router = useRouter();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Meetings</h1>
        <button
          onClick={onSchedule}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            background: "var(--zoom-blue)", color: "#fff",
            fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--zoom-blue-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--zoom-blue)")}
        >
          <Calendar size={14} />
          Schedule Meeting
        </button>
      </div>

      {/* Upcoming */}
      <Section title="Upcoming" icon={<Calendar size={15} />} count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty icon="📅" text="No upcoming meetings. Schedule one to get started." />
        ) : (
          upcoming.map((m) => (
            <MeetingRow
              key={m.id} meeting={m} variant="upcoming"
              action={
                <button
                  onClick={() => router.push(`/meeting/${m.meeting_code}?host=true`)}
                  style={{ padding: "6px 14px", borderRadius: 6, background: "var(--zoom-blue)", color: "#fff", fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  <Play size={11} style={{ marginRight: 4, display: "inline" }} />
                  Start
                </button>
              }
            />
          ))
        )}
      </Section>

      {/* Recent */}
      <Section title="Recent" icon={<Clock size={15} />} count={recent.length}>
        {recent.length === 0 ? (
          <Empty icon="🕐" text="No recent meetings yet." />
        ) : (
          recent.map((m) => <MeetingRow key={m.id} meeting={m} variant="recent" />)
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ color: "var(--zoom-blue)" }}>{icon}</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
        {count > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--zoom-blue)", background: "var(--zoom-blue-light)", borderRadius: 99, padding: "2px 8px" }}>
            {count}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}

function MeetingRow({ meeting, variant, action }: { meeting: Meeting; variant: "upcoming" | "recent"; action?: React.ReactNode }) {
  const dateStr = meeting.scheduled_date
    ? new Date(meeting.scheduled_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "Instant meeting";

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#fff", borderRadius: 10, border: "1px solid var(--zoom-border-light)",
      padding: "14px 16px", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: variant === "upcoming" ? "#EBF3FF" : "#F3F4F6",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Calendar size={18} style={{ color: variant === "upcoming" ? "var(--zoom-blue)" : "#9CA3AF" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {meeting.title}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: "#6B7280" }}>{dateStr}</span>
            {meeting.scheduled_time && (
              <>
                <span style={{ fontSize: 10, color: "#D1D5DB" }}>•</span>
                <span style={{ fontSize: 11.5, color: "#6B7280" }}>{meeting.scheduled_time}</span>
              </>
            )}
            <span style={{ fontSize: 10, color: "#D1D5DB" }}>•</span>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{meeting.meeting_code}</span>
          </div>
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #D1D5DB", padding: "32px 24px", textAlign: "center" }}>
      <p style={{ fontSize: 22, marginBottom: 8 }}>{icon}</p>
      <p style={{ fontSize: 13, color: "#6B7280" }}>{text}</p>
    </div>
  );
}
