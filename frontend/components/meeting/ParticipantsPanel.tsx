"use client";

import { Mic, MicOff, MoreVertical, UserMinus, X } from "lucide-react";
import { useState } from "react";
import Avatar from "@/components/shared/Avatar";
import type { Participant } from "@/types";

interface Props {
  participants: Participant[];
  isHost: boolean;
  localParticipantId: number | null;
  onClose: () => void;
  onMuteToggle: (p: Participant) => void;
  onRemove: (p: Participant) => void;
}

export default function ParticipantsPanel({
  participants,
  isHost,
  localParticipantId,
  onClose,
  onMuteToggle,
  onRemove,
}: Props) {
  const [menuFor, setMenuFor] = useState<number | null>(null);

  const active = participants.filter((p) => !p.left_at);
  const hosts  = active.filter((p) =>  p.is_host);
  const others = active.filter((p) => !p.is_host);
  const sorted = [...hosts, ...others];

  return (
    /*
     * Panel: slides in from right, 320px, full meeting-room height
     * Background: --zoom-meeting-panel (slightly darker than canvas)
     * Header border: white/10% (dark-mode appropriate)
     */
    <aside
      className="flex h-full shrink-0 flex-col dark-scrollbar animate-slide-in-right"
      style={{
        width: 320,
        background: "var(--zoom-meeting-panel)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
        }}
      >
        <h2
          className="flex items-center"
          style={{ fontSize: 14, fontWeight: 600, color: "#fff", gap: 6 }}
        >
          Participants
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "rgba(255,255,255,0.50)",
              background: "rgba(255,255,255,0.10)",
              borderRadius: 99,
              padding: "1px 7px",
            }}
          >
            {active.length}
          </span>
        </h2>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ width: 26, height: 26, color: "rgba(255,255,255,0.50)", border: "none", background: "none", cursor: "pointer" }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sorted.map((p) => {
          const isMe = p.id === localParticipantId;
          return (
            <div
              key={p.id}
              className="group relative flex items-center justify-between hover:bg-white/5"
              style={{ padding: "8px 14px", margin: "0 4px", borderRadius: 6 }}
            >
              {/* Avatar + name */}
              <div className="flex min-w-0 items-center" style={{ gap: 10 }}>
                <Avatar name={p.display_name} size={32} />
                <div className="min-w-0">
                  {/* Name — same visual weight for "(You)" per spec */}
                  <p
                    className="truncate"
                    style={{ fontSize: 13.5, fontWeight: 500, color: "#fff" }}
                  >
                    {p.display_name}
                    {isMe && (
                      <span style={{ marginLeft: 4, fontSize: 13.5, fontWeight: 500, color: "#fff" }}>
                        (You)
                      </span>
                    )}
                  </p>
                  {/* Host badge — plain text under the name, not a colored chip */}
                  {p.is_host && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 1 }}>
                      Host
                    </p>
                  )}
                </div>
              </div>

              {/* Right side — mic status + host overflow menu */}
              <div className="flex shrink-0 items-center" style={{ gap: 4 }}>
                {p.is_muted ? (
                  <MicOff size={14} style={{ color: "#F87171" }} />
                ) : (
                  <Mic size={14} style={{ color: "rgba(255,255,255,0.40)" }} />
                )}

                {/* Host-only overflow (3 dots) for non-self participants */}
                {isHost && !isMe && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                      className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
                      style={{ width: 24, height: 24, color: "rgba(255,255,255,0.40)", border: "none", background: "none", cursor: "pointer" }}
                    >
                      <MoreVertical size={13} />
                    </button>

                    {menuFor === p.id && (
                      <div
                        className="absolute right-0 z-20 overflow-hidden animate-fade-in"
                        style={{
                          top: 28,
                          width: 168,
                          background: "#2A2B2F",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.10)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                          padding: "4px 0",
                        }}
                      >
                        <MenuItem
                          icon={p.is_muted ? <Mic size={14} /> : <MicOff size={14} />}
                          label={p.is_muted ? "Ask to unmute" : "Mute"}
                          onClick={() => { onMuteToggle(p); setMenuFor(null); }}
                        />
                        <MenuItem
                          icon={<UserMinus size={14} />}
                          label="Remove"
                          danger
                          onClick={() => { onRemove(p); setMenuFor(null); }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host footer — Mute All */}
      {isHost && others.length > 0 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.10)",
            padding: 12,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => others.filter((p) => !p.is_muted).forEach((p) => onMuteToggle(p))}
            className="w-full transition-colors hover:bg-white/15"
            style={{
              borderRadius: 8,
              background: "rgba(255,255,255,0.10)",
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Mute All
          </button>
        </div>
      )}
    </aside>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 hover:bg-white/10"
      style={{
        padding: "8px 14px",
        fontSize: 13,
        color: danger ? "#F87171" : "rgba(255,255,255,0.85)",
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.10s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
