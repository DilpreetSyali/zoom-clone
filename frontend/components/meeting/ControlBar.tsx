"use client";

import {
  ChevronDown,
  Mic,
  MicOff,
  MessageSquare,
  Monitor,
  MonitorOff,
  MoreHorizontal,
  PhoneOff,
  Radio,
  SmilePlus,
  Users,
  Video,
  VideoOff,
  Circle,
  Square,
  Download,
  Lock,
  Hand,
  Subtitles,
  Settings,
  Info,
  Copy,
  StopCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Emoji set for reactions ────────────────────────────────────────────────
const REACTIONS = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "👏", label: "Clap" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "😂", label: "Haha" },
  { emoji: "😮", label: "Wow" },
  { emoji: "🎉", label: "Party" },
  { emoji: "🙏", label: "Thank you" },
  { emoji: "✋", label: "Raise hand" },
];

// ─── More menu items ─────────────────────────────────────────────────────────
const MORE_ITEMS = [
  { icon: <Lock size={15} />,     label: "Lock Meeting" },
  { icon: <Hand size={15} />,     label: "Lower All Hands" },
  { icon: <Subtitles size={15} />,label: "Enable Captions" },
  { icon: <Settings size={15} />, label: "Meeting Settings" },
  { icon: <Info size={15} />,     label: "Meeting Info" },
  { icon: <Copy size={15} />,     label: "Copy Invite Link" },
];

// ─── Types ───────────────────────────────────────────────────────────────────
export interface FloatingReaction {
  id: string;
  emoji: string;
  x: number; // percent 10–90
}

interface ControlBarProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecord: () => void;
  onReaction: (reaction: FloatingReaction) => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
  participantCount: number;
  unreadCount?: number;
  panelOpen?: "none" | "participants" | "chat";
  meetingCode?: string;
  recordingSeconds?: number;
}

