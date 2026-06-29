// Types mirror the backend Pydantic schemas exactly so the two never drift.

export type MeetingType = "instant" | "scheduled";
export type MeetingStatus = "scheduled" | "active" | "ended";

export interface User {
  id: number;
  name: string;
  email: string | null;
  avatar_color: string;
  initials: string;
}

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  invite_link: string;
  // scheduling (null for instant meetings)
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number | null;
  description: string | null;
  timezone: string | null;
  // timestamps
  created_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  host: User | null;
}

export interface Participant {
  id: number;
  meeting_id: number;
  user_id: number | null;
  display_name: string;
  joined_at: string;
  left_at: string | null;
  is_host: boolean;
  is_muted: boolean;
  is_video_on: boolean;
}

export interface ChatMessage {
  id: number;
  meeting_id: number;
  sender_name: string;
  message: string;
  sent_at: string;
}

export interface CreateScheduledMeetingPayload {
  title: string;
  description?: string;
  scheduled_date: string;   // "YYYY-MM-DD"
  scheduled_time: string;   // "HH:MM"
  duration_minutes: number;
  timezone?: string;
}

export interface JoinMeetingPayload {
  display_name: string;
  is_muted?: boolean;
  is_video_on?: boolean;
}

export interface JoinMeetingResponse {
  participant_id: number;
  meeting: Meeting;
}
