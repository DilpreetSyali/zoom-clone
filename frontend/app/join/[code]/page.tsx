"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useLocalMedia } from "@/lib/useLocalMedia";
import { api, ApiClientError } from "@/lib/api";
import type { Meeting } from "@/types";

export default function JoinLobbyPage() {
  const params       = useParams<{ code: string }>();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const code         = decodeURIComponent(params.code);

  const [displayName, setDisplayName] = useState(searchParams.get("name") ?? "");
  const [meeting, setMeeting]         = useState<Meeting | null>(null);
  const [checkError, setCheckError]   = useState<string | null>(null);
  const [checking, setChecking]       = useState(true);
  const [joining, setJoining]         = useState(false);
  const [joinError, setJoinError]     = useState<string | null>(null);

  const {
    videoRef, isMuted, isVideoOn, permissionError, ready, toggleMute, toggleVideo,
  } = useLocalMedia();

  useEffect(() => {
    api
      .getMeeting(code)
      .then(setMeeting)
      .catch((err) =>
        setCheckError(
          err instanceof ApiClientError ? err.message : "Couldn't find this meeting.",
        ),
      )
      .finally(() => setChecking(false));
  }, [code]);

  async function handleJoin() {
    const name = displayName.trim();
    if (!name) { setJoinError("Enter your name to join."); return; }
    setJoining(true); setJoinError(null);
    try {
      const res = await api.joinMeeting(code, {
        display_name: name,
        is_muted:    isMuted,
        is_video_on: isVideoOn,
      });
      const qs = new URLSearchParams({
        pid: String(res.participant_id),
        name,
        ...(isMuted    ? { muted: "1" }    : {}),
        ...(!isVideoOn ? { videoOff: "1" } : {}),
      });
      router.push(`/meeting/${encodeURIComponent(code)}?${qs.toString()}`);
    } catch (err) {
      setJoinError(
        err instanceof ApiClientError ? err.message : "Couldn't join. Please try again.",
      );
      setJoining(false);
    }
  }

  if (checking) {
    return (
      <Shell>
        <div className="flex h-64 items-center justify-center" style={{ gap: 10 }}>
          <Spinner />
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
            Checking meeting…
          </p>
        </div>
      </Shell>
    );
  }

  if (checkError) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: "rgba(224,40,40,0.15)" }}
          >
            <AlertCircle size={26} style={{ color: "#F87171" }} />
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
              Meeting not found
            </p>
            <p style={{ marginTop: 4, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
              {checkError}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{
              borderRadius: 8,
              background: "var(--zoom-blue)",
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--zoom-blue-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--zoom-blue)")}
          >
            Back to home
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          borderRadius: 16,
          background: "#111214",
          padding: 28,
          boxShadow: "0 20px 48px rgba(0,0,0,0.55)",
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
            {meeting?.title ?? "Join Meeting"}
          </h1>
          <p style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.40)" }}>
            Meeting ID:{" "}
            <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{code}</span>
          </p>
        </div>

        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: "1.4fr 1fr" }}
        >
          {/* ── Camera preview ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: "16/9",
                borderRadius: 12,
                background: "var(--zoom-meeting-tile-bg)",
              }}
            >
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div
                    className="flex items-center justify-center rounded-full font-bold text-white"
                    style={{
                      width: 72,
                      height: 72,
                      background: "var(--zoom-blue)",
                      fontSize: 20,
                    }}
                  >
                    {displayName.trim().slice(0, 2).toUpperCase() || "?"}
                  </div>
                </div>
              )}

              {/* Toggle buttons overlaid at bottom */}
              <div
                className="absolute inset-x-0 bottom-0 flex justify-center"
                style={{ gap: 10, paddingBottom: 14 }}
              >
                <ToggleBtn
                  active={!isMuted}
                  onClick={toggleMute}
                  label={isMuted ? "Unmute" : "Mute"}
                  icon={isMuted ? <MicOff size={17} /> : <Mic size={17} />}
                />
                <ToggleBtn
                  active={isVideoOn}
                  onClick={toggleVideo}
                  label={isVideoOn ? "Stop video" : "Start video"}
                  icon={isVideoOn ? <Video size={17} /> : <VideoOff size={17} />}
                />
              </div>

              {!ready && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.60)", gap: 8 }}
                >
                  <Spinner />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                    Starting camera…
                  </span>
                </div>
              )}
            </div>

            {/* Status pills */}
            <div style={{ display: "flex", gap: 8 }}>
              <StatusPill
                active={!isMuted}
                activeLabel="Mic on"
                inactiveLabel="Mic off"
                icon={isMuted ? <MicOff size={12} /> : <Mic size={12} />}
              />
              <StatusPill
                active={isVideoOn}
                activeLabel="Camera on"
                inactiveLabel="Camera off"
                icon={isVideoOn ? <Video size={12} /> : <VideoOff size={12} />}
              />
            </div>
          </div>

          {/* ── Join form ── */}
          <div
            className="flex flex-col justify-center"
            style={{ gap: 16 }}
          >
            {permissionError && (
              <div
                className="flex items-start gap-2"
                style={{
                  borderRadius: 8,
                  background: "rgba(245,166,35,0.12)",
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: "#FBBF24",
                }}
              >
                <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                {permissionError}
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.70)",
                }}
              >
                Your name
              </label>
              <input
                autoFocus
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setJoinError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter your display name"
                style={{
                  width: "100%",
                  borderRadius: 8,
                  border: joinError
                    ? "1px solid var(--zoom-red-danger)"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.07)",
                  padding: "10px 12px",
                  fontSize: 14,
                  color: "#fff",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.12s",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--zoom-blue)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = joinError
                    ? "var(--zoom-red-danger)"
                    : "rgba(255,255,255,0.12)")
                }
              />
              {joinError && (
                <p style={{ marginTop: 4, fontSize: 13, color: "var(--zoom-red-danger)" }}>
                  {joinError}
                </p>
              )}
            </div>

            <button
              onClick={handleJoin}
              disabled={joining || !displayName.trim()}
              style={{
                width: "100%",
                borderRadius: 8,
                background: "var(--zoom-blue)",
                padding: "10px 0",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                border: "none",
                cursor: joining || !displayName.trim() ? "not-allowed" : "pointer",
                opacity: joining || !displayName.trim() ? 0.55 : 1,
                transition: "background 0.12s, opacity 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!joining && displayName.trim())
                  e.currentTarget.style.background = "var(--zoom-blue-hover)";
              }}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--zoom-blue)")
              }
            >
              {joining ? "Joining…" : "Join Now"}
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
              By joining you agree to Zoom&apos;s terms of service.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--zoom-meeting-bg)" }}
    >
      {children}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center justify-center rounded-full"
      style={{
        width: 40,
        height: 40,
        background: active ? "rgba(255,255,255,0.20)" : "var(--zoom-red-danger)",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.80";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      {icon}
    </button>
  );
}

function StatusPill({
  active,
  activeLabel,
  inactiveLabel,
  icon,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  icon: React.ReactNode;
}) {
  return (
    <span
      className="flex items-center"
      style={{
        gap: 5,
        borderRadius: 99,
        padding: "4px 10px",
        fontSize: 11.5,
        fontWeight: 500,
        background: active ? "rgba(0,168,107,0.15)" : "rgba(224,40,40,0.15)",
        color: active ? "#34D399" : "#F87171",
      }}
    >
      {icon}
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function Spinner() {
  return (
    <>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.15)",
          borderTopColor: "#fff",
          animation: "spin 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