export default function ControlBar({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isRecording,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecord,
  onReaction,
  onToggleParticipants,
  onToggleChat,
  onLeave,
  participantCount,
  unreadCount = 0,
  panelOpen = "none",
  meetingCode = "",
  recordingSeconds = 0,
}: ControlBarProps) {
  const [openMenu, setOpenMenu] = useState<"reactions" | "more" | "mic" | "video" | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Close any open menu when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleMenu(menu: typeof openMenu) {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  }

  function fireReaction(emoji: string, label: string) {
    const reaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: 10 + Math.random() * 80,
    };
    onReaction(reaction);
    setOpenMenu(null);
  }

  function copyInviteLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/join/${meetingCode}`).catch(() => {});
    setOpenMenu(null);
  }

  const recMin = String(Math.floor(recordingSeconds / 60)).padStart(2, "0");
  const recSec = String(recordingSeconds % 60).padStart(2, "0");

  return (
    <div ref={barRef} className="relative flex items-end justify-center">
      {/* ── Popover menus (rendered above the bar) ── */}

      {/* Mic device picker */}
      {openMenu === "mic" && (
        <Popover onClose={() => setOpenMenu(null)} alignRight={false} offsetLeft={0}>
          <PopoverTitle>Select a Microphone</PopoverTitle>
          <PopoverItem active>Default — System Microphone</PopoverItem>
          <PopoverItem>Built-in Microphone</PopoverItem>
          <PopoverDivider />
          <PopoverTitle>Select a Speaker</PopoverTitle>
          <PopoverItem active>Default — System Speaker</PopoverItem>
          <PopoverItem>Built-in Speaker</PopoverItem>
          <PopoverDivider />
          <PopoverItem icon={<Settings size={13} />}>Audio Settings…</PopoverItem>
        </Popover>
      )}

      {/* Video device picker */}
      {openMenu === "video" && (
        <Popover onClose={() => setOpenMenu(null)} alignRight={false} offsetLeft={56}>
          <PopoverTitle>Select a Camera</PopoverTitle>
          <PopoverItem active>Default — FaceTime HD Camera</PopoverItem>
          <PopoverItem>External USB Camera</PopoverItem>
          <PopoverDivider />
          <PopoverItem icon={<Settings size={13} />}>Video Settings…</PopoverItem>
        </Popover>
      )}

      {/* Reactions picker */}
      {openMenu === "reactions" && (
        <Popover onClose={() => setOpenMenu(null)} alignRight={false} offsetLeft={-40}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 4,
              padding: "4px 2px",
            }}
          >
            {REACTIONS.map((r) => (
              <button
                key={r.label}
                onClick={() => fireReaction(r.emoji, r.label)}
                title={r.label}
                style={{
                  fontSize: 24,
                  padding: "6px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "background 0.10s",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </Popover>
      )}

      {/* More menu */}
      {openMenu === "more" && (
        <Popover onClose={() => setOpenMenu(null)} alignRight={true} offsetLeft={0}>
          {MORE_ITEMS.map((item) => (
            <PopoverItem
              key={item.label}
              icon={item.icon}
              onClick={
                item.label === "Copy Invite Link" ? copyInviteLink : () => setOpenMenu(null)
              }
            >
              {item.label}
            </PopoverItem>
          ))}
        </Popover>
      )}

      {/* ── The actual control bar ── */}
      <div
        className="flex items-center"
        style={{
          background: "var(--zoom-control-bar-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: "8px 12px",
          gap: 0,
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
        }}
      >
        {/* Mute — with chevron dropdown for device selection */}
        <SplitCtrlBtn
          icon={isMuted ? <MicOff size={21} /> : <Mic size={21} />}
          label={isMuted ? "Unmute" : "Mute"}
          colorState={isMuted ? "danger" : "normal"}
          onMain={onToggleMute}
          onChevron={() => toggleMenu("mic")}
          chevronOpen={openMenu === "mic"}
        />

        {/* Video — with chevron dropdown */}
        <SplitCtrlBtn
          icon={isVideoOn ? <Video size={21} /> : <VideoOff size={21} />}
          label={isVideoOn ? "Stop Video" : "Start Video"}
          colorState={isVideoOn ? "normal" : "danger"}
          onMain={onToggleVideo}
          onChevron={() => toggleMenu("video")}
          chevronOpen={openMenu === "video"}
        />

        <Divider />

        {/* Participants */}
        <CtrlBtn
          icon={<Users size={21} />}
          label="Participants"
          colorState={panelOpen === "participants" ? "active" : "normal"}
          onClick={onToggleParticipants}
          badge={participantCount > 0 ? participantCount : undefined}
        />

        {/* Chat */}
        <CtrlBtn
          icon={<MessageSquare size={21} />}
          label="Chat"
          colorState={panelOpen === "chat" ? "active" : "normal"}
          onClick={onToggleChat}
          badge={unreadCount > 0 ? unreadCount : undefined}
        />

        {/* Share Screen */}
        <CtrlBtn
          icon={isScreenSharing ? <MonitorOff size={21} /> : <Monitor size={21} />}
          label={isScreenSharing ? "Stop Share" : "Share Screen"}
          colorState={isScreenSharing ? "active" : "normal"}
          onClick={onToggleScreenShare}
        />

        {/* Record */}
        <CtrlBtn
          icon={
            isRecording ? (
              <StopCircle size={21} />
            ) : (
              <Circle size={21} />
            )
          }
          label={
            isRecording
              ? `${recMin}:${recSec}`
              : "Record"
          }
          colorState={isRecording ? "danger" : "normal"}
          onClick={onToggleRecord}
          recordingDot={isRecording}
        />

        {/* Reactions */}
        <CtrlBtn
          icon={<SmilePlus size={21} />}
          label="Reactions"
          colorState={openMenu === "reactions" ? "active" : "normal"}
          onClick={() => toggleMenu("reactions")}
        />

        {/* More */}
        <CtrlBtn
          icon={<MoreHorizontal size={21} />}
          label="More"
          colorState={openMenu === "more" ? "active" : "normal"}
          onClick={() => toggleMenu("more")}
        />

        <Divider />

        {/* Leave */}
        <button
          onClick={onLeave}
          className="flex items-center"
          style={{
            gap: 6,
            background: "var(--zoom-red-danger)",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            border: "none",
            transition: "background 0.12s",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--zoom-red-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--zoom-red-danger)")
          }
        >
          <PhoneOff size={17} />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: "rgba(255,255,255,0.15)",
        margin: "0 8px",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Split button (main action + chevron for dropdown) ─────────────────────
function SplitCtrlBtn({
  icon,
  label,
  colorState,
  onMain,
  onChevron,
  chevronOpen,
}: {
  icon: React.ReactNode;
  label: string;
  colorState: "normal" | "danger" | "active";
  onMain: () => void;
  onChevron: () => void;
  chevronOpen: boolean;
}) {
  const iconColor =
    colorState === "danger"
      ? "#F87171"
      : colorState === "active"
      ? "var(--zoom-blue)"
      : "rgba(255,255,255,0.85)";

  const labelColor =
    colorState === "danger"
      ? "#F87171"
      : colorState === "active"
      ? "var(--zoom-blue)"
      : "rgba(255,255,255,0.60)";

  return (
    <div className="relative flex flex-col items-center" style={{ minWidth: 60 }}>
      {/* Main button area */}
      <button
        onClick={onMain}
        title={label}
        aria-label={label}
        className="flex flex-col items-center w-full"
        style={{
          gap: 3,
          padding: "6px 6px 2px",
          borderRadius: "10px 10px 0 0",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: iconColor,
          transition: "background 0.10s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255,255,255,0.10)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <span style={{ color: iconColor, display: "flex" }}>{icon}</span>
        <span
          className="hidden sm:block"
          style={{ fontSize: 10, fontWeight: 400, color: labelColor, lineHeight: 1 }}
        >
          {label}
        </span>
      </button>

      {/* Chevron strip */}
      <button
        onClick={onChevron}
        title={`${label} options`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "2px 0 4px",
          border: "none",
          background: chevronOpen ? "rgba(255,255,255,0.10)" : "transparent",
          borderRadius: "0 0 10px 10px",
          cursor: "pointer",
          color: "rgba(255,255,255,0.40)",
          transition: "background 0.10s, color 0.10s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget.style.background = "rgba(255,255,255,0.10)");
          (e.currentTarget.style.color = "rgba(255,255,255,0.80)");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget.style.background = chevronOpen
            ? "rgba(255,255,255,0.10)"
            : "transparent");
          (e.currentTarget.style.color = "rgba(255,255,255,0.40)");
        }}
      >
        <ChevronDown
          size={10}
          style={{
            transform: chevronOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>
    </div>
  );
}

// ─── Regular control button ────────────────────────────────────────────────
type ColorState = "normal" | "danger" | "active";

function CtrlBtn({
  icon,
  label,
  onClick,
  colorState = "normal",
  disabled,
  badge,
  recordingDot,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  colorState?: ColorState;
  disabled?: boolean;
  badge?: number;
  recordingDot?: boolean;
}) {
  const iconColor =
    disabled
      ? "rgba(255,255,255,0.30)"
      : colorState === "danger"
      ? "#F87171"
      : colorState === "active"
      ? "var(--zoom-blue)"
      : "rgba(255,255,255,0.85)";

  const labelColor =
    disabled
      ? "rgba(255,255,255,0.25)"
      : colorState === "danger"
      ? "#F87171"
      : colorState === "active"
      ? "var(--zoom-blue)"
      : "rgba(255,255,255,0.60)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="relative flex flex-col items-center"
      style={{
        gap: 3,
        padding: "6px 10px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
        color: iconColor,
        transition: "background 0.10s",
        minWidth: 56,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: iconColor, display: "flex", position: "relative" }}>
        {icon}
        {/* Recording red dot */}
        {recordingDot && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#F04438",
              animation: "recBlink 1s ease-in-out infinite",
            }}
          />
        )}
      </span>
      <span
        className="hidden sm:block"
        style={{ fontSize: 10, fontWeight: 400, color: labelColor, lineHeight: 1 }}
      >
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span
          className="absolute flex items-center justify-center"
          style={{
            top: 2,
            right: 4,
            height: 15,
            minWidth: 15,
            borderRadius: 99,
            padding: "0 3px",
            background: "var(--zoom-blue)",
            fontSize: 9,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─── Popover container ────────────────────────────────────────────────────
function Popover({
  children,
  onClose,
  alignRight,
  offsetLeft,
}: {
  children: React.ReactNode;
  onClose: () => void;
  alignRight: boolean;
  offsetLeft: number;
}) {
  return (
    <div
      className="absolute animate-fade-in"
      style={{
        bottom: "calc(100% + 8px)",
        ...(alignRight ? { right: 0 } : { left: offsetLeft }),
        background: "#1E1F23",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        padding: "8px 0",
        minWidth: 220,
        zIndex: 100,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function PopoverTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        padding: "4px 14px 6px",
        fontSize: 11,
        fontWeight: 600,
        color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </p>
  );
}

function PopoverDivider() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(255,255,255,0.08)",
        margin: "6px 0",
      }}
    />
  );
}

function PopoverItem({
  children,
  active,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center"
      style={{
        gap: 10,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? "var(--zoom-blue)" : "rgba(255,255,255,0.82)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.10s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {icon && (
        <span style={{ color: "rgba(255,255,255,0.50)" }}>{icon}</span>
      )}
      {active && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--zoom-blue)",
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </button>
  );
}
