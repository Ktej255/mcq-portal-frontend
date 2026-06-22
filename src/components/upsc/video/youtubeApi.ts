/**
 * Minimal YouTube IFrame Player API loader + types (Master Plan A1).
 *
 * Loads https://www.youtube.com/iframe_api once (idempotent, SSR-safe) and
 * resolves when `window.YT.Player` is available. We declare only the slice of
 * the API we use so we don't need the `@types/youtube` dependency.
 *
 * The IFrame API is what lets the SOFTWARE drive playback (play/pause/seek) and
 * receive state changes — the basis for stopping precisely at a recall segment
 * boundary and showing our own UI instead of YouTube's pause/end chrome.
 */

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

export interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

export interface YTPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
  };
}

export interface YTNamespace {
  Player: new (el: HTMLElement | string, options: YTPlayerOptions) => YTPlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/**
 * Resolve the YouTube IFrame API namespace, loading the script on first call.
 * Safe to call repeatedly and during SSR (rejects if no `window`).
 */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API unavailable on the server"));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    // Chain any pre-existing ready handler so we don't clobber another loader.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT && window.YT.Player) resolve(window.YT);
      else reject(new Error("YouTube API loaded but YT.Player is missing"));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => reject(new Error("Failed to load the YouTube IFrame API"));
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}
