"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Loader2, PlayCircle, PauseCircle, VideoOff } from "lucide-react";

import {
  loadYouTubeApi,
  type YTPlayer,
  type YTPlayerEvent,
} from "@/components/upsc/video/youtubeApi";
import type { VideoSource } from "@/components/upsc/video/videoSource";

/**
 * VideoPlayer — the two-tier video seam (Master Plan A1).
 *
 * Renders the right backend for a resolved {@link VideoSource}:
 *   - `youtube` → IFrame API player, software-controlled, with a white-label
 *     overlay that hides YouTube chrome on pause/end (the related-video grid +
 *     logo) and intercepts clicks so the student stays in our UI.
 *   - `direct`  → native `<video>` (chrome-less) for self-hosted short clips.
 *   - `none`    → an honest "no video yet" panel (no fabrication).
 *
 * The imperative {@link VideoPlayerHandle} lets callers drive playback (e.g.
 * stop at a recall-segment boundary). `onEnded` fires when a clip finishes so
 * surfaces like the RecallPlayer can hand off to Discussion Mode.
 *
 * NOTE: full playback is verified in-browser (Antigravity e2e); this module is
 * type-checked here. YouTube branding cannot be provably reduced to zero for
 * standard embeds, so we cover the surface on pause/end rather than rely on
 * deprecated params alone.
 */

const PALETTE = {
  shell: "#1a3a2a",
  accent: "#1d9e75",
  card: "#fffdf8",
  border: "#dcd5c7",
};

export interface VideoPlayerHandle {
  play(): void;
  pause(): void;
  /** Seek to an absolute time in seconds. */
  seek(seconds: number): void;
  /** Current playback time in seconds (0 when unavailable). */
  getCurrentTime(): number;
}

export interface VideoPlayerProps {
  source: VideoSource;
  title?: string;
  /** Fired once when the clip reaches its end. */
  onEnded?: () => void;
  /** Honest message shown for `kind: "none"` (no authored video yet). */
  emptyMessage?: string;
  className?: string;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { source, title, onEnded, emptyMessage, className },
  ref,
) {
  if (source.kind === "youtube") {
    return (
      <YouTubePlayer ref={ref} videoId={source.videoId} title={title} onEnded={onEnded} className={className} />
    );
  }
  if (source.kind === "direct") {
    return (
      <DirectPlayer ref={ref} url={source.url} title={title} onEnded={onEnded} className={className} />
    );
  }
  return <EmptyVideo message={emptyMessage} className={className} />;
});

// ---------------------------------------------------------------------------
// YouTube (long videos) — white-label overlay
// ---------------------------------------------------------------------------

const YouTubePlayer = forwardRef<VideoPlayerHandle, {
  videoId: string;
  title?: string;
  onEnded?: () => void;
  className?: string;
}>(function YouTubePlayer({ videoId, title, onEnded, className }, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const endedFiredRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [playing, setPlaying] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      seek: (s: number) => playerRef.current?.seekTo(Math.max(0, s), true),
      getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    endedFiredRef.current = false;
    setStatus("loading");

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        playerRef.current = new YT.Player(hostRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            // Strip as much chrome as the platform allows; the overlay covers
            // the rest (logo + related-video grid on pause/end).
            controls: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            fs: 0,
            disablekb: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              if (!cancelled) setStatus("ready");
            },
            onStateChange: (e: YTPlayerEvent) => {
              const s = e.data;
              setPlaying(s === YT.PlayerState.PLAYING);
              if (s === YT.PlayerState.ENDED && !endedFiredRef.current) {
                endedFiredRef.current = true;
                onEnded?.();
              }
            },
            onError: () => {
              if (!cancelled) setStatus("error");
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, onEnded]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing]);

  if (status === "error") {
    return <VideoError className={className} />;
  }

  return (
    <VideoFrame className={className} testid="video-youtube">
      {/* The IFrame API replaces this node with the <iframe>. */}
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />

      {/* Transparent click-catcher: keeps clicks off the YouTube logo/links and
          toggles play/pause through the API instead. */}
      <button
        type="button"
        aria-label={playing ? "Pause video" : "Play video"}
        data-testid="video-overlay"
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full cursor-pointer bg-transparent"
      />

      {/* Branded cover shown whenever NOT playing — hides YouTube's pause/end
          related-video grid and the watermark. */}
      {!playing ? (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white"
          style={{ backgroundColor: PALETTE.shell }}
          data-testid="video-cover"
        >
          {status === "loading" ? (
            <Loader2 className="h-9 w-9 animate-spin opacity-80" />
          ) : (
            <PlayCircle className="h-12 w-12 opacity-90" />
          )}
          {title ? (
            <p className="max-w-[80%] px-6 text-sm font-black tracking-tight">{title}</p>
          ) : null}
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">
            {status === "loading" ? "Loading video" : playing ? "" : "Tap to play"}
          </p>
        </div>
      ) : (
        <PauseAffordance onClick={togglePlay} />
      )}
    </VideoFrame>
  );
});

