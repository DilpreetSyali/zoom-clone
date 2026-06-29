import type { MeetingSummary } from "@/types";

export function MeetingCard({ meeting, action }: { meeting: MeetingSummary; action?: React.ReactNode }) {
  return (
    <article className="meetingCard">
      <div className="meetingBadge">{meeting.meeting_code}</div>
      <h3 className="meetingTitle">{meeting.title}</h3>
      <p className="meetingMetaText">
        {meeting.scheduled_date ? new Date(`${meeting.scheduled_date}T${meeting.scheduled_time ?? "00:00"}`).toLocaleString() : meeting.status}
      </p>
      {meeting.description ? <p className="meetingDesc">{meeting.description}</p> : null}
      {action ? <div className="meetingActions">{action}</div> : null}
    </article>
  );
}
