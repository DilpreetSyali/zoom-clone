"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/shared/Modal";
import { api, ApiClientError } from "@/lib/api";
import { buildInviteLink } from "@/lib/utils";
import type { Meeting } from "@/types";

const DURATIONS = [
  { value: 15,  label: "15 minutes" },
  { value: 30,  label: "30 minutes" },
  { value: 45,  label: "45 minutes" },
  { value: 60,  label: "1 hour" },
  { value: 90,  label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onScheduled: (meeting: Meeting) => void;
}

type FieldKey = "title" | "date" | "time" | "general";

export default function ScheduleMeetingModal({ open, onClose, onScheduled }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [fieldError, setFieldError] = useState<FieldKey | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setTitle(""); setDescription(""); setDate(""); setTime("");
    setDuration(30); setFieldError(null); setErrorMsg(null);
    setCreated(null); setCopied(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null); setErrorMsg(null);

    if (!title.trim()) { setFieldError("title"); setErrorMsg("Give your meeting a title."); return; }
    if (!date)         { setFieldError("date");  setErrorMsg("Pick a date.");               return; }
    if (!time)         { setFieldError("time");  setErrorMsg("Pick a time.");               return; }

    setLoading(true);
    try {
      const meeting = await api.scheduleMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: duration,
      });
      setCreated(meeting);
      onScheduled(meeting);
    } catch (err) {
      setFieldError("general");
      setErrorMsg(
        err instanceof ApiClientError
          ? err.message
          : "Couldn't schedule the meeting. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (created) {
    const link = buildInviteLink(created.meeting_code);
    return (
      <Modal open={open} onClose={reset} title="Meeting Scheduled" maxWidth={460}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              borderRadius: 8,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              padding: "12px 14px",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>
              {created.title}
            </p>
            <p style={{ marginTop: 2, fontSize: 12.5, color: "#15803D" }}>
              Your meeting is set. Share the link below to invite participants.
            </p>
          </div>

          {/* Copyable link */}
          <div
            className="flex items-center justify-between"
            style={{
              borderRadius: 8,
              border: "1px solid var(--zoom-border-light)",
              background: "#F9FAFB",
              padding: "8px 12px",
            }}
          >
            <span
              className="min-w-0 truncate"
              style={{ fontSize: 13, color: "var(--zoom-text-secondary)" }}
            >
              {link}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex shrink-0 items-center gap-1.5 ml-3 hover:bg-gray-100"
              style={{
                borderRadius: 6,
                border: "1px solid var(--zoom-border-light)",
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 500,
                color: copied ? "var(--zoom-green-active)" : "var(--zoom-blue)",
                background: "#fff",
                transition: "background 0.12s",
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <button onClick={reset} className="zoom-btn-primary">
            Done
          </button>
        </div>
      </Modal>
    );
  }

  // ── Form state ──────────────────────────────────────────────────────────
  return (
    <Modal open={open} onClose={reset} title="Schedule a Meeting" maxWidth={460}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Title *" error={fieldError === "title" ? errorMsg ?? undefined : undefined}>
          <input
            autoFocus
            value={title}
            onChange={(e) => { setTitle(e.target.value); setFieldError(null); }}
            placeholder="e.g. Sprint Planning"
            className={`zoom-input ${fieldError === "title" ? "zoom-input-error" : ""}`}
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this meeting about?"
            rows={2}
            className="zoom-input"
            style={{ resize: "none" }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date *" error={fieldError === "date" ? errorMsg ?? undefined : undefined}>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => { setDate(e.target.value); setFieldError(null); }}
              className={`zoom-input ${fieldError === "date" ? "zoom-input-error" : ""}`}
            />
          </Field>
          <Field label="Time *" error={fieldError === "time" ? errorMsg ?? undefined : undefined}>
            <input
              type="time"
              value={time}
              onChange={(e) => { setTime(e.target.value); setFieldError(null); }}
              className={`zoom-input ${fieldError === "time" ? "zoom-input-error" : ""}`}
            />
          </Field>
        </div>

        <Field label="Duration">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="zoom-input"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </Field>

        {fieldError === "general" && errorMsg && (
          <p className="zoom-field-error">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="zoom-btn-primary"
          style={{ marginTop: 4 }}
        >
          {loading ? "Scheduling…" : "Schedule Meeting"}
        </button>
      </form>
    </Modal>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: 13,
          fontWeight: 500,
          color: "var(--zoom-text-primary)",
        }}
      >
        {label}
      </label>
      {children}
      {error && <p className="zoom-field-error">{error}</p>}
    </div>
  );
}
