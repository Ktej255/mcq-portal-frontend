"use client";

import React, { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VSLPlayerProps {
  videoUrl: string;
  funnelId: string;
  triggerThreshold: number;
  sessionId: string | null;
  onWatchUpdate: (percentage: number) => void;
  onAiTrigger: () => void;
}

export function VSLPlayer({
  videoUrl,
  funnelId,
  triggerThreshold,
  sessionId,
  onWatchUpdate,
  onAiTrigger,
}: VSLPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize Video.js player
    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: false,
      muted: true, // Autoplay usually requires muted
      sources: [
        {
          src: videoUrl,
          type: "video/mp4",
        },
      ],
    });

    playerRef.current = player;

    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("volumechange", () => setIsMuted(!!player.muted()));

    // Track progress
    const progressInterval = setInterval(() => {
      if (!player || player.isDisposed()) return;
      const duration = player.duration() || 0;
      const currentTime = player.currentTime() || 0;
      if (duration > 0) {
        const pct = (currentTime / duration) * 100;
        setProgress(pct);
        onWatchUpdate(pct);

        if (pct >= triggerThreshold) {
          onAiTrigger();
        }
      }
    }, 1000);

    player.on("ended", () => {
      onWatchUpdate(100);
      onAiTrigger();
    });

    return () => {
      clearInterval(progressInterval);
      if (player) {
        player.dispose();
      }
    };
  }, [videoUrl, triggerThreshold]);

  // Sync session progress every 5 seconds to DB
  useEffect(() => {
    if (!sessionId || progress === 0) return;

    const syncInterval = setInterval(() => {
      fetch(`/api/v1/vsl/public/sessions/${sessionId}/watch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watch_percentage: progress }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ai_triggered) {
            onAiTrigger();
          }
        })
        .catch((err) => console.error("VSL_PLAYER | Progress sync error:", err));
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [sessionId, progress]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.paused()) {
      player.play().catch((err: any) => console.warn("Player play error:", err));
    } else {
      player.pause();
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    player.muted(!player.muted());
    setIsMuted(player.muted());
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
      {/* Video element */}
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered w-full h-full object-cover"
          playsInline
        />
      </div>

      {/* Sleek Custom Control Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {/* Top bar */}
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-slate-900/70 border border-slate-700/50 backdrop-blur-md text-white hover:bg-slate-800/80 transition-all active:scale-95"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.03c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>

        {/* Big play button centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <button
            onClick={togglePlay}
            className="p-5 rounded-full bg-indigo-600/90 text-white border border-indigo-500 hover:bg-indigo-500 shadow-lg shadow-indigo-500/35 backdrop-blur-sm transition-all active:scale-90"
          >
            {isPlaying ? (
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Custom Progress Bar at the bottom (Seek disabled) */}
        <div className="w-full flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex justify-between items-center text-xs text-slate-300 font-medium px-1">
            <span>{isPlaying ? "Playing..." : "Paused"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900/80 backdrop-blur-sm rounded-full overflow-hidden border border-slate-750">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
