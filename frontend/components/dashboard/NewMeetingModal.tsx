"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import Modal from "@/components/shared/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  onStart: (displayName: string, muted: boolean, videoOff: boolean) => void;
  loading?: boolean;
}

export default function NewMeetingModal({ open, onClose, defaultName, onStart, loading }: Props) {
  const [name, setName] = useState(defaultName);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  // Sync default name when modal opens
  useEffect(() => {
    if (open && !name.trim() && defaultName) {
      setName(defaultName);
    }
  }, [open, defaultName, name]);

  return (
    <Modal open={open} onClose={onClose} title="Start a New Meeting" maxWidth={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Display Name */}
        <div>
          <label
            style={{
              display: "block", marginBottom: 6,
              fontSize: 12.5, fontWeight: 600, color: "#6B7280",
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}
          >
            Your Display Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="zoom-input"
            style={{ width: "100%" }}
          />
          <p style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>
            This is how other participants will see you.
          </p>
        </div>

        {/* Mic & Camera toggles */}
        <div>
          <label
            style={{
              display: "block", marginBottom: 10,
              fontSize: 12.5, fontWeight: 600, color: "#6B7280",
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}
          >
            Join Preferences
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <ToggleChip
              active={!muted}
              onClick={() => setMuted((m) => !m)}
              iconOn={<Mic size={16} />}
              iconOff={<MicOff size={16} />}
              labelOn="Mic On"
              labelOff="Mic Off"
            />
            <ToggleChip
              active={!videoOff}
              onClick={() => setVideoOff((v) => !v)}
              iconOn={<Video size={16} />}
              iconOff={<VideoOff size={16} />}
              labelOn="Camera On"
              labelOff="Camera Off"
            />
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => onStart(name.trim() || defaultName, muted, videoOff)}
          disabled={loading || !name.trim()}
          className="zoom-btn-primary"
          style={{
            marginTop: 4,
            opacity: loading || !name.trim() ? 0.6 : 1,
            cursor: loading || !name.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Starting meeting…" : "Start Meeting"}
        </button>
      </div>
    </Modal>
  );
}

function ToggleChip({
  active, onClick, iconOn, iconOff, labelOn, labelOff,
}: {
  active: boolean;
  onClick: () => void;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 10,
        border: active
          ? "1.5px solid var(--zoom-blue)"
          : "1.5px solid #D1D5DB",
        background: active ? "var(--zoom-blue-light, #EBF3FF)" : "#F9FAFB",
        color: active ? "var(--zoom-blue)" : "#6B7280",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {active ? iconOn : iconOff}
      {active ? labelOn : labelOff}
    </button>
  );
}
