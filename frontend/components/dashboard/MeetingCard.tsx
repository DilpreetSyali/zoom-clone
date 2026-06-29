"use client";

import { Calendar, Check, Clock, Copy, ExternalLink, Video } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildInviteLink,
  formatDuration,
  formatMeetingDateTime,
  formatPastDate,
  formatTime,
} from "@/lib/utils";
import type { Meeting } from "@/types";

export default function MeetingCard({
  meeting,
  variant,
}: {
  meeting: Meeting;
  variant: "upcoming" | "recent";
}) {
  const router = useRouter();
  const [copied, setCopied]   = useState(false);
  const [hovered, setHovered] = useState(false);

  function copyLink(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(buildInviteLink(meeting.meeting_code));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleStart(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/meeting/${meeting.meeting_code}?host=true`);
  }

  const dateLabel =
    variant === "upcoming"
      ? formatMeetingDateTime(meeting.scheduled_date, meeting.scheduled_time)
      : `${formatPastDate(meeting.ended_at)} · ${formatTime(meeting.ended_at)}`;

  const durationLabel = meeting.duration_minutes
    ? formatDuration(meeting.duration_minutes)
    : meeting.started_at && meeting.ended_at
    ? formatDuration(
        Math.round(
          (new Date(meeting.ended_at).getTime() - new Date(meeting.started_at).getTime()) / 60000,
        ),
      )
    : null;

  const isUpcoming = variant === "upcoming";

  return (
    <div
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fff",
        borderRadius: 10,
        border: `1px solid ${hovered ? "#C9CDD4" : "var(--zoom-border-light)"}`,
        padding: "13px 16px",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
        boxShadow: hovered
          ? "0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)"
          : "0 1px 2px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-1px)" : "none",
        cursor: "default",
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
        {/* Icon */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isUpcoming
              ? "linear-gradient(135deg, #EBF3FF 0%, #DBEAFE 100%)"
              : "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
            color: isUpcoming ? "var(--zoom-blue)" : "#6B7280",
          }}
        >
          {isUpcoming ? <Calendar size={17} strokeWidth={2} /> : <Video size={17} strokeWidth={2} />}
        </div>

        {/* Text */}
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "#111827",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meeting.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
            <Clock size={10} style={{ color: "#9CA3AF", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
              {dateLabel}
            </span>
            {durationLabel && (
              <>
                <span style={{ color: "#D1D5DB", fontSize: 10 }}>•</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isUpcoming ? "var(--zoom-blue)" : "#9CA3AF",
                    background: isUpcoming ? "var(--zoom-blue-light)" : "#F3F4F6",
                    padding: "1px 6px",
                    borderRadius: 99,
                  }}
                >
                  {durationLabel}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right — actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginLeft: 16,
          flexShrink: 0,
          opacity: !isUpcoming && !hovered ? 0 : 1,
          transition: "opacity 0.18s",
        }}
      >
        <button
          onClick={copyLink}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 7,
            border: "1px solid var(--zoom-border-light)",
            padding: "5px 11px",
            fontSize: 12,
            fontWeight: 500,
            color: copied ? "var(--zoom-green-active)" : "#6B7280",
            background: copied ? "#F0FDF4" : "#fff",
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.background = "#F9FAFB";
              e.currentTarget.style.borderColor = "#C9CDD4";
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "var(--zoom-border-light)";
            }
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy link"}
        </button>

        {isUpcoming && (
          <button
            onClick={handleStart}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              borderRadius: 7,
              background: "var(--zoom-blue)",
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s, box-shadow 0.15s",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(45,140,255,0.30)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--zoom-blue-hover)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(45,140,255,0.40)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--zoom-blue)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(45,140,255,0.30)";
            }}
          >
            <ExternalLink size={11} />
            Start
          </button>
        )}
      </div>
    </div>
  );
}
