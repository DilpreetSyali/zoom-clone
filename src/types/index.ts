export type User = {
  id: number;
  name: string;
  email: string | null;
  avatar_color: string;
  initials: string;
};

export type MeetingSummary = {
  id: number;
  meeting_code: string;
  title: string;
  type: "instant" | "scheduled";
  status: "scheduled" | "active" | "ended";
  invite_link: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number | null;
  description?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
};

export type Participant = {
  id: number;
  meeting_id: number;
  user_id: number | null;
  display_name: string;
  joined_at: string;
  left_at: string | null;
  is_host: boolean;
  is_muted: boolean;
};

export type DashboardResponse = {
  upcoming: MeetingSummary[];
  recent: MeetingSummary[];
};
