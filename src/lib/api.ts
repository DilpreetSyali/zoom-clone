import type { DashboardResponse, MeetingSummary, Participant, User } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export const api = {
  getMe: () => request<User>("/api/users/me"),
  getUser: (id: number) => request<User>(`/api/users/${id}`),
  signup: (body: any) => request<User>("/api/users/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body: any) => request<User>("/api/users/login", { method: "POST", body: JSON.stringify(body) }),
  dashboard: async (): Promise<DashboardResponse> => ({
    upcoming: await request<MeetingSummary[]>("/api/meetings/upcoming"),
    recent: await request<MeetingSummary[]>("/api/meetings/recent"),
  }),
  instantMeeting: () => request<MeetingSummary & { host?: User }>("/api/meetings/instant", { method: "POST" }),
  scheduleMeeting: (body: {
    title: string;
    description: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    timezone: string;
  }) => request<{ meeting_code: string; invite_link: string }>("/api/meetings/schedule", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  getMeeting: (code: string) => request<MeetingSummary>(`/api/meetings/${code}`),
  joinMeeting: (code: string, display_name: string) => request<{ participant_id: number; meeting: MeetingSummary }>(`/api/meetings/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ display_name }),
  }),
  participants: (code: string) => request<Participant[]>(`/api/meetings/${code}/participants`),
  leaveMeeting: (code: string, participant_id: number) => request<{ ok: boolean }>(`/api/meetings/${code}/leave`, {
    method: "POST",
    body: JSON.stringify({ participant_id }),
  }),
  endMeeting: (code: string) => request<{ ok: boolean }>(`/api/meetings/${code}`, { method: "DELETE" }),
  muteParticipant: (code: string, participantId: number) => request<{ ok: boolean }>(`/api/meetings/${code}/participants/${participantId}/mute`, {
    method: "POST",
  }),
  removeParticipant: (code: string, participantId: number) => request<{ ok: boolean }>(`/api/meetings/${code}/participants/${participantId}`, {
    method: "DELETE",
  }),
};
