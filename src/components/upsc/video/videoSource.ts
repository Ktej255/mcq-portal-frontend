/**
 * Video source resolution for the UPSC learning surfaces (Master Plan A1).
 *
 * A single `video_ref` string (stored on the backend `VideoSegment.video_ref`,
 * "object-storage key / URL") is resolved into a typed source so the player can
 * pick the right backend WITHOUT the call sites caring how a clip is hosted.
 * This is the seam that keeps the long-vs-short hosting decision pluggable:
 *
 *   - **Long videos** (lectures, recall segments) → hosted unlisted on YouTube,
 *     played via the IFrame API with software control + white-label overlay.
 *   - **Short clips (~20–30s)** → self-hosted files served directly to a native
 *     `<video>` element (no YouTube chrome/overhead).
 *
 * Supported `video_ref` formats (case-insensitive prefixes):
 *   - `youtube:<id-or-url>`     → YouTube long video
 *   - a youtube.com / youtu.be URL → YouTube long video
 *   - `direct:<url>`            → self-hosted/direct file
 *   - any other http(s) URL     → direct file
 *   - a bare object-storage key (e.g. `seed/river-erosion-1.mp4`)
 *                               → direct file, resolved against
 *                                 `NEXT_PUBLIC_MEDIA_BASE_URL` when set
 *   - null / empty              → `none` (player shows an honest empty state)
 */

export type VideoSource =
  | { kind: "youtube"; videoId: string; ref: string }
  | { kind: "direct"; url: string; ref: string }
  | { kind: "none" };

/**
 * Extract an 11-char YouTube video id from a bare id or any common YouTube URL
 * shape (watch?v=, youtu.be/, /embed/, /shorts/, /v/). Returns null when no id
 * can be found.
 */
export function parseYouTubeId(input: string): string | null {
  const value = (input || "").trim();
  if (!value) return null;

  // Bare id (YouTube ids are 11 chars of [A-Za-z0-9_-]).
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  // Try to parse as a URL and pull the id from known shapes.
  let url: URL | null = null;
  try {
    url = new URL(value);
  } catch {
    url = null;
  }
  if (url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const segs = url.pathname.split("/").filter(Boolean);
      // /embed/<id>, /shorts/<id>, /v/<id>
      const markerIdx = segs.findIndex((s) => s === "embed" || s === "shorts" || s === "v");
      if (markerIdx >= 0 && segs[markerIdx + 1] && /^[A-Za-z0-9_-]{11}$/.test(segs[markerIdx + 1])) {
        return segs[markerIdx + 1];
      }
    }
  }

  // Last-ditch: find an 11-char token after a v= or / boundary.
  const m = value.match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[?&/]|$)/);
  return m ? m[1] : null;
}

/** True when the host (sans www.) is a YouTube domain. */
function isYouTubeUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "youtu.be" ||
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    );
  } catch {
    return false;
  }
}

/** Resolve a bare object-storage key against the configured media base, if any. */
function resolveDirectUrl(ref: string): string {
  if (/^https?:\/\//i.test(ref) || ref.startsWith("/")) return ref;
  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return ref; // relative key; left as-is (dev/local)
  return `${base}/${ref.replace(/^\/+/, "")}`;
}

/**
 * Resolve a stored `video_ref` into a typed {@link VideoSource}. Never throws —
 * an unrecognised/empty ref resolves to `{ kind: "none" }` so the player can
 * render an honest "no video yet" state instead of breaking.
 */
export function resolveVideoSource(ref?: string | null): VideoSource {
  const value = (ref || "").trim();
  if (!value) return { kind: "none" };

  const lower = value.toLowerCase();

  if (lower.startsWith("youtube:")) {
    const rest = value.slice("youtube:".length).trim();
    const id = parseYouTubeId(rest);
    return id ? { kind: "youtube", videoId: id, ref: value } : { kind: "none" };
  }

  if (lower.startsWith("direct:")) {
    const rest = value.slice("direct:".length).trim();
    return rest ? { kind: "direct", url: resolveDirectUrl(rest), ref: value } : { kind: "none" };
  }

  if (isYouTubeUrl(value)) {
    const id = parseYouTubeId(value);
    return id ? { kind: "youtube", videoId: id, ref: value } : { kind: "none" };
  }

  // Any other URL or bare object-storage key → direct file.
  return { kind: "direct", url: resolveDirectUrl(value), ref: value };
}
