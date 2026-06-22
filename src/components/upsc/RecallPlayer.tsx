"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Lightbulb,
  Loader2,
  Mic,
  PlayCircle,
  Square,
} from "lucide-react";

import { NotYetAuthored } from "@/components/upsc/read/NotYetAuthored";
import { VideoPlayer } from "@/components/upsc/video/VideoPlayer";
import { resolveVideoSource } from "@/components/upsc/video/videoSource";
import { useApiConfig } from "@/lib/hooks/useApi";
import {
  optionalService,
  type RecallSegmentOut,
  type RecallTurnResultOut,
} from "@/services/api/optionalService";

/**
 * RecallPlayer — the interactive Recall-LMS surface (spec task 12, R13 / R14).
 *
 * Delivers a lesson as segments; after a segment the student enters Discussion
 * Mode and **speaks** what they understood. The backend transcribes (STT),
 * concept-matches against the segment's author-defined checklist, computes a
 * recall score, and — when below 100% — returns an adaptive Socratic hint
 * toward a missed concept. The student answers the hint; only newly recalled
 * content raises the score (cumulative + monotonic, design Property 3).
 * Verbatim echoes of the lesson never earn recall (anti-gaming, Property 5).
 *
 * Honesty: recall content (video + reviewed concept checklists) is authored
 * separately. When a subject has no segments yet the player shows the shared
 * {@link NotYetAuthored} state rather than fabricating a lesson. The checklist
 * is never shown up front (that would defeat recall); matched/missed concepts
 * are revealed only as feedback after an attempt (R14.5).
 */

const PALETTE = {
  bg: "#f7f4ee",
  card: "#fffdf8",
  border: "#dcd5c7",
  borderSoft: "#e6dcc2",
  accent: "#1d9e75",
  accentDark: "#1a3a2a",
  ink: "#13251d",
  muted: "#5d675f",
  sand: "#8a7a52",
};

type LoadState = "idle" | "loading" | "loaded" | "error";
type RecordStatus = "idle" | "recording" | "scoring";

export interface RecallPlayerProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** Optional callback to close/return from the recall player. */
  onClose?: () => void;
}

