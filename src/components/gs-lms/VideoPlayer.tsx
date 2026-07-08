"use client";

import { useState } from "react";
import { gsLmsService } from "@/services/api/gsLmsService";
import { useSubjectLms } from "./SubjectLmsContext";

interface VideoPlayerProps {
  videoUrl: string;
  watched: boolean;
  nodeId: number;
  onWatched?: () => void;
}

/**
 * Renders a responsive video player (HTML5 or YouTube embed) with
 * a "Mark as Watched" action. Uses warm earth-tone design tokens.
 */
export function VideoPlayer({ videoUrl, watched, nodeId, onWatched }: VideoPlayerProps) {
  const [isWatched, setIsWatched] = useState(watched);
  const [marking, setMarking] = useState(false);
  const { subject } = useSubjectLms();

  const isYouTube =
    videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  const getYouTubeEmbedUrl = (url: string): string => {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split(/[?&#]/)[0] ?? "";
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split(/[?&#]/)[0] ?? "";
    } else if (url.includes("/embed/")) {
      videoId = url.split("/embed/")[1]?.split(/[?&#]/)[0] ?? "";
    }
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const handleMarkWatched = async () => {
    setMarking(true);
    try {
      await gsLmsService.markVideoWatched(subject, nodeId);
      setIsWatched(true);
      onWatched?.();
    } catch {
      // Silently handle — user can retry
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] overflow-hidden">
      {/* Video container — 16:9 aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {isYouTube ? (
          <iframe
            className="absolute inset-0 w-full h-full rounded-t-lg"
            src={getYouTubeEmbedUrl(videoUrl)}
            title="Video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            className="absolute inset-0 w-full h-full rounded-t-lg object-contain bg-black"
            src={videoUrl}
            controls
            preload="metadata"
          />
        )}
      </div>

      {/* Action bar */}
      <div className="px-4 py-3 flex items-center justify-end">
        {isWatched ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1d9e75] bg-[#e7f5ee] rounded-md">
            <span aria-hidden="true">✓</span> Watched
          </span>
        ) : (
          <button
            onClick={handleMarkWatched}
            disabled={marking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#13251d] border border-[#dcd5c7] rounded-md hover:bg-[#e7f5ee] hover:text-[#1d9e75] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {marking ? "Marking…" : "Mark as Watched"}
          </button>
        )}
      </div>
    </div>
  );
}
