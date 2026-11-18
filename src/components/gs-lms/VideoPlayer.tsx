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

type MediaStatus = "loading" | "ready" | "error";

/**
 * Renders a responsive video player (HTML5 or YouTube embed) with
 * a "Mark as Watched" action. Uses warm earth-tone design tokens.
 */
export function VideoPlayer({ videoUrl, watched, nodeId, onWatched }: VideoPlayerProps) {
  const [isWatched, setIsWatched] = useState(watched);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  // Playback status is recorded against the source it belongs to, so a new clip
  // starts as "loading" without any effect resetting state, and a late event
  // from the previous clip can never describe the current one.
  const [statusBySrc, setStatusBySrc] = useState<{ src: string; status: MediaStatus }>({
    src: videoUrl,
    status: "loading",
  });
  const { subject } = useSubjectLms();

  const isYouTube =
    videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  const mediaStatus: MediaStatus = statusBySrc.src === videoUrl ? statusBySrc.status : "loading";

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
    setMarkError(null);
    try {
      await gsLmsService.markVideoWatched(subject, nodeId);
      setIsWatched(true);
      onWatched?.();
    } catch {
      setMarkError("We couldn't save this video as watched. Please try again.");
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
          <>
            <video
              className="absolute inset-0 w-full h-full rounded-t-lg object-contain bg-black"
              src={videoUrl}
              controls
              preload="metadata"
              onLoadedMetadata={() => setStatusBySrc({ src: videoUrl, status: "ready" })}
              onCanPlay={() => setStatusBySrc({ src: videoUrl, status: "ready" })}
              onError={() => setStatusBySrc({ src: videoUrl, status: "error" })}
            />
            {mediaStatus === "error" ? (
              <div
                role="alert"
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#13251d]/95 px-6 text-center text-white"
              >
                <p className="text-sm font-semibold">Video unavailable</p>
                <p className="text-xs text-white/80">
                  This video could not be loaded. Please try again later.
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Action bar */}
      <div className="px-4 py-3 flex flex-col items-end gap-2">
        {markError ? (
          <div
            role="alert"
            className="flex w-full items-center justify-between gap-3 rounded-md bg-[#fff4e5] px-3 py-2 text-xs text-[#8c5d14]"
          >
            <span>{markError}</span>
            <button
              type="button"
              onClick={handleMarkWatched}
              disabled={marking}
              className="shrink-0 font-semibold underline hover:no-underline disabled:opacity-60"
            >
              Retry
            </button>
          </div>
        ) : null}
        {isWatched ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1d9e75] bg-[#e7f5ee] rounded-md">
            <span aria-hidden="true">✓</span> Watched
          </span>
        ) : (
          <button
            type="button"
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
