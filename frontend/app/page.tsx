"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/dashboard/Navbar";
import ActionButtons from "@/components/dashboard/ActionButtons";
import JoinMeetingModal from "@/components/dashboard/JoinMeetingModal";
import ScheduleMeetingModal from "@/components/dashboard/ScheduleMeetingModal";
import AuthModal from "@/components/dashboard/AuthModal";
import NewMeetingModal from "@/components/dashboard/NewMeetingModal";
import MeetingCard from "@/components/dashboard/MeetingCard";
import ChatTab from "@/components/dashboard/ChatTab";
import TeamChatTab from "@/components/dashboard/TeamChatTab";
import MeetingsTab from "@/components/dashboard/MeetingsTab";
import { api } from "@/lib/api";
import type { Meeting, User } from "@/types";

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Home");
  const [user, setUser]         = useState<User | null>(null);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent]     = useState<Meeting[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [joinOpen, setJoinOpen]         = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [u, up, rc] = await Promise.all([
        api.getCurrentUser(),
        api.getUpcomingMeetings(),
        api.getRecentMeetings(),
      ]);
      setUser(u); setUpcoming(up); setRecent(rc); setLoadError(null); setAuthOpen(false);
    } catch (err: any) {
      if (err.status === 401) {
        setAuthOpen(true);
      } else {
        setLoadError("Couldn't reach the backend. Make sure the API server is running on port 8000.");
      }
    }
  }

  function handleNewMeeting() {
    setNewMeetingOpen(true);
  }

  async function handleStartMeeting(displayName: string, muted: boolean, videoOff: boolean) {
    setCreatingMeeting(true);
    try {
      const m = await api.createInstantMeeting();
      const qs = new URLSearchParams({
        host: "true",
        name: displayName,
        ...(muted    ? { muted: "1" }    : {}),
        ...(videoOff ? { videoOff: "1" } : {}),
      });
      setNewMeetingOpen(false);
      router.push(`/meeting/${m.meeting_code}?${qs.toString()}`);
    } catch {
      setCreatingMeeting(false);
      alert("Couldn't create a meeting. Is the backend running?");
    }
  }

  const hours  = now.getHours();
  const greeting =
    hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening";

  const timeStr = mounted ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const dateStr = mounted ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--zoom-bg-light)" }}>
      <Navbar user={user} onUserUpdate={setUser} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Non-home tabs ── */}
      {activeTab === "Chat"      && <ChatTab user={user} />}
      {activeTab === "Team Chat" && <TeamChatTab />}
      {activeTab === "Meetings"  && <MeetingsTab upcoming={upcoming} recent={recent} onSchedule={() => setScheduleOpen(true)} />}

      {/* ── Home tab ── */}
      {activeTab === "Home" && (
      <>
      {/* ── Hero band ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a4a8a 0%, #2D8CFF 45%, #6BB8FF 100%)",
          padding: "40px 24px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 280, height: 280, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: "30%",
          width: 360, height: 360, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 20, left: "60%",
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          {/* Greeting + clock */}
          <div style={{ marginBottom: 28 }}>
            {user && (
              <p
                className="animate-fade-in"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.75)",
                  marginBottom: 4,
                  letterSpacing: "0.01em",
                }}
              >
                {greeting}, {user.name.split(" ")[0]} 👋
              </p>
            )}
            <p
              className="tabular-nums"
              style={{
                fontSize: 56,
                fontWeight: 200,
                color: "#fff",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              {timeStr}
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
              {dateStr}
            </p>
          </div>

          {/* Action card */}
          <div
            style={{
              background: "rgba(255,255,255,0.97)",
              borderRadius: 16,
              padding: "22px 24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            <ActionButtons
              onNewMeeting={handleNewMeeting}
              onJoin={() => setJoinOpen(true)}
              onSchedule={() => setScheduleOpen(true)}
              loading={creatingMeeting}
            />
            {creatingMeeting && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid #E5E7EB", borderTopColor: "var(--zoom-blue)",
                  animation: "spin 0.7s linear infinite",
                }} />
                <p style={{ fontSize: 13, color: "var(--zoom-text-secondary)" }}>Starting your meeting…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Error */}
        {loadError && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              borderRadius: 10, border: "1px solid #FDE68A",
              background: "#FFFBEB", padding: "12px 16px",
              marginBottom: 28, fontSize: 13, color: "#92400E",
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <span>{loadError}</span>
          </div>
        )}

        {/* Upcoming */}
        <Section title="Upcoming Meetings" count={upcoming.length}>
          {upcoming.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No upcoming meetings"
              sub="Schedule a meeting to see it here."
              action={{ label: "Schedule now", onClick: () => setScheduleOpen(true) }}
            />
          ) : (
            <List>
              {upcoming.map((m) => <MeetingCard key={m.id} meeting={m} variant="upcoming" />)}
            </List>
          )}
        </Section>

        {/* Recent */}
        <Section title="Recent Meetings" count={recent.length}>
          {recent.length === 0 ? (
            <EmptyState
              icon="🕐"
              title="No recent meetings"
              sub="Your past meetings will appear here."
            />
          ) : (
            <List>
              {recent.map((m) => <MeetingCard key={m.id} meeting={m} variant="recent" />)}
            </List>
          )}
        </Section>
      </main>
      </>
      )}  {/* end Home tab */}

      <AuthModal
        open={authOpen}
        onSuccess={(u) => {
          setUser(u);
          setAuthOpen(false);
          loadDashboard();
        }}
      />
      <NewMeetingModal
        open={newMeetingOpen}
        onClose={() => { setNewMeetingOpen(false); setCreatingMeeting(false); }}
        defaultName={user?.name ?? ""}
        onStart={handleStartMeeting}
        loading={creatingMeeting}
      />
      <JoinMeetingModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onScheduled={(m) => setUpcoming((prev) => [m, ...prev])}
      />
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
          {title}
        </h2>
        {count > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--zoom-blue)",
              background: "var(--zoom-blue-light)",
              borderRadius: 99,
              padding: "2px 8px",
            }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {children}
    </div>
  );
}

function EmptyState({
  icon, title, sub, action,
}: {
  icon: string;
  title: string;
  sub: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px dashed #D1D5DB",
        padding: "36px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg, #EBF3FF 0%, #DBEAFE 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, margin: "0 auto 12px",
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{title}</p>
      <p style={{ fontSize: 12.5, color: "#6B7280", marginTop: 3 }}>{sub}</p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 14,
            borderRadius: 8,
            background: "var(--zoom-blue)",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 600,
            padding: "7px 18px",
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--zoom-blue-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--zoom-blue)")}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
