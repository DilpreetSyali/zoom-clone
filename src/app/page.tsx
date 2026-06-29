"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { MeetingSummary } from "@/types";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { MeetingCard } from "@/components/MeetingCard";
import { TopNav } from "@/components/TopNav";

export default function HomePage() {
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<MeetingSummary[]>([]);
  const [recent, setRecent] = useState<MeetingSummary[]>([]);
  const [modal, setModal] = useState<"join" | "schedule" | null>(null);
  const [name, setName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [scheduledTitle, setScheduledTitle] = useState("");
  const [scheduledDescription, setScheduledDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(30);
  const now = new Date();

  useEffect(() => {
    const storedName = localStorage.getItem("zoom_name");
    if (storedName) setName(storedName);
  }, []);

  useEffect(() => {
    api.dashboard().then((data) => {
      setUpcoming(data.upcoming ?? []);
      setRecent(data.recent ?? []);
    });
  }, []);

  async function createInstant() {
    const data = await api.instantMeeting();
    router.push(`/meeting/${data.meeting_code}`);
  }

  async function joinMeeting() {
    const code = meetingId.includes("/") ? meetingId.split("/").filter(Boolean).pop() ?? "" : meetingId;
    await api.getMeeting(code);
    router.push(`/join/${code}`);
  }

  async function scheduleMeeting() {
    const data = await api.scheduleMeeting({
      title: scheduledTitle,
      description: scheduledDescription,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      duration_minutes: duration,
      timezone: "Asia/Calcutta",
    });
    setInviteLink(data.invite_link);
    const refreshed = await api.dashboard();
    setUpcoming(refreshed.upcoming);
    setRecent(refreshed.recent);
  }

  return (
    <main className="page">
      <div className="shell">
        <TopNav />

        <section className="dashboardHero">
          <div className="dashboardCard centerCard">
            <div className="clockBlock">
              <div className="clockDate">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
              <div className="clockTime">{now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <div className="quickActions">
              <Button onClick={createInstant}>New Meeting</Button>
              <Button variant="secondary" onClick={() => setModal("join")}>Join</Button>
              <Button variant="secondary" onClick={() => setModal("schedule")}>Schedule</Button>
              <Button variant="secondary" disabled>Share Screen</Button>
            </div>
          </div>
        </section>

        <section className="sectionGrid">
          <section className="sectionBlock">
            <div className="sectionTitleRow">
              <h2>Upcoming Meetings</h2>
            </div>
            <div className="meetingList">
              {upcoming.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  action={<Button variant="secondary" onClick={() => router.push(`/meeting/${meeting.meeting_code}`)}>Start</Button>}
                />
              ))}
            </div>
          </section>

          <section className="sectionBlock">
            <div className="sectionTitleRow">
              <h2>Recent Meetings</h2>
            </div>
            <div className="meetingList">
              {recent.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </section>
        </section>
      </div>

      {modal && (
        <Modal
          title={modal === "join" ? "Join Meeting" : "Schedule Meeting"}
          onClose={() => setModal(null)}
        >
          <div className="field">
            <label>Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {modal === "join" ? (
            <>
              <div className="field">
                <label>Meeting ID or invite link</label>
                <input value={meetingId} onChange={(e) => setMeetingId(e.target.value)} />
              </div>
              <Button onClick={joinMeeting}>Join Meeting</Button>
            </>
          ) : (
            <>
              <div className="field"><label>Title</label><input value={scheduledTitle} onChange={(e) => setScheduledTitle(e.target.value)} /></div>
              <div className="field"><label>Description</label><textarea value={scheduledDescription} onChange={(e) => setScheduledDescription(e.target.value)} /></div>
              <div className="field"><label>Date</label><input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} /></div>
              <div className="field"><label>Time</label><input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} /></div>
              <div className="field"><label>Duration (minutes)</label><input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
              <Button onClick={scheduleMeeting}>Create Schedule</Button>
              {inviteLink ? <p className="successText">Invite link: {inviteLink}</p> : null}
            </>
          )}
        </Modal>
      )}
    </main>
  );
}
