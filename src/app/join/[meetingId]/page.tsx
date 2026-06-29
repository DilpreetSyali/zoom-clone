"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/Button";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams<{ meetingId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [name, setName] = useState("");
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        activeStream = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera or microphone permission is required for preview."));
      
    const storedName = localStorage.getItem("zoom_name");
    if (storedName) setName(storedName);

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function join() {
    try {
      const meeting = await api.getMeeting(params.meetingId);
      const result = await api.joinMeeting(meeting.meeting_code, name || "Guest");
      localStorage.setItem(`zoomclone-name:${meeting.meeting_code}`, name || "Guest");
      localStorage.setItem(`zoomclone-participant:${meeting.meeting_code}`, String(result.participant_id));
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Meeting not found");
    }
  }

  return (
    <main className="joinPage">
      <div className="joinPanel">
        <div className="joinHeading">
          <div className="brand">
            <div className="brandMark" />
            Zoom
          </div>
          <h1>Join a meeting</h1>
          <p>Check your camera, enter your display name, then join.</p>
        </div>

        <div className="videoPreview">
          <video ref={videoRef} autoPlay muted={muted || !videoOn} playsInline />
        </div>

        <div className="field">
          <label>Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" />
        </div>

        <div className="joinToggles">
          <Button variant="secondary" onClick={() => setMuted((v) => !v)}>{muted ? "Unmute" : "Mute"}</Button>
          <Button variant="secondary" onClick={() => setVideoOn((v) => !v)}>{videoOn ? "Stop Video" : "Start Video"}</Button>
        </div>

        <Button onClick={join}>Join</Button>
        {error ? <p className="errorText">{error}</p> : null}
      </div>
    </main>
  );
}
