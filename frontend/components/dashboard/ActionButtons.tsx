"use client";

import { Calendar, Monitor, Users, Video } from "lucide-react";
import { useState } from "react";

interface Props {
  onNewMeeting: () => void;
  onJoin: () => void;
  onSchedule: () => void;
  loading?: boolean;
}

export default function ActionButtons({ onNewMeeting, onJoin, onSchedule, loading }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      <Btn
        icon={<Video size={20} strokeWidth={2} color="#fff" />}
        label="New Meeting"
        sublabel="Start instantly"
        onClick={onNewMeeting}
        variant="primary"
        disabled={loading}
      />
      <Btn
        icon={<Users size={20} strokeWidth={2} color="var(--zoom-blue)" />}
        label="Join"
        sublabel="Enter a code"
        onClick={onJoin}
        variant="secondary"
      />
      <Btn
        icon={<Calendar size={20} strokeWidth={2} color="var(--zoom-blue)" />}
        label="Schedule"
        sublabel="Plan ahead"
        onClick={onSchedule}
        variant="secondary"
      />
      <Btn
        icon={<Monitor size={20} strokeWidth={2} color="#9CA3AF" />}
        label="Share Screen"
        sublabel="Coming soon"
        onClick={() => {}}
        variant="disabled"
        disabled
      />
    </div>
  );
}

function Btn({
  icon, label, sublabel, onClick, variant, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
  variant: "primary" | "secondary" | "disabled";
  disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const isPrimary  = variant === "primary";
  const isDisabled = variant === "disabled" || disabled;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        height: 100,
        borderRadius: 14,
        padding: "14px 10px",
        border: "none",
        outline: "none",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.45 : 1,
        transition: "transform 0.15s, box-shadow 0.15s, background 0.15s",
        transform: hov && !isDisabled ? "translateY(-2px)" : "none",
        ...(isPrimary
          ? {
              background: hov
                ? "linear-gradient(135deg, #2D8CFF 0%, #1A6FE8 100%)"
                : "linear-gradient(135deg, #3D96FF 0%, #2D8CFF 60%, #1A78EE 100%)",
              boxShadow: hov
                ? "0 8px 24px rgba(45,140,255,0.45), 0 2px 6px rgba(45,140,255,0.25)"
                : "0 4px 14px rgba(45,140,255,0.30)",
            }
          : {
              background: hov && !isDisabled ? "#F8FAFF" : "#fff",
              boxShadow: hov && !isDisabled
                ? "0 6px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)"
                : "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)",
            }),
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isPrimary
            ? "rgba(255,255,255,0.20)"
            : isDisabled
            ? "#F3F4F6"
            : "#EBF3FF",
          transition: "background 0.15s",
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ textAlign: "center", lineHeight: 1 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: isPrimary ? "#fff" : isDisabled ? "#9CA3AF" : "#111827",
          marginBottom: 2,
        }}>
          {label}
        </p>
        <p style={{
          fontSize: 10.5,
          fontWeight: 400,
          color: isPrimary ? "rgba(255,255,255,0.72)" : "#9CA3AF",
        }}>
          {sublabel}
        </p>
      </div>
    </button>
  );
}
