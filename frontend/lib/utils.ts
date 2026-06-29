// Shared pure helpers used across components.

/** Pull a meeting code out of a raw code or full invite URL. */
export function extractMeetingCode(input: string): string {
  const trimmed = input.trim();
  // Match NNN-NNN-NNN or NNN-NNN-NNNN patterns
  const match = trimmed.match(/(\d{3}-\d{3}-\d{3,4})/);
  if (match) return match[1];
  return trimmed;
}

/** Build the shareable join URL from the browser's current origin. */
export function buildInviteLink(meetingCode: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${origin}/join/${meetingCode}`;
}

// ---------------------------------------------------------------------------
// Avatar helpers
// ---------------------------------------------------------------------------
const PALETTE = [
  "#2D8CFF", "#00A86B", "#F5A623", "#9B59B6",
  "#E0527A", "#1ABC9C", "#E67E22", "#3498DB",
];

/** Deterministic colour for a name — stable across renders. */
export function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/** Two-letter initials from a display name. */
export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatMeetingDateTime(
  dateStr: string | null,
  timeStr: string | null,
): string {
  if (!dateStr || !timeStr) return "";
  // timeStr from backend may be "09:30:00" — slice to "09:30"
  const t = timeStr.slice(0, 5);
  const dt = new Date(`${dateStr}T${t}`);
  return dt.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPastDate(isoString: string | null): string {
  if (!isoString) return "";
  const dt = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - dt.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(isoString: string | null): string {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
