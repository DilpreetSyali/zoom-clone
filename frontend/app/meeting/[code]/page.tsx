"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import VideoGrid from "@/components/meeting/VideoGrid";
import ControlBar, { FloatingReaction } from "@/components/meeting/ControlBar";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import ChatPanel from "@/components/meeting/ChatPanel";
import MeetingHeader from "@/components/meeting/MeetingHeader";
import Modal from "@/components/shared/Modal";
import { useLocalMedia } from "@/lib/useLocalMedia";
import { api, ApiClientError } from "@/lib/api";
import type { ChatMessage, Meeting, Participant } from "@/types";

const POLL_PARTICIPANTS_MS = 3_000;
const POLL_CHAT_MS = 3_000;

type Panel = "none" | "participants" | "chat";

export default function MeetingRoomPage() {
  const params       = useParams<{ code: string }>();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const code         = decodeURIComponent(params.code);

  const isHostEntry  = searchParams.get("host") === "true";
  const pidFromQuery = searchParams.get("pid");
  const nameFromQuery= searchParams.get("name");
  const initialMuted   = searchParams.get("muted")    === "1";
  const initialVideoOff = searchParams.get("videoOff") === "1";

  const [meeting, setMeeting]           = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [localPid, setLocalPid]         = useState<number | null>(
    pidFromQuery ? Number(pidFromQuery) : null,
  );
  const [localName, setLocalName] = useState(nameFromQuery ?? "");
  const [isHost, setIsHost]             = useState(isHostEntry);
  const [panel, setPanel]               = useState<Panel>("none");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(!nameFromQuery && !isHostEntry);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [unreadCount, setUnreadCount]   = useState(0);

  // ── Screen share state ───────────────────────────────────────────────────
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenError, setScreenError]   = useState<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef  = useRef<HTMLVideoElement | null>(null);

  // ── Recording state ──────────────────────────────────────────────────────
  const [isRecording, setIsRecording]     = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showRecordingBanner, setShowRecordingBanner] = useState(false);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Floating reactions ───────────────────────────────────────────────────
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const joinedRef = useRef(false);

  const { videoRef, isMuted, isVideoOn, toggleMute, toggleVideo, stopAllTracks } =
    useLocalMedia({ initialMuted, initialVideoOff });

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const meetingData = await api.getMeeting(code);
        if (cancelled) return;
        setMeeting(meetingData);

        if (isHostEntry) {
          const existing = await api.getParticipants(code);
          if (!cancelled) {
            setParticipants(existing);
            const hostP = existing.find((p) => p.is_host);
            if (hostP) {
              setLocalPid(hostP.id);
              if (localName && hostP.display_name !== localName) {
                // Host changed name in NewMeetingModal
                api.updateParticipant(code, hostP.id, { display_name: localName }).catch(() => {});
              } else if (!localName) {
                // Inherit name from backend (e.g. started from Meetings tab)
                setLocalName(hostP.display_name);
              }
            }
            setIsHost(true);
          }
        } else if (pidFromQuery) {
          const existing = await api.getParticipants(code);
          if (!cancelled) {
            setParticipants(existing);
            const me = existing.find((p) => p.id === Number(pidFromQuery));
            if (me) {
              if (me.is_host) setIsHost(true);
              if (!localName) setLocalName(me.display_name);
            }
          }
        }
        joinedRef.current = true;
      } catch (err) {
        if (!cancelled)
          setLoadError(err instanceof ApiClientError ? err.message : "Couldn't load this meeting.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ── Poll participants ─────────────────────────────────────────────────────
  const pollParticipants = useCallback(async () => {
    try { setParticipants(await api.getParticipants(code)); }
    catch { /* skip */ }
  }, [code]);

  useEffect(() => {
    if (loading) return;
    pollParticipants();
    const id = setInterval(pollParticipants, POLL_PARTICIPANTS_MS);
    return () => clearInterval(id);
  }, [pollParticipants, loading]);

  // ── Poll chat ─────────────────────────────────────────────────────────────
  const pollChat = useCallback(async () => {
    try {
      const data = await api.getChatMessages(code);
      setChatMessages((prev) => {
        if (panel !== "chat" && data.length > prev.length)
          setUnreadCount((n) => n + (data.length - prev.length));
        return data;
      });
    } catch { /* skip */ }
  }, [code, panel]);

  useEffect(() => {
    if (loading) return;
    pollChat();
    const id = setInterval(pollChat, POLL_CHAT_MS);
    return () => clearInterval(id);
  }, [pollChat, loading]);

  useEffect(() => {
    if (panel === "chat") setUnreadCount(0);
  }, [panel]);

  // ── Sync mute/video to backend ────────────────────────────────────────────
  useEffect(() => {
    if (!localPid) return;
    api.updateParticipant(code, localPid, { is_muted: isMuted, is_video_on: isVideoOn }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted, isVideoOn]);

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!meeting?.started_at) return;
    const start = new Date(meeting.started_at).getTime();
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [meeting?.started_at]);

  // ── Screen share ─────────────────────────────────────────────────────────
  async function handleToggleScreenShare() {
    if (isScreenSharing) {
      // Stop screen share
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      setScreenError(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = stream;

        // Attach to the hidden video element
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        // When user stops from browser's built-in "Stop sharing" button
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        });

        setIsScreenSharing(true);
        setScreenError(null);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "NotAllowedError") {
          setScreenError("Couldn't start screen sharing. Check browser permissions.");
        }
      }
    }
  }

  // ── Recording ────────────────────────────────────────────────────────────
  async function handleToggleRecord() {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
    } else {
      try {
        // Record the screen if sharing, otherwise the camera
        const stream =
          screenStreamRef.current ??
          (videoRef.current?.srcObject instanceof MediaStream
            ? videoRef.current.srcObject
            : null);

        if (!stream) {
          // Fall back to display capture for recording
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          startRecording(displayStream, true);
          return;
        }
        startRecording(stream, false);
      } catch {
        // User denied — silently skip
      }
    }
  }

  function startRecording(stream: MediaStream, stopStreamAfter: boolean) {
    recordedChunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      setIsRecording(false);
      setRecordingSeconds(0);
      setShowRecordingBanner(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (stopStreamAfter) stream.getTracks().forEach((t) => t.stop());

      // Auto-download the recording
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href    = url;
        a.download = `meeting-${code}-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    };

    recorder.start(1000); // collect data every second
    setIsRecording(true);
    setShowRecordingBanner(true);
    setRecordingSeconds(0);

    // Count up recording timer
    recordTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    // Auto-hide the "Recording started" banner after 4 s
    setTimeout(() => setShowRecordingBanner(false), 4000);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Floating reactions ────────────────────────────────────────────────────
  function handleReaction(reaction: FloatingReaction) {
    setReactions((prev) => [...prev, reaction]);
    // Remove after animation completes (2.4 s)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
    }, 2500);
  }

  // ── Leave / end ───────────────────────────────────────────────────────────
  async function handleLeave() {
    stopAllTracks();
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    try {
      if (localPid) await api.leaveMeeting(code, localPid);
      if (isHost)   await api.endMeeting(code);
    } catch { /* best-effort */ }
    router.push("/");
  }

  // ── Host controls ─────────────────────────────────────────────────────────
  async function handleMuteToggle(p: Participant) {
    try {
      const updated = await api.updateParticipant(code, p.id, { is_muted: !p.is_muted });
      setParticipants((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch { /* poll reconciles */ }
  }

  async function handleRemove(p: Participant) {
    try {
      await api.removeParticipant(code, p.id);
      setParticipants((prev) => prev.filter((x) => x.id !== p.id));
    } catch { /* poll reconciles */ }
  }

  async function handleSend(message: string) {
    try {
      const msg = await api.postChatMessage(code, localName, message);
      setChatMessages((prev) => [...prev, msg]);
    } catch { /* user can retry */ }
  }

  async function handleRename(newName: string) {
    if (!newName.trim() || !localPid) return;
    setLocalName(newName.trim());
    // Update display_name on participant record
    try {
      await api.updateParticipant(code, localPid, { display_name: newName.trim() });
    } catch { /* best effort */ }
  }

  async function handleGuestJoin(n: string) {
    try {
      const res = await api.joinMeeting(code, {
        display_name: n,
        is_muted: isMuted,
        is_video_on: isVideoOn,
      });
      setLocalPid(res.participant_id);
      setLocalName(n);
      setShowRenameModal(false);
      pollParticipants();
    } catch {
      alert("Failed to join meeting. Please check your connection.");
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--zoom-meeting-bg)" }}>
        <div className="flex items-center" style={{ gap: 12, color: "rgba(255,255,255,0.60)" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Joining meeting…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (loadError || !meeting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center" style={{ background: "var(--zoom-meeting-bg)" }}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "rgba(224,40,40,0.15)" }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>This meeting isn&apos;t available</p>
          <p style={{ marginTop: 4, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>{loadError}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          style={{ borderRadius: 8, background: "var(--zoom-blue)", padding: "10px 24px", fontSize: 14, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--zoom-blue-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--zoom-blue)")}
        >
          Back to home
        </button>
      </div>
    );
  }

  // ── Main meeting room ─────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--zoom-meeting-bg)" }}>

      {/* ── Recording started banner ── */}
      {showRecordingBanner && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "rgba(240,68,56,0.92)",
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.40)",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "recBlink 1s infinite" }} />
          Recording started — file will download when you stop
        </div>
      )}

      {/* ── Screen share error toast ── */}
      {screenError && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "rgba(26,26,26,0.94)",
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 13,
            color: "#FCA5A5",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.40)",
          }}
        >
          {screenError}
          <button
            onClick={() => setScreenError(null)}
            style={{ marginLeft: 8, fontSize: 16, color: "rgba(255,255,255,0.60)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Content row */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Video / screen-share area ── */}
        <div className="relative flex flex-1 flex-col min-w-0" style={{ padding: 16 }}>

          {/* Header */}
          <div style={{ marginBottom: 12, flexShrink: 0 }}>
            <MeetingHeader
              meeting={meeting}
              elapsedSeconds={elapsedSeconds}
              localName={localName}
              onRename={handleRename}
            />
          </div>

          {/* Video area — shows screen share if active, else gallery */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            {isScreenSharing ? (
              <ScreenShareView
                screenVideoRef={screenVideoRef}
                participants={participants}
                localParticipantId={localPid}
                localVideoRef={videoRef}
                localVideoOn={isVideoOn}
                onStopShare={handleToggleScreenShare}
              />
            ) : (
              <VideoGrid
                participants={participants}
                localParticipantId={localPid}
                localVideoRef={videoRef}
                localVideoOn={isVideoOn}
              />
            )}

            {/* Floating emoji reactions */}
            {reactions.map((r) => (
              <span
                key={r.id}
                className="reaction-float"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </span>
            ))}
          </div>

          {/* Control bar */}
          <div className="flex shrink-0 items-center justify-center" style={{ marginTop: 12, position: "relative" }}>
            <ControlBar
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              isRecording={isRecording}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={handleToggleScreenShare}
              onToggleRecord={handleToggleRecord}
              onReaction={handleReaction}
              onToggleParticipants={() => setPanel((p) => (p === "participants" ? "none" : "participants"))}
              onToggleChat={() => setPanel((p) => (p === "chat" ? "none" : "chat"))}
              onLeave={() => setShowLeaveModal(true)}
              participantCount={participants.filter((p) => !p.left_at).length}
              unreadCount={unreadCount}
              panelOpen={panel}
              meetingCode={code}
              recordingSeconds={recordingSeconds}
            />
          </div>
        </div>

        {/* Side panels */}
        {panel === "participants" && (
          <ParticipantsPanel
            participants={participants}
            isHost={isHost}
            localParticipantId={localPid}
            onClose={() => setPanel("none")}
            onMuteToggle={handleMuteToggle}
            onRemove={handleRemove}
          />
        )}
        {panel === "chat" && (
          <ChatPanel
            messages={chatMessages}
            currentUserName={localName}
            onClose={() => setPanel("none")}
            onSend={handleSend}
          />
        )}
      </div>

      {/* Leave modal */}
      <Modal
        open={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title={isHost ? "End meeting for everyone?" : "Leave this meeting?"}
        maxWidth={380}
      >
        <p style={{ fontSize: 13.5, color: "var(--zoom-text-secondary)", marginBottom: 20 }}>
          {isHost
            ? "As the host, ending the meeting will disconnect all participants."
            : "You can rejoin later using the same meeting ID."}
        </p>
        <div className="flex" style={{ gap: 10 }}>
          <button
            onClick={() => setShowLeaveModal(false)}
            style={{ flex: 1, borderRadius: 8, border: "1px solid var(--zoom-border-light)", padding: "10px 0", fontSize: 14, fontWeight: 500, color: "var(--zoom-text-primary)", background: "#fff", cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            Cancel
          </button>
          <button
            onClick={handleLeave}
            style={{ flex: 1, borderRadius: 8, background: "var(--zoom-red-danger)", padding: "10px 0", fontSize: 14, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--zoom-red-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--zoom-red-danger)")}
          >
            {isHost ? "End Meeting" : "Leave"}
          </button>
        </div>
      </Modal>

      {/* ── Name prompt for guests arriving without a name ── */}
      {showRenameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.70)" }}
        >
          <div
            style={{
              width: "100%", maxWidth: 360,
              background: "#1E1F23",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.60)",
              padding: 28,
            }}
          >
            <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              What&apos;s your name?
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 18 }}>
              Other participants will see this name in the meeting.
            </p>
            <NameInput
              onConfirm={handleGuestJoin}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NameInput({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) onConfirm(val.trim()); }}
        placeholder="Enter your display name"
        style={{
          width: "100%",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.07)",
          padding: "10px 12px",
          fontSize: 14,
          color: "#fff",
          outline: "none",
          fontFamily: "inherit",
          marginBottom: 16,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--zoom-blue)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
      />
      <button
        onClick={() => { if (val.trim()) onConfirm(val.trim()); }}
        disabled={!val.trim()}
        style={{
          width: "100%", padding: "10px 0", borderRadius: 8,
          border: "none",
          background: val.trim() ? "var(--zoom-blue)" : "rgba(45,140,255,0.35)",
          color: "#fff",
          fontSize: 14, fontWeight: 600,
          cursor: val.trim() ? "pointer" : "not-allowed",
        }}
      >
        Join Meeting
      </button>
    </>
  );
}

// ─── Screen Share View ─────────────────────────────────────────────────────
function ScreenShareView({
  screenVideoRef,
  participants,
  localParticipantId,
  localVideoRef,
  localVideoOn,
  onStopShare,
}: {
  screenVideoRef: React.RefObject<HTMLVideoElement | null>;
  participants: Participant[];
  localParticipantId: number | null;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  localVideoOn: boolean;
  onStopShare: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, height: "100%" }}>
      {/* Main screen share content */}
      <div style={{ flex: 1, position: "relative", borderRadius: 8, overflow: "hidden", background: "#0D0E10" }}>
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
        {/* Stop sharing banner */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(26,26,26,0.90)",
            borderRadius: 8,
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "#fff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.50)",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
          You are sharing your screen
          <button
            onClick={onStopShare}
            style={{
              marginLeft: 4,
              borderRadius: 6,
              background: "var(--zoom-red-danger)",
              border: "none",
              color: "#fff",
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--zoom-red-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--zoom-red-danger)")}
          >
            Stop Sharing
          </button>
        </div>
      </div>

      {/* Sidebar strip with participant thumbnails */}
      {participants.length > 0 && (
        <div
          style={{
            width: 140,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            overflowY: "auto",
            flexShrink: 0,
          }}
          className="dark-scrollbar"
        >
          {participants.filter((p) => !p.left_at).map((p) => {
            const isLocal = p.id === localParticipantId;
            return (
              <ParticipantThumb
                key={p.id}
                participant={p}
                isLocal={isLocal}
                videoRef={isLocal ? localVideoRef : undefined}
                videoOn={isLocal ? localVideoOn : p.is_video_on}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Small participant thumbnail for screen share view ─────────────────────
import { colorForName, initialsForName } from "@/lib/utils";
import { MicOff } from "lucide-react";

function ParticipantThumb({
  participant,
  isLocal,
  videoRef,
  videoOn,
}: {
  participant: Participant;
  isLocal: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  videoOn: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "16/9",
        borderRadius: 6,
        overflow: "hidden",
        background: "var(--zoom-meeting-tile-bg)",
        flexShrink: 0,
      }}
    >
      {videoOn && isLocal && videoRef ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: colorForName(participant.display_name),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {initialsForName(participant.display_name)}
          </div>
        </div>
      )}
      {/* Name + mute badge */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 4,
          right: 4,
          display: "flex",
          alignItems: "center",
          gap: 3,
          background: "rgba(0,0,0,0.55)",
          borderRadius: 3,
          padding: "2px 5px",
        }}
      >
        {participant.is_muted && <MicOff size={9} style={{ color: "#F04438", flexShrink: 0 }} />}
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "#fff",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {isLocal ? "You" : participant.display_name}
        </span>
      </div>
    </div>
  );
}
