"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/Modal";
import { api, ApiClientError } from "@/lib/api";
import { extractMeetingCode } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function JoinMeetingModal({ open, onClose }: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<"input" | "name" | "general" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setInput(""); setName(""); setFieldError(null); setErrorMsg(null);
    onClose();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null); setErrorMsg(null);

    const trimmedInput = input.trim();
    const trimmedName  = name.trim();

    if (!trimmedInput) {
      setFieldError("input");
      setErrorMsg("Enter a meeting ID or paste an invite link.");
      return;
    }
    if (!trimmedName) {
      setFieldError("name");
      setErrorMsg("Enter your name so others can see you.");
      return;
    }

    const code = extractMeetingCode(trimmedInput);
    setLoading(true);

    try {
      await api.getMeeting(code);
      router.push(`/join/${encodeURIComponent(code)}?name=${encodeURIComponent(trimmedName)}`);
      reset();
    } catch (err) {
      setFieldError("general");
      setErrorMsg(
        err instanceof ApiClientError
          ? err.message
          : "Couldn't reach the server. Check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={reset} title="Join a Meeting" maxWidth={440}>
      <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="Meeting ID or invite link"
          error={fieldError === "input" ? errorMsg ?? undefined : undefined}
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => { setInput(e.target.value); setFieldError(null); setErrorMsg(null); }}
            placeholder="123-456-789 or paste link"
            className={`zoom-input ${fieldError === "input" ? "zoom-input-error" : ""}`}
          />
        </Field>

        <Field
          label="Your name"
          error={fieldError === "name" ? errorMsg ?? undefined : undefined}
        >
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setFieldError(null); setErrorMsg(null); }}
            placeholder="How should we display you?"
            className={`zoom-input ${fieldError === "name" ? "zoom-input-error" : ""}`}
          />
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
          {loading ? "Checking meeting…" : "Join"}
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
