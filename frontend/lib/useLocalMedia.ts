"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Manages the local camera + mic stream.
 *
 * Scope note: this hook handles LOCAL preview only.  True multi-peer video
 * (seeing remote participants' live streams) requires WebRTC + signalling
 * infrastructure that's out of scope — documented in README.  Mute/video
 * toggles work fully and are persisted to the backend participant record.
 */
export interface UseLocalMediaOptions {
  /** Start with microphone muted (default: false) */
  initialMuted?: boolean;
  /** Start with camera off (default: false → camera on) */
  initialVideoOff?: boolean;
}

export function useLocalMedia(opts?: UseLocalMediaOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initMuted   = opts?.initialMuted    ?? false;
  const initVideoOff = opts?.initialVideoOff ?? false;

  const [isMuted, setIsMuted] = useState(initMuted);
  const [isVideoOn, setIsVideoOn] = useState(!initVideoOff);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Attach the stream to the <video> element whenever it mounts / changes
  const attachStream = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Apply initial mute/video preferences to the actual media tracks
        if (initMuted) {
          stream.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        if (initVideoOff) {
          stream.getVideoTracks().forEach((t) => (t.enabled = false));
        }

        attachStream(stream);
        setReady(true);
      } catch {
        if (mounted) {
          setPermissionError(
            "Camera / microphone access denied. You can still join with both off.",
          );
          setIsVideoOn(false);
          setIsMuted(true);
          setReady(true);
        }
      }
    }

    start();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachStream]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      streamRef.current
        ?.getAudioTracks()
        .forEach((track) => (track.enabled = !next));
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOn((prev) => {
      const next = !prev;
      streamRef.current
        ?.getVideoTracks()
        .forEach((track) => (track.enabled = next));
      return next;
    });
  }, []);

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return {
    videoRef,
    isMuted,
    isVideoOn,
    permissionError,
    ready,
    toggleMute,
    toggleVideo,
    stopAllTracks,
  };
}