/** A subtle pause control while playing (since native controls are hidden). */
function PauseAffordance({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Pause video"
      onClick={onClick}
      data-testid="video-pause"
      className="absolute bottom-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65"
    >
      <PauseCircle className="h-5 w-5" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Direct (short, self-hosted clips) — native <video>, chrome-less
// ---------------------------------------------------------------------------

const DirectPlayer = forwardRef<VideoPlayerHandle, {
  url: string;
  title?: string;
  onEnded?: () => void;
  className?: string;
}>(function DirectPlayer({ url, title, onEnded, className }, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      play: () => void videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      seek: (s: number) => {
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, s);
      },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    }),
    [],
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  return (
    <VideoFrame className={className} testid="video-direct">
      <video
        ref={videoRef}
        src={url}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />
      <button
        type="button"
        aria-label={playing ? "Pause video" : "Play video"}
        data-testid="video-overlay"
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full cursor-pointer bg-transparent"
      />
      {!playing ? (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white"
          style={{ backgroundColor: PALETTE.shell }}
          data-testid="video-cover"
        >
          <PlayCircle className="h-12 w-12 opacity-90" />
          {title ? <p className="max-w-[80%] px-6 text-sm font-black tracking-tight">{title}</p> : null}
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-70">Tap to play</p>
        </div>
      ) : (
        <PauseAffordance onClick={togglePlay} />
      )}
    </VideoFrame>
  );
});

// ---------------------------------------------------------------------------
// Shared frame + empty/error states
// ---------------------------------------------------------------------------

function VideoFrame({
  children,
  className,
  testid,
}: {
  children: React.ReactNode;
  className?: string;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className={`relative aspect-video w-full overflow-hidden rounded-2xl border shadow-sm ${className ?? ""}`}
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      {children}
    </div>
  );
}

function EmptyVideo({ message, className }: { message?: string; className?: string }) {
  return (
    <VideoFrame className={className} testid="video-none">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white"
        style={{ backgroundColor: PALETTE.shell }}
      >
        <VideoOff className="h-9 w-9 opacity-70" />
        <p className="max-w-[80%] px-6 text-[11px] font-bold uppercase tracking-[0.12em] opacity-80">
          {message ?? "Video for this lesson isn't available yet."}
        </p>
      </div>
    </VideoFrame>
  );
}

function VideoError({ className }: { className?: string }) {
  return (
    <VideoFrame className={className} testid="video-error">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-white"
        style={{ backgroundColor: PALETTE.shell }}
      >
        <VideoOff className="h-9 w-9 opacity-70" />
        <p className="max-w-[80%] px-6 text-[11px] font-bold uppercase tracking-[0.12em] opacity-80">
          This video couldn&apos;t be loaded. Please try again.
        </p>
      </div>
    </VideoFrame>
  );
}

export default VideoPlayer;
