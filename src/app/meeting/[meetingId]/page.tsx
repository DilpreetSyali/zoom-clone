"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function MeetingRoomPage() {
  const router = useRouter();
  const params = useParams<{ meetingId: string }>();
  const [meeting, setMeeting] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"more" | "reactions" | null>(null);

  useEffect(() => {
    api.getMeeting(params.meetingId).then(setMeeting).catch(() => router.push("/"));
    const tick = () => api.participants(params.meetingId).then(setParticipants).catch(() => {});
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [params.meetingId, router]);

  if (!meeting) {
    return <main className="meetingRoom loadingState">Loading meeting...</main>;
  }

  return (
    <main className="zoomMeeting">
      <div className="zoomStageArea">
        <div className="zoomVideoContainer">
          {/* Top-left Meeting Info Overlay */}
          <div className="zoomMeetingInfo">
            <div className="shieldIcon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#22c55e"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <div className="meetingTitleText">{meeting.title}</div>
            <div className="meetingCodeBadge">{meeting.meeting_code}</div>
          </div>

          <div className="zoomVideoGrid">
            <div className={`zoomVideoTile ${!isVideoOn ? "videoOff" : ""}`}>
              {!isVideoOn ? (
                <div className="zoomTileAvatar">AM</div>
              ) : (
                <div className="videoPlaceholder">
                  <div className="cameraIcon">📷</div>
                  <div className="cameraText">Camera Active</div>
                </div>
              )}
              <div className="zoomTileName">
                Alex Morgan (You) {isMuted && <span className="mutedIcon">🔇</span>}
              </div>
            </div>
          </div>
        </div>

        {showParticipants && (
          <aside className="zoomSidebar">
            <div className="sidebarHeader">
              <h2>Participants ({participants.length + 1})</h2>
              <button className="closeSidebarBtn" onClick={() => setShowParticipants(false)}>✕</button>
            </div>
            <div className="sidebarContent">
              <div className="participantRow">
                <div className="participantAvatar">AM</div>
                <div className="participantDetails">
                  <div className="participantName">Alex Morgan (You)</div>
                  <div className="participantMeta">Host {isMuted ? "• muted" : ""} {!isVideoOn ? "• no video" : ""}</div>
                </div>
              </div>
              {participants.map((p) => (
                <div className="participantRow" key={p.id}>
                  <div className="participantAvatar">{p.display_name.slice(0, 2).toUpperCase()}</div>
                  <div className="participantDetails">
                    <div className="participantName">{p.display_name}</div>
                    <div className="participantMeta">{p.is_host ? "Host" : "Guest"}{p.is_muted ? " • muted" : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {showChat && (
          <aside className="zoomSidebar">
            <div className="sidebarHeader">
              <h2>Meeting Chat</h2>
              <button className="closeSidebarBtn" onClick={() => setShowChat(false)}>✕</button>
            </div>
            <div className="chatBox">
              <div className="chatMessage">
                <span className="chatSender">System</span>
                <p>Welcome to the meeting room!</p>
              </div>
            </div>
            <div className="chatInputArea">
              <input type="text" placeholder="Type a message..." className="chatInput" />
            </div>
          </aside>
        )}
      </div>

      <div className="controlBarWrapper">
        <div className="controlBar">
          <button className="controlBtn" onClick={() => setIsMuted(!isMuted)}>
            <div className={`iconWrapper ${isMuted ? "dangerText" : ""}`}>
              {isMuted ? (
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              )}
            </div>
            <span className={isMuted ? "dangerText" : ""}>{isMuted ? "Unmute" : "Mute"}</span>
          </button>
          <button className="controlBtn" onClick={() => setIsVideoOn(!isVideoOn)}>
            <div className={`iconWrapper ${!isVideoOn ? "dangerText" : ""}`}>
              {!isVideoOn ? (
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 17.16V6.84A2 2 0 0 0 19 5H7.76M3.56 3.56A2 2 0 0 0 2 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.44-.56"></path><path d="M23 7l-7 5 7 5V7z"></path></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              )}
            </div>
            <span className={!isVideoOn ? "dangerText" : ""}>{isVideoOn ? "Stop Video" : "Start Video"}</span>
          </button>
          
          <div className="barDivider"></div>

          <button className={`controlBtn ${showParticipants ? "activeBtn" : ""}`} onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}>
            <div className="iconWrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <div className="badgeCount">2</div>
            </div>
            <span>Participants</span>
          </button>
          <button className={`controlBtn ${showChat ? "activeBtn" : ""}`} onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}>
            <div className="iconWrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <span>Chat</span>
          </button>
          <button className={`controlBtn ${isSharing ? "activeBtn text-green-500" : ""}`} onClick={() => setIsSharing(!isSharing)}>
            <div className="iconWrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><polyline points="15 10 12 7 9 10"></polyline><line x1="12" y1="7" x2="12" y2="13"></line></svg>
            </div>
            <span>Share Screen</span>
          </button>
          <button className={`controlBtn ${isRecording ? "activeBtn text-red-500" : ""}`} onClick={() => setIsRecording(!isRecording)}>
            <div className="iconWrapper">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
            </div>
            <span>Record</span>
          </button>
          
          <div className="relativeMenuWrapper">
            <button className={`controlBtn ${activeMenu === "reactions" ? "activeBtn" : ""}`} onClick={() => setActiveMenu(activeMenu === "reactions" ? null : "reactions")}>
              <div className="iconWrapper">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line><path d="M16 5h6"></path><path d="M19 2v6"></path></svg>
              </div>
              <span>Reactions</span>
            </button>
            {activeMenu === "reactions" && (
              <div className="popupMenu topMenu flexRow">
                <button onClick={() => setActiveMenu(null)}>👏</button>
                <button onClick={() => setActiveMenu(null)}>👍</button>
                <button onClick={() => setActiveMenu(null)}>😂</button>
                <button onClick={() => setActiveMenu(null)}>🎉</button>
              </div>
            )}
          </div>

          <div className="relativeMenuWrapper">
            <button className={`controlBtn ${activeMenu === "more" ? "activeBtn" : ""}`} onClick={() => setActiveMenu(activeMenu === "more" ? null : "more")}>
              <div className="iconWrapper">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
              </div>
              <span>More</span>
            </button>
            {activeMenu === "more" && (
              <div className="popupMenu topMenu">
                <button className="menuItem" onClick={() => setActiveMenu(null)}>Settings</button>
                <button className="menuItem" onClick={() => setActiveMenu(null)}>Report Issue</button>
                <button className="menuItem" onClick={() => setActiveMenu(null)}>Copy Invite Link</button>
              </div>
            )}
          </div>

          <div className="barDivider"></div>

          <button className="leaveBtn" onClick={() => router.push("/")}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6, display: 'inline-block'}}><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-7-7 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
            Leave
          </button>
        </div>
      </div>
    </main>
  );
}