export function RecallPlayer({ slug, onClose }: RecallPlayerProps) {
  const { isLoaded, isSignedIn } = useApiConfig();

  const [segments, setSegments] = useState<RecallSegmentOut[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState<RecallSegmentOut | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [latest, setLatest] = useState<RecallTurnResultOut | null>(null);

  const [recordStatus, setRecordStatus] = useState<RecordStatus>("idle");
  const [recordError, setRecordError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setState("loading");
    setError(null);
    optionalService
      .getRecallSegments(slug)
      .then((res) => {
        if (cancelled) return;
        setSegments(res.segments);
        setState("loaded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(messageFromError(err));
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, isLoaded, isSignedIn]);

  const openSegment = useCallback((segment: RecallSegmentOut) => {
    setActive(segment);
    setSessionId(null);
    setLatest(null);
    setRecordError(null);
  }, []);

  const closeSegment = useCallback(() => {
    setActive(null);
    setSessionId(null);
    setLatest(null);
    setRecordError(null);
  }, []);

  /** Submit the recorded recall: start a session or respond to a hint. */
  const submitRecall = useCallback(
    async (blob: Blob) => {
      if (!active) return;
      setRecordStatus("scoring");
      try {
        const result =
          sessionId == null
            ? await optionalService.startRecall(active.segment_id, blob)
            : await optionalService.respondRecall(sessionId, blob);
        setSessionId(result.session_id);
        setLatest(result);
      } catch {
        setRecordError(
          "We couldn't score that recall. Please try recording again.",
        );
      } finally {
        setRecordStatus("idle");
      }
    },
    [active, sessionId],
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setRecordError(null);
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    const hasRecorder = typeof window !== "undefined" && "MediaRecorder" in window;
    if (!md || typeof md.getUserMedia !== "function" || !hasRecorder) {
      setRecordError("Voice recording isn't available in this browser.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await md.getUserMedia({ audio: true });
    } catch {
      setRecordError("Microphone access is blocked. Allow mic permission to speak your recall.");
      return;
    }
    try {
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setRecordStatus("idle");
        if (blob.size > 0) void submitRecall(blob);
      };
      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      setRecordStatus("recording");
      recorder.start();
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setRecordError("Voice recording couldn't start. Please try again.");
    }
  }, [submitRecall]);

  const toggleRecording = useCallback(() => {
    if (recordStatus === "recording") stopRecording();
    else if (recordStatus === "idle") void startRecording();
  }, [recordStatus, startRecording, stopRecording]);

  return (
    <main
      data-testid="recall-player"
      data-slug={slug}
      className="min-h-screen text-[#13251d]"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header */}
        <section
          className="rounded-2xl border p-5 shadow-sm md:p-6"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          <button
            type="button"
            onClick={active ? closeSegment : onClose}
            data-testid="recall-player-back"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {active ? "All segments" : "Back to subject"}
          </button>
          <div className="mt-3 flex items-center gap-2">
            <PlayCircle className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Recall LMS · Watch · Speak · Recall
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
            {active ? active.title : "Interactive recall"}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: PALETTE.muted }}>
            Watch a segment, then speak what you understood. We measure what you actually recall —
            not what you watched — and nudge you toward what you missed.
          </p>
        </section>

        {state === "loading" ? <LoadingPanel /> : null}
        {state === "error" && error ? <ErrorPanel message={error} /> : null}

        {state === "loaded" && !active ? (
          segments.length > 0 ? (
            <section data-testid="recall-segments" className="flex flex-col gap-3">
              {segments.map((seg) => (
                <SegmentRow key={seg.segment_id} segment={seg} onOpen={() => openSegment(seg)} />
              ))}
            </section>
          ) : (
            <NotYetAuthored
              testid="recall-player-not-authored"
              message="Recall lessons (segmented video + concept checklists) for this subject arrive in a later step."
            />
          )
        ) : null}

        {active ? (
          <SegmentStage
            segment={active}
            recordStatus={recordStatus}
            recordError={recordError}
            latest={latest}
            onToggleRecord={toggleRecording}
            onDismissError={() => setRecordError(null)}
          />
        ) : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Segment list row
// ---------------------------------------------------------------------------

function SegmentRow({
  segment,
  onOpen,
}: {
  segment: RecallSegmentOut;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="recall-segment-row"
      data-segment-id={segment.segment_id}
      onClick={onOpen}
      className="flex items-center gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm transition-colors hover:border-[#1d9e75] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <PlayCircle className="h-5 w-5 shrink-0 text-[#1d9e75]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black tracking-tight text-[#13251d]">
          {segment.title}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8a7a52]">
          {segment.concept_count} concept{segment.concept_count === 1 ? "" : "s"} to recall
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#1d9e75]" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Segment stage — video placeholder + discussion mode + result
// ---------------------------------------------------------------------------

function SegmentStage({
  segment,
  recordStatus,
  recordError,
  latest,
  onToggleRecord,
  onDismissError,
}: {
  segment: RecallSegmentOut;
  recordStatus: RecordStatus;
  recordError: string | null;
  latest: RecallTurnResultOut | null;
  onToggleRecord: () => void;
  onDismissError: () => void;
}) {
  const isRecording = recordStatus === "recording";
  const isScoring = recordStatus === "scoring";
  const complete = latest?.complete ?? false;

  return (
    <>
      {/* Video segment — two-tier seam (YouTube long / direct short). Falls back
          to an honest empty state when no video_ref is authored yet. */}
      <section data-testid="recall-video">
        <VideoPlayer
          source={resolveVideoSource(segment.video_ref)}
          title={segment.title}
          emptyMessage="Segmented video for this recall lesson is being set up."
        />
      </section>

      {/* Discussion Mode */}
      <section
        data-testid="recall-discussion"
        className="rounded-2xl border p-5 shadow-sm md:p-6"
        style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
      >
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4" style={{ color: PALETTE.accent }} />
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
            Discussion mode
          </p>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#31443a]">
          {latest?.hint
            ? "Answer the hint below in your own words."
            : "In your own words, speak everything you understood from this segment."}
        </p>

        {latest?.hint ? (
          <div
            data-testid="recall-hint"
            className="mt-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "#e7d59a", backgroundColor: "#fdfae8", color: "#7a6a1e" }}
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#b99f1f]" />
            <span>{latest.hint}</span>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            data-testid="recall-mic"
            data-recording={isRecording ? "true" : "false"}
            onClick={onToggleRecord}
            disabled={isScoring || complete}
            aria-pressed={isRecording}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40 disabled:cursor-not-allowed disabled:opacity-50 ${
              isRecording
                ? "border-[#c0392b] bg-[#fdecea] text-[#a5281b]"
                : "border-[#1d9e75] bg-[#e7f5ee] text-[#085041] hover:bg-[#1d9e75] hover:text-white"
            }`}
          >
            {isScoring ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scoring…
              </>
            ) : isRecording ? (
              <>
                <Square className="h-3.5 w-3.5" /> Stop &amp; score
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" /> {latest ? "Record answer" : "Record recall"}
              </>
            )}
          </button>
          {complete ? (
            <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.1em] text-[#085041]">
              <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" /> Fully recalled
            </span>
          ) : null}
        </div>

        {recordError ? (
          <div
            data-testid="recall-record-error"
            role="alert"
            aria-live="assertive"
            className="mt-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "#e7c79a", backgroundColor: "#fdf6ea", color: "#7a5a1e" }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#b9831f]" />
            <span>{recordError}</span>
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss recording message"
              className="ml-auto text-[#7a5a1e]/70 hover:text-[#7a5a1e]"
            >
              ×
            </button>
          </div>
        ) : null}
      </section>

      {/* Result */}
      {latest ? <RecallResult result={latest} /> : null}
    </>
  );
}

function RecallResult({ result }: { result: RecallTurnResultOut }) {
  const percent = Math.max(0, Math.min(100, result.recall_percent));
  return (
    <section
      data-testid="recall-result"
      data-recall-score={result.recall_score}
      data-complete={result.complete ? "true" : "false"}
      className="rounded-2xl border p-5 shadow-sm md:p-6"
      style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.card }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-black tracking-tight text-[#13251d]">Recall score</h2>
        <p data-testid="recall-score-percent" className="text-3xl font-black leading-none text-[#085041]">
          {percent.toFixed(0)}%
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "#ece4d3" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: PALETTE.accent }}
        />
      </div>

      {/* Explainability: recalled vs missed (R14.5) */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div data-testid="recall-matched">
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#085041]">
            Recalled
          </p>
          {result.matched.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {result.matched.map((m) => (
                <li key={m.concept} className="flex items-start gap-2 text-sm font-semibold text-[#31443a]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d9e75]" />
                  <span>
                    {m.concept}
                    {m.status === "partial" ? (
                      <span className="ml-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#b9831f]">
                        partial
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs font-semibold text-[#8a7a52]">Nothing recalled yet.</p>
          )}
        </div>
        <div data-testid="recall-missed">
          <p className="mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a7a52]">
            Still to recall
          </p>
          {result.missed.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {result.missed.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm font-semibold text-[#5d675f]">
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#cdbf9f]" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs font-semibold text-[#085041]">Everything recalled — great work.</p>
          )}
        </div>
      </div>

      {result.stt_low_confidence ? (
        <p
          data-testid="recall-low-confidence"
          className="mt-3 rounded-lg border border-dashed border-[#cdbf9f] bg-[#faf6ee] px-3 py-2 text-xs font-semibold text-[#8a7a52]"
        >
          We weren&apos;t fully sure of that transcript. If it misread you, just record again.
        </p>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Loading / error
// ---------------------------------------------------------------------------

function LoadingPanel() {
  return (
    <div
      data-testid="recall-player-loading"
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-10 text-sm font-bold text-[#5d675f]"
    >
      <Loader2 className="h-4 w-4 animate-spin text-[#1d9e75]" />
      Loading recall lessons…
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      data-testid="recall-player-error"
      className="flex items-start gap-2 rounded-2xl border border-[#e6c2c2] bg-[#fbf0ee] px-4 py-5 text-sm font-semibold text-[#8a4b52]"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function messageFromError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr.response?.status === 404) {
      return "Recall lessons aren't available for this subject yet.";
    }
    if (anyErr.message) return anyErr.message;
  }
  return "Couldn't load recall lessons. Please try again.";
}

export default RecallPlayer;
