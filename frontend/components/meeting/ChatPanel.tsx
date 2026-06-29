"use client";

import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { colorForName } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface Props {
  messages: ChatMessage[];
  currentUserName: string;
  onClose: () => void;
  onSend: (message: string) => void;
}

export default function ChatPanel({ messages, currentUserName, onClose, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef  = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = draft.trim();
    if (!msg) return;
    onSend(msg);
    setDraft("");
    inputRef.current?.focus();
  }

  return (
    /*
     * Panel: 320px, full meeting-room height, dark background
     * Same spec as ParticipantsPanel but for chat
     */
    <aside
      className="flex h-full shrink-0 flex-col animate-slide-in-right"
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
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
          Meeting Chat
        </h2>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ width: 26, height: 26, color: "rgba(255,255,255,0.50)", border: "none", background: "none", cursor: "pointer" }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="dark-scrollbar flex-1 overflow-y-auto"
        style={{ padding: "12px 14px" }}
      >
        {messages.length === 0 ? (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>💬</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.30)" }}>
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((m, i) => {
              const isMe = m.sender_name === currentUserName;
              const showSender =
                i === 0 || messages[i - 1].sender_name !== m.sender_name;

              return (
                <div key={m.id}>
                  {showSender && (
                    <div
                      className="flex items-center"
                      style={{ marginBottom: 5, gap: 7 }}
                    >
                      <Avatar name={m.sender_name} size={22} />
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: colorForName(m.sender_name),
                        }}
                      >
                        {isMe ? "You" : m.sender_name}
                      </span>
                      <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.30)" }}>
                        {new Date(m.sent_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <p
                    className="break-words"
                    style={{
                      marginLeft: 29,
                      borderRadius: 14,
                      borderTopLeftRadius: 4,
                      padding: "7px 12px",
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: "rgba(255,255,255,0.88)",
                      background: isMe
                        ? "rgba(45,140,255,0.28)"
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    {m.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="flex items-center"
        style={{
          gap: 8,
          padding: 12,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.07)",
            padding: "8px 12px",
            fontSize: 13.5,
            color: "#fff",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.12s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--zoom-blue)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--zoom-blue)",
            border: "none",
            color: "#fff",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            opacity: draft.trim() ? 1 : 0.40,
            transition: "background 0.12s, opacity 0.12s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (draft.trim()) e.currentTarget.style.background = "var(--zoom-blue-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--zoom-blue)";
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}
