import type {
  ChatMessage,
  CreateScheduledMeetingPayload,
  JoinMeetingPayload,
  JoinMeetingResponse,
  Meeting,
  Participant,
  User,
} from "@/types";
import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch { /* keep generic */ }
    throw new ApiClientError(res.status, detail);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export const api = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  register: (name: string, email: string, password: string) =>
    request<AuthPayload>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthPayload>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<User>("/api/auth/me"),

  updateProfile: (data: { name?: string; email?: string; avatar_color?: string }) =>
    request<User>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // ── Legacy (kept for any components still using it) ────────────────────
  getCurrentUser: () => request<User>("/api/auth/me"),

  // ── Meetings ────────────────────────────────────────────────────────────
  createInstantMeeting: () =>
    request<Meeting>("/api/meetings/instant", { method: "POST", body: "{}" }),

  scheduleMeeting: (payload: CreateScheduledMeetingPayload) =>
    request<Meeting>("/api/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getUpcomingMeetings: () => request<Meeting[]>("/api/meetings/upcoming"),
  getRecentMeetings:   () => request<Meeting[]>("/api/meetings/recent"),
  getMeeting: (code: string) => request<Meeting>(`/api/meetings/${encodeURIComponent(code)}`),

  joinMeeting: (code: string, payload: JoinMeetingPayload) =>
    request<JoinMeetingResponse>(`/api/meetings/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  leaveMeeting: (code: string, participantId: number) =>
    request<{ ok: boolean }>(`/api/meetings/${encodeURIComponent(code)}/leave`, {
      method: "POST",
      body: JSON.stringify({ participant_id: participantId }),
    }),

  endMeeting: (code: string) =>
    request<{ ok: boolean }>(`/api/meetings/${encodeURIComponent(code)}`, { method: "DELETE" }),

  // ── Participants ─────────────────────────────────────────────────────────
  getParticipants: (code: string) =>
    request<Participant[]>(`/api/meetings/${encodeURIComponent(code)}/participants`),

  updateParticipant: (code: string, participantId: number, payload: { is_muted?: boolean; is_video_on?: boolean; display_name?: string }) =>
    request<Participant>(`/api/meetings/${encodeURIComponent(code)}/participants/${participantId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  muteParticipant: (code: string, participantId: number) =>
    request<{ ok: boolean }>(`/api/meetings/${encodeURIComponent(code)}/participants/${participantId}/mute`, {
      method: "POST", body: "{}",
    }),

  removeParticipant: (code: string, participantId: number) =>
    request<{ ok: boolean }>(`/api/meetings/${encodeURIComponent(code)}/participants/${participantId}`, {
      method: "DELETE",
    }),

  // ── Chat ─────────────────────────────────────────────────────────────────
  getChatMessages: (code: string) =>
    request<ChatMessage[]>(`/api/meetings/${encodeURIComponent(code)}/chat`),

  postChatMessage: (code: string, senderName: string, message: string) =>
    request<ChatMessage>(`/api/meetings/${encodeURIComponent(code)}/chat`, {
      method: "POST",
      body: JSON.stringify({ sender_name: senderName, message }),
    }),
};
