"use client";

import { Mic, MicOff } from "lucide-react";
import { RefObject } from "react";
import { colorForName, initialsForName } from "@/lib/utils";
import type { Participant } from "@/types";

interface VideoTileProps {
  participant: Participant;
  isLocal: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
  localVideoOn?: boolean;
  /** Active speaker — shows 2px blue border (Zoom's most recognizable signature) */
  speaking?: boolean;
  size?: "normal" | "large";
}

export default function VideoTile({
  participant,
  isLocal,
  videoRef,
  localVideoOn,
  speaking = false,
  size = "normal",
}: VideoTileProps) {
  const showVideo = isLocal ? (localVideoOn ?? false) : participant.is_video_on;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        borderRadius: 8, // Zoom uses small 8px radius on tiles
        background: "var(--zoom-meeting-tile-bg)",
        // Active-speaker blue border — one of Zoom's most recognizable signatures
        outline: speaking ? "3px solid var(--zoom-blue)" : "none",
        outlineOffset: speaking ? -2 : 0,
        transition: "outline 0.15s",
      }}
    >
      {/* Video stream (local only) */}
      {showVideo && isLocal && videoRef ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        /* Avatar fallback — sized to ~30-35% of the tile's shorter dimension */
        <AvatarFill name={participant.display_name} size={size} />
      )}

      {/* Subtle gradient at bottom for readability */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: 48,
          background: "linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Name chip — bottom-left, pill with mic icon inside (Zoom pattern) */}
      <div
        className="absolute flex items-center"
        style={{
          bottom: 8,
          left: 8,
          maxWidth: "calc(100% - 16px)",
          gap: 4,
          background: "rgba(0,0,0,0.55)",
          borderRadius: 4,
          padding: "4px 8px",
        }}
      >
        {/* Mic icon inside the name chip */}
        {participant.is_muted ? (
          // Muted: red-orange (Zoom uses a distinct muted-icon red, slightly different from danger red)
          <MicOff size={11} style={{ color: "#F04438", flexShrink: 0 }} />
        ) : (
          <Mic size={11} style={{ color: "rgba(255,255,255,0.75)", flexShrink: 0 }} />
        )}
        <span
          className="truncate"
          style={{ fontSize: 12, fontWeight: 500, color: "#fff", lineHeight: 1 }}
        >
          {participant.display_name}
          {isLocal ? " (You)" : ""}
        </span>
      </div>

      {/* Host badge — top-left */}
      {participant.is_host && (
        <span
          className="absolute"
          style={{
            top: 8,
            left: 8,
            background: "rgba(0,0,0,0.50)",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 10,
            fontWeight: 600,
            color: "#fff",
          }}
        >
          Host
        </span>
      )}
    </div>
  );
}

/**
 * Avatar centered in the tile — sized to ~30% of the tile's shorter dimension.
 * We use a percentage-based approach via CSS so it scales with any tile size.
 */
function AvatarFill({ name, size }: { name: string; size: "normal" | "large" }) {
  const px = size === "large" ? 88 : 60;
  return (
    <div
      className="flex items-center justify-center h-full w-full"
      style={{ background: "var(--zoom-meeting-tile-bg)" }}
    >
      <div
        className="flex items-center justify-center rounded-full font-semibold text-white"
        style={{
          width: px,
          height: px,
          background: colorForName(name),
          fontSize: Math.round(px * 0.34),
        }}
      >
        {initialsForName(name)}
      </div>
    </div>
  );
}
