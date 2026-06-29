"use client";

import { RefObject } from "react";
import VideoTile from "./VideoTile";
import type { Participant } from "@/types";

interface VideoGridProps {
  participants: Participant[];
  localParticipantId: number | null;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  localVideoOn: boolean;
}

/**
 * Gallery-view grid matching Zoom's layout rules:
 *  1  → single tile (full area)
 *  2  → 50/50 side-by-side
 *  3-4 → 2×2
 *  5-6 → 3 cols × 2 rows
 *  7+  → 3 cols, wrapping
 *
 * Gap between tiles: 8px (Zoom spec: 8–12px)
 */
function gridStyle(count: number): React.CSSProperties {
  if (count === 1) return { display: "grid", gridTemplateColumns: "1fr", gap: 8 };
  if (count === 2) return { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 };
  if (count <= 4)  return { display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8 };
  if (count <= 6)  return { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 };
  return { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 };
}

function tileSize(count: number): "large" | "normal" {
  return count <= 2 ? "large" : "normal";
}

export default function VideoGrid({
  participants,
  localParticipantId,
  localVideoRef,
  localVideoOn,
}: VideoGridProps) {
  if (participants.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)" }}
          >
            <span style={{ fontSize: 28 }}>👥</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#D1D5DB" }}>
            Waiting for participants to join…
          </p>
          <p style={{ marginTop: 4, fontSize: 13, color: "#6B7280" }}>
            Share the meeting link to invite others
          </p>
        </div>
      </div>
    );
  }

  const gs = gridStyle(participants.length);
  const ts = tileSize(participants.length);

  return (
    <div
      className={participants.length > 9 ? "overflow-y-auto" : ""}
      style={{ ...gs, height: "100%" }}
    >
      {participants.map((p) => {
        const isLocal = p.id === localParticipantId;
        return (
          <VideoTile
            key={p.id}
            participant={p}
            isLocal={isLocal}
            videoRef={isLocal ? localVideoRef : undefined}
            localVideoOn={isLocal ? localVideoOn : undefined}
            size={ts}
          />
        );
      })}
    </div>
  );
}
