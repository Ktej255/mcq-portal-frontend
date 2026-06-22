"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  PenLine,
  Send,
  Sparkles,
  Square,
  Target,
  Upload,
  X,
} from "lucide-react";

import { optionalService } from "@/services/api/optionalService";
import type {
  AnswerEvaluationOut,
  EvaluationReportOut,
} from "@/services/api/optionalService";

/**
 * AnswerWorkspace — the student-facing answer-writing surface for an optional
 * subject (spec task 9.1, Phase 1E, R8.1).
 *
 * Lets a student compose a UPSC-style answer as three **distinct, labeled
 * segments** — Introduction, Body, Conclusion (R8.1) — each with its own state
 * and a live word counter, kept together in one local draft object
 * `{ intro, body, conclusion }`. The prompt (a PYQ question and/or a syllabus
 * topic) is shown prominently at the top so the student always writes against a
 * concrete ask.
 *
 * Honesty seam (scope guard): this workspace builds the typed three-part
 * composition (9.1), speak-to-fill (9.2) and handwritten upload (9.3); Task 9.4
 * wires "Submit for evaluation" to the real backend evaluation endpoint and
 * renders the returned report. A report is shown as complete only when the
 * backend marks it complete (no `incomplete_sections`, design Property 6);
 * incomplete reports list exactly the sections that could not be produced and
 * are never presented as complete. A low-confidence spoken/handwritten input
 * that was not reviewed is not auto-graded (design Property 7) — the workspace
 * surfaces an honest "review needed" note instead of a fabricated score.
 *
 * The component keeps the draft in local component state while open; the
 * submitted attempt + report are persisted server-side per student (9.4).
 *
 * Later tasks extend this cleanly:
 * - 9.2 (done) adds a speak-to-fill mic per segment that transcribes via the
 *   backend `SttProvider` and routes low-confidence transcripts through a
 *   review/correct step before they fill the active segment.
 * - 9.3 (done) adds a handwritten-image upload per segment that extracts text
 *   via the backend `OcrProvider` (Gemini-Vision through the shared inference
 *   gateway; deterministic mock in dev/test). Low-confidence (or failed)
 *   extractions never fill silently: the student is informed and offered a
 *   fallback to review/correct, type instead, or re-upload (R9.1/R9.3/R20.1).
 * - 9.4 (done) wires `onSubmit`/inline submit to the real evaluation endpoint
 *   + report rendering + persistence.
 */

const PALETTE = {
  bg: "#f7f4ee",
  card: "#fffdf8",
  border: "#dcd5c7",
  borderSoft: "#e6dcc2",
  accent: "#1d9e75",
  accentDark: "#1a3a2a",
  ink: "#13251d",
  inkSoft: "#31443a",
  muted: "#5d675f",
  sand: "#8a7a52",
};

/**
 * The prompt the workspace writes against. Compatible with the `onSolve(pyq)`
 * seam in {@link PyqExplorer} (a PYQ question) and the
 * `onPractice(topicNodeId, topicTitle)` seam in {@link PracticeBoard} (a
 * syllabus topic). All fields are optional so either source can open it.
 */
export interface AnswerPrompt {
  /** The PYQ / question text to answer (from PyqExplorer's onSolve). */
  questionText?: string;
  /** The syllabus topic node id (from PracticeBoard, or a PYQ's topic). */
  topicNodeId?: number;
  /** The syllabus topic title (from PracticeBoard's onPractice). */
  topicTitle?: string;
  /** The originating PYQ id, when launched from a specific PYQ. */
  pyqId?: number;
}

/**
 * The local three-part draft. Mirrors the backend `AnswerAttempt` structured
 * fields (`intro_text` / `body_text` / `conclusion_text`, R8.1) so Task 9.4 can
 * persist it without reshaping.
 */
export interface AnswerDraft {
  intro: string;
  body: string;
  conclusion: string;
}

export interface AnswerWorkspaceProps {
  /** Subject slug, e.g. "geography". */
  slug: string;
  /** The PYQ / topic prompt to write against. */
  prompt: AnswerPrompt;
  /** Optional callback to close/return from the workspace. */
  onClose?: () => void;
  /**
   * Optional host override for evaluation. When provided, "Submit for
   * evaluation" hands the composed draft to the host (which owns evaluation).
   * When omitted (the default), the workspace evaluates inline via the backend
   * (Task 9.4) and renders the returned report itself.
   */
  onSubmit?: (draft: AnswerDraft) => void;
}

/** Count whitespace-delimited words in a segment (empty/blank → 0). */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/** Append spoken text to an existing segment value, keeping a clean separator. */
function appendText(existing: string, addition: string): string {
  const left = existing.replace(/\s+$/, "");
  const right = addition.trim();
  if (!right) return existing;
  if (!left) return right;
  return `${left} ${right}`;
}

const EMPTY_DRAFT: AnswerDraft = { intro: "", body: "", conclusion: "" };

/**
 * Per-segment speak-to-fill status (Task 9.2):
 * - `idle`        — nothing happening for this segment.
 * - `recording`   — capturing microphone audio for this segment.
 * - `transcribing`— audio sent; awaiting the transcript.
 */
type SpeakStatus = "idle" | "recording" | "transcribing";

/** A pending low-confidence transcript awaiting student review/correct (R8.4/R20.3, R9.3/R20.1). */
interface PendingReview {
  key: keyof AnswerDraft;
  /** Editable text the student can correct before it is used. */
  text: string;
  /** The provider confidence that fell below the threshold. */
  confidence: number;
  threshold: number;
  /** Where the low-confidence text came from — drives the fallback wording. */
  source: "speech" | "ocr";
}

interface SegmentMeta {
  key: keyof AnswerDraft;
  label: string;
  helper: string;
  placeholder: string;
  rows: number;
  testid: string;
}

const SEGMENTS: SegmentMeta[] = [
  {
    key: "intro",
    label: "Introduction",
    helper: "Define the scope and set up your answer in a few lines.",
    placeholder: "Open with context, a definition, or the crux of the demand…",
    rows: 4,
    testid: "answer-section-intro",
  },
  {
    key: "body",
    label: "Body",
    helper: "Build the core argument — dimensions, examples, diagrams in words.",
    placeholder: "Develop the substantive argument with structured points…",
    rows: 12,
    testid: "answer-section-body",
  },
  {
    key: "conclusion",
    label: "Conclusion",
    helper: "Close with a forward-looking, balanced synthesis.",
    placeholder: "Tie the argument together and end on a way-forward note…",
    rows: 4,
    testid: "answer-section-conclusion",
  },
];

export function AnswerWorkspace({ slug, prompt, onClose, onSubmit }: AnswerWorkspaceProps) {
  const [draft, setDraft] = useState<AnswerDraft>(EMPTY_DRAFT);
  // --- Evaluation state (Task 9.4 — R9.2/R9.4/R9.5) ------------------------
  // The persisted evaluation result (report, or a review-required signal).
  const [evaluation, setEvaluation] = useState<AnswerEvaluationOut | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  // Human-readable evaluation error (network / backend failure).
  const [evalError, setEvalError] = useState<string | null>(null);

  // --- Speak-to-fill state (Task 9.2 — R8.2/R8.3/R8.4/R20.3) ---------------
  // Which segment is currently recording/transcribing (only one at a time).
  const [activeSpeakKey, setActiveSpeakKey] = useState<keyof AnswerDraft | null>(null);
  const [speakStatus, setSpeakStatus] = useState<SpeakStatus>("idle");
  // A low-confidence transcript held back for review/correct before it's used.
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  // Human-readable speak-to-fill error (mic permission / unsupported / failed).
  const [speakError, setSpeakError] = useState<string | null>(null);

  // --- Handwriting OCR upload state (Task 9.3 — R9.1/R9.3/R20.1) -----------
  // Which segment is currently extracting (only one at a time).
  const [activeOcrKey, setActiveOcrKey] = useState<keyof AnswerDraft | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "extracting">("idle");
  // Human-readable OCR error (unreadable image / backend unavailable / failed).
  const [ocrError, setOcrError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const setSegment = useCallback((key: keyof AnswerDraft, value: string) => {
    // Editing invalidates any prior evaluation — clear the stale report.
    setEvaluation(null);
    setEvalError(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Append transcribed text into a segment (the spoken transcript joins the draft — R8.3). */
  const fillSegment = useCallback((key: keyof AnswerDraft, text: string) => {
    setEvaluation(null);
    setEvalError(null);
    setDraft((prev) => ({ ...prev, [key]: appendText(prev[key], text) }));
  }, []);

  /** Send recorded audio to the shared STT provider and route by confidence. */
  const transcribe = useCallback(
    async (key: keyof AnswerDraft, blob: Blob) => {
      setSpeakStatus("transcribing");
      try {
        const result = await optionalService.transcribeAudio(slug, blob, {
          vocabularyHint: prompt.topicTitle ?? undefined,
        });
        if (result.low_confidence) {
          // R8.4 / R20.3: do NOT silently commit. Hold the transcript for an
          // explicit review/correct step before it fills the segment.
          setPendingReview({
            key,
            text: result.text,
            confidence: result.confidence,
            threshold: result.threshold,
            source: "speech",
          });
        } else {
          // High confidence: fill directly (still editable — it's a textarea).
          fillSegment(key, result.text);
        }
      } catch {
        setSpeakError(
          "We couldn't transcribe that recording. Please try again, or type your answer instead.",
        );
      } finally {
        setSpeakStatus("idle");
        setActiveSpeakKey(null);
      }
    },
    [slug, prompt.topicTitle, fillSegment],
  );

  /** Stop the active recording; the recorder's onstop kicks off transcription. */
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  /** Begin recording audio for `key`, handling unsupported/permission cases gracefully. */
  const startRecording = useCallback(
    async (key: keyof AnswerDraft) => {
      setSpeakError(null);
      setPendingReview(null);

      // Graceful capability check — never crash; typing stays fully functional.
      const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
      const hasRecorder = typeof window !== "undefined" && "MediaRecorder" in window;
      if (!md || typeof md.getUserMedia !== "function" || !hasRecorder) {
        setSpeakError(
          "Voice input isn't available in this browser. You can keep typing your answer.",
        );
        return;
      }

      let stream: MediaStream;
      try {
        stream = await md.getUserMedia({ audio: true });
      } catch {
        // Permission denied / no device — clear message, keep typing working.
        setSpeakError(
          "Microphone access is blocked. Allow mic permission to speak your answer, or keep typing.",
        );
        return;
      }

      try {
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          chunksRef.current = [];
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          mediaRecorderRef.current = null;
          if (blob.size > 0) {
            void transcribe(key, blob);
          } else {
            setSpeakStatus("idle");
            setActiveSpeakKey(null);
          }
        };
        mediaRecorderRef.current = recorder;
        streamRef.current = stream;
        setActiveSpeakKey(key);
        setSpeakStatus("recording");
        recorder.start();
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        setSpeakError(
          "Voice recording couldn't start. You can keep typing your answer.",
        );
      }
    },
    [transcribe],
  );

  /** Toggle the mic for a segment: start if idle, stop if it's the one recording. */
  const toggleRecording = useCallback(
    (key: keyof AnswerDraft) => {
      if (speakStatus === "recording" && activeSpeakKey === key) {
        stopRecording();
      } else if (speakStatus === "idle") {
        void startRecording(key);
      }
    },
    [speakStatus, activeSpeakKey, startRecording, stopRecording],
  );

  /**
   * Upload a handwritten-answer image for `key` and route by confidence (R9.1).
   * Low-confidence / empty / failed extractions never fill silently — the
   * student is informed and offered the review/correct / type / re-upload
   * fallback (R9.3 / R20.1). Graceful when no file is chosen.
   */
  const extractHandwriting = useCallback(
    async (key: keyof AnswerDraft, file: File | null | undefined) => {
      // No file chosen (dialog cancelled) — do nothing, typing stays intact.
      if (!file) return;

      setOcrError(null);
      setPendingReview(null);
      setActiveOcrKey(key);
      setOcrStatus("extracting");
      try {
        const result = await optionalService.extractHandwriting(slug, file, {
          filename: file.name,
        });
        if (!result.text.trim()) {
          // Nothing legible came back — never fabricate; offer the fallback.
          setOcrError(
            "We couldn't read any text from that image. Try a clearer photo, re-upload, or type your answer instead.",
          );
        } else if (result.low_confidence) {
          // R9.3 / R20.1: do NOT silently use a shaky OCR result. Hold it for an
          // explicit review/correct step (the student can also type or re-upload).
          setPendingReview({
            key,
            text: result.text,
            confidence: result.confidence,
            threshold: result.threshold,
            source: "ocr",
          });
        } else {
          // High confidence: fill directly (still editable — it's a textarea).
          fillSegment(key, result.text);
        }
      } catch {
        setOcrError(
          "We couldn't read that image. Please try a clearer photo, re-upload, or type your answer instead.",
        );
      } finally {
        setOcrStatus("idle");
        setActiveOcrKey(null);
      }
    },
    [slug, fillSegment],
  );

  /** Accept the reviewed (optionally corrected) low-confidence transcript. */
  const acceptReview = useCallback(() => {
    setPendingReview((review) => {
      if (review) fillSegment(review.key, review.text);
      return null;
    });
  }, [fillSegment]);

  /** Discard the low-confidence transcript without touching the segment. */
  const discardReview = useCallback(() => setPendingReview(null), []);

  const wordCounts = useMemo(
    () => ({
      intro: countWords(draft.intro),
      body: countWords(draft.body),
      conclusion: countWords(draft.conclusion),
    }),
    [draft],
  );
  const totalWords = wordCounts.intro + wordCounts.body + wordCounts.conclusion;
  const hasContent = totalWords > 0;

  const handleSubmit = useCallback(async () => {
    if (!hasContent || evaluating) return;
    // Host override seam: when a host wires `onSubmit`, hand it the draft and
    // let the host own evaluation. Otherwise evaluate inline via the backend.
    if (onSubmit) {
      onSubmit(draft);
      return;
    }
    setEvalError(null);
    setEvaluating(true);
    try {
      // The composed three-part draft is submitted as TYPED: by this point any
      // spoken/handwritten input has already passed its own low-confidence
      // review step and is editable text in the workspace (so it is not
      // re-gated here). The backend builds a topic-aware rubric, evaluates, and
      // persists the attempt + report (R9.2/R9.5).
      const result = await optionalService.submitAnswer(slug, {
        mode: "TYPED",
        intro_text: draft.intro || null,
        body_text: draft.body || null,
        conclusion_text: draft.conclusion || null,
        topic_node_id: prompt.topicNodeId ?? null,
        question_text: prompt.questionText ?? null,
        pyq_id: prompt.pyqId ?? null,
      });
      setEvaluation(result);
    } catch {
      setEvalError(
        "We couldn't evaluate your answer right now. Please try again in a moment.",
      );
    } finally {
      setEvaluating(false);
    }
  }, [draft, hasContent, evaluating, onSubmit, slug, prompt]);

  const promptLabel =
    prompt.questionText ?? prompt.topicTitle ?? "Compose your answer";

  return (
    <main
      data-testid="answer-workspace"
      data-slug={slug}
      data-pyq-id={prompt.pyqId ?? ""}
      data-topic-node-id={prompt.topicNodeId ?? ""}
      data-total-words={totalWords}
      className="min-h-screen text-[#13251d]"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-5 md:px-8">
        {/* Header + prompt */}
        <section
          className="rounded-2xl border p-5 shadow-sm md:p-6"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              data-testid="answer-workspace-back"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#2e7d4f] hover:text-[#1a3a2a]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <PenLine className="h-4 w-4" style={{ color: PALETTE.accent }} />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
              Answer workspace · Write your answer
            </p>
          </div>

          {/* Prompt shown prominently (R8.1: write against a concrete ask). */}
          <div
            data-testid="answer-prompt"
            className="mt-3 rounded-xl border p-4"
            style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
          >
            <div className="flex flex-wrap items-center gap-2">
              {prompt.topicTitle ? (
                <span
                  data-testid="answer-prompt-topic"
                  className="inline-flex items-center gap-1 rounded-full bg-[#1a3a2a] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white"
                >
                  <Target className="h-3 w-3" /> {prompt.topicTitle}
                </span>
              ) : null}
              {prompt.pyqId != null ? (
                <span className="inline-flex items-center rounded-full border border-[#dcd5c7] bg-[#faf6ee] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#31443a]">
                  PYQ
                </span>
              ) : null}
            </div>
            <p
              data-testid="answer-prompt-text"
              className="mt-2 text-base font-bold leading-7 text-[#13251d]"
            >
              {promptLabel}
            </p>
          </div>
        </section>

        {/* Three distinct labeled segments (R8.1) */}
        <section data-testid="answer-segments" className="flex flex-col gap-4">
          {SEGMENTS.map((seg) => (
            <SegmentEditor
              key={seg.key}
              meta={seg}
              value={draft[seg.key]}
              wordCount={wordCounts[seg.key]}
              onChange={(value) => setSegment(seg.key, value)}
              speakStatus={activeSpeakKey === seg.key ? speakStatus : "idle"}
              speakDisabled={
                (speakStatus !== "idle" && activeSpeakKey !== seg.key) ||
                ocrStatus === "extracting"
              }
              onToggleRecord={() => toggleRecording(seg.key)}
              ocrStatus={activeOcrKey === seg.key ? ocrStatus : "idle"}
              ocrDisabled={
                (ocrStatus === "extracting" && activeOcrKey !== seg.key) ||
                speakStatus !== "idle"
              }
              onUploadImage={(file) => extractHandwriting(seg.key, file)}
              review={pendingReview && pendingReview.key === seg.key ? pendingReview : null}
              onReviewChange={(text) =>
                setPendingReview((r) => (r ? { ...r, text } : r))
              }
              onAcceptReview={acceptReview}
              onDiscardReview={discardReview}
            />
          ))}
        </section>

        {/* Speak-to-fill error (mic permission / unsupported / failure) — never
            blocks typing. Assertive so screen readers announce it promptly. */}
        {speakError ? (
          <div
            data-testid="answer-speak-error"
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: "#e7c79a",
              backgroundColor: "#fdf6ea",
              color: "#7a5a1e",
            }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b9831f]" />
            <span>{speakError}</span>
            <button
              type="button"
              onClick={() => setSpeakError(null)}
              aria-label="Dismiss voice input message"
              className="ml-auto text-[#7a5a1e]/70 hover:text-[#7a5a1e]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Handwriting OCR error (unreadable image / backend unavailable /
            failure) — never blocks typing or re-upload. Assertive so screen
            readers announce it promptly (R9.3 / R20.1 fallback). */}
        {ocrError ? (
          <div
            data-testid="answer-ocr-error"
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: "#e7c79a",
              backgroundColor: "#fdf6ea",
              color: "#7a5a1e",
            }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b9831f]" />
            <span>{ocrError}</span>
            <button
              type="button"
              onClick={() => setOcrError(null)}
              aria-label="Dismiss handwriting upload message"
              className="ml-auto text-[#7a5a1e]/70 hover:text-[#7a5a1e]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Footer: total word count + submit seam */}
        <section
          className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm md:p-5"
          style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#1d9e75]" />
            <span
              data-testid="answer-total-words"
              className="text-xs font-black uppercase tracking-[0.12em] text-[#31443a]"
            >
              {totalWords} word{totalWords === 1 ? "" : "s"} total
            </span>
          </div>
          <button
            type="button"
            data-testid="answer-submit"
            onClick={handleSubmit}
            disabled={!hasContent || evaluating}
            aria-busy={evaluating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating…
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Submit for evaluation
              </>
            )}
          </button>
        </section>

        {/* Evaluation error — never blocks editing or resubmission. */}
        {evalError ? (
          <div
            data-testid="answer-eval-error"
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "#e7a39a", backgroundColor: "#fdeeea", color: "#8a2f1e" }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c0392b]" />
            <span>{evalError}</span>
            <button
              type="button"
              onClick={() => setEvalError(null)}
              aria-label="Dismiss evaluation error"
              className="ml-auto text-[#8a2f1e]/70 hover:text-[#8a2f1e]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Evaluation result — the report, or an honest review-required note
            when a low-confidence input was not auto-graded (Property 6 / P7). */}
        {evaluation ? <EvaluationResult result={evaluation} /> : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Segment editor — one labeled textarea + word counter (R8.1)
// ---------------------------------------------------------------------------

function SegmentEditor({
  meta,
  value,
  wordCount,
  onChange,
  speakStatus,
  speakDisabled,
  onToggleRecord,
  ocrStatus,
  ocrDisabled,
  onUploadImage,
  review,
  onReviewChange,
  onAcceptReview,
  onDiscardReview,
}: {
  meta: SegmentMeta;
  value: string;
  wordCount: number;
  onChange: (value: string) => void;
  speakStatus: SpeakStatus;
  speakDisabled: boolean;
  onToggleRecord: () => void;
  ocrStatus: "idle" | "extracting";
  ocrDisabled: boolean;
  onUploadImage: (file: File | null | undefined) => void;
  review: PendingReview | null;
  onReviewChange: (text: string) => void;
  onAcceptReview: () => void;
  onDiscardReview: () => void;
}) {
  // Stable, unique id ties the visible <label> to its textarea (a11y).
  const fieldId = `answer-field-${meta.key}`;
  const helperId = `${fieldId}-helper`;
  const countId = `${fieldId}-count`;
  const reviewId = `${fieldId}-review`;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isRecording = speakStatus === "recording";
  const isTranscribing = speakStatus === "transcribing";
  const isExtracting = ocrStatus === "extracting";

  const micLabel = isRecording
    ? `Stop recording for ${meta.label}`
    : isTranscribing
      ? `Transcribing your ${meta.label} recording`
      : `Speak to fill ${meta.label}`;

  const uploadLabel = isExtracting
    ? `Reading your uploaded ${meta.label} image`
    : `Upload a handwritten answer image for ${meta.label}`;

  const isOcrReview = review?.source === "ocr";

  return (
    <article
      data-testid={meta.testid}
      data-segment={meta.key}
      data-word-count={wordCount}
      className="rounded-2xl border p-4 shadow-sm md:p-5"
      style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={fieldId}
          className="flex items-center gap-1.5 text-sm font-black uppercase tracking-[0.12em] text-[#1a3a2a]"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: PALETTE.accent }}
            aria-hidden="true"
          />
          {meta.label}
        </label>
        <div className="flex items-center gap-2">
          {/* Speak-to-fill control — records into THIS segment (Task 9.2, R8.2). */}
          <button
            type="button"
            data-testid={`${meta.testid}-mic`}
            data-recording={isRecording ? "true" : "false"}
            onClick={onToggleRecord}
            disabled={speakDisabled || isTranscribing}
            aria-label={micLabel}
            aria-pressed={isRecording}
            title={micLabel}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40 disabled:cursor-not-allowed disabled:opacity-40 ${
              isRecording
                ? "border-[#c0392b] bg-[#fdecea] text-[#a5281b]"
                : "border-[#1d9e75] bg-[#e7f5ee] text-[#085041] hover:bg-[#1d9e75] hover:text-white"
            }`}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Transcribing
              </>
            ) : isRecording ? (
              <>
                <Square className="h-3.5 w-3.5" aria-hidden="true" /> Stop
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" aria-hidden="true" /> Speak
              </>
            )}
          </button>
          {/* Handwriting upload — extracts text into THIS segment (Task 9.3, R9.1).
              A hidden file input is triggered by the visible button so we keep
              full control over styling + accessibility. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            data-testid={`${meta.testid}-upload-input`}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              // Reset so re-selecting the same file fires onChange again.
              e.target.value = "";
              onUploadImage(file);
            }}
          />
          <button
            type="button"
            data-testid={`${meta.testid}-upload`}
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrDisabled || isExtracting}
            aria-label={uploadLabel}
            title={uploadLabel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1d9e75] bg-[#e7f5ee] px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Reading
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Upload
              </>
            )}
          </button>
          <span
            id={countId}
            data-testid={`${meta.testid}-count`}
            className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]"
          >
            {wordCount} word{wordCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <p id={helperId} className="mt-1 text-xs font-semibold leading-5 text-[#5d675f]">
        {meta.helper}
      </p>

      {/* Live status for assistive tech while recording/transcribing/reading. */}
      <span data-testid={`${meta.testid}-speak-status`} aria-live="polite" className="sr-only">
        {isRecording
          ? `Recording ${meta.label}. Activate the button again to stop.`
          : isTranscribing
            ? `Transcribing your ${meta.label} recording.`
            : isExtracting
              ? `Reading your uploaded ${meta.label} image.`
              : ""}
      </span>

      <textarea
        id={fieldId}
        data-testid={`${meta.testid}-input`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={meta.rows}
        placeholder={meta.placeholder}
        aria-describedby={`${helperId} ${countId}`}
        className="mt-3 w-full resize-y rounded-xl border border-[#dcd5c7] bg-[#faf6ee] px-3.5 py-3 text-sm font-medium leading-7 text-[#13251d] placeholder:text-[#a99f86] focus:border-[#1d9e75] focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
      />

      {/* Low-confidence review/correct step (R8.4 / R20.3). The transcript is
          shown for the student to confirm or edit BEFORE it fills the segment —
          it is never committed silently. */}
      {review ? (
        <section
          data-testid={`${meta.testid}-review`}
          data-review-source={review.source}
          role="region"
          aria-live="polite"
          aria-label={`Review low-confidence ${
            isOcrReview ? "extracted text" : "transcript"
          } for ${meta.label}`}
          className="mt-3 rounded-xl border p-4"
          style={{ borderColor: "#e7c79a", backgroundColor: "#fdf6ea" }}
        >
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#b9831f]">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Low confidence — please review before using
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#7a5a1e]">
            {isOcrReview ? (
              <>
                We weren&apos;t fully sure we read this handwriting correctly
                (confidence {Math.round(review.confidence * 100)}%, below{" "}
                {Math.round(review.threshold * 100)}%). Edit it below, type your
                own, or re-upload a clearer image before adding it to your{" "}
                {meta.label.toLowerCase()}.
              </>
            ) : (
              <>
                We weren&apos;t fully sure of this transcript (confidence{" "}
                {Math.round(review.confidence * 100)}%, below{" "}
                {Math.round(review.threshold * 100)}%). Edit it if needed, then add
                it to your {meta.label.toLowerCase()}.
              </>
            )}
          </p>
          <label htmlFor={reviewId} className="sr-only">
            Edit the {isOcrReview ? "extracted text" : "transcript"} for {meta.label}
          </label>
          <textarea
            id={reviewId}
            data-testid={`${meta.testid}-review-input`}
            value={review.text}
            onChange={(e) => onReviewChange(e.target.value)}
            rows={3}
            className="mt-2 w-full resize-y rounded-lg border border-[#e7c79a] bg-white px-3 py-2 text-sm font-medium leading-6 text-[#13251d] focus:border-[#b9831f] focus:outline-none focus:ring-2 focus:ring-[#b9831f]/30"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              data-testid={`${meta.testid}-review-accept`}
              onClick={onAcceptReview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1d9e75] bg-[#e7f5ee] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#085041] transition-colors hover:bg-[#1d9e75] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/40"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Use this text
            </button>
            <button
              type="button"
              data-testid={`${meta.testid}-review-discard`}
              onClick={onDiscardReview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd5c7] bg-[#faf6ee] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#7a5a1e] transition-colors hover:bg-[#f0e6d2] focus:outline-none focus:ring-2 focus:ring-[#b9831f]/30"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" /> Discard
            </button>
          </div>
        </section>
      ) : null}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Evaluation result — the report, or an honest review-required note (Task 9.4)
// ---------------------------------------------------------------------------

const REPORT_SECTION_LABELS: Record<string, string> = {
  introduction: "Introduction",
  body: "Body",
  conclusion: "Conclusion",
  content_coverage: "Content coverage",
  examiner_keywords: "Examiner keywords",
  answer_language: "Answer language",
  structure_and_presentation: "Structure & presentation",
  value_addition: "Value addition",
  strengths: "Strengths",
  areas_for_improvement: "Areas for improvement",
  overall_assessment: "Overall assessment",
};

function prettySection(name: string): string {
  return (
    REPORT_SECTION_LABELS[name] ??
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function EvaluationResult({ result }: { result: AnswerEvaluationOut }) {
  // P7: a low-confidence spoken/handwritten draft was NOT auto-graded.
  if (result.review_required || !result.report) {
    return (
      <section
        data-testid="answer-eval-review-required"
        role="status"
        aria-live="polite"
        className="rounded-2xl border p-5 shadow-sm md:p-6"
        style={{ borderColor: "#e7c79a", backgroundColor: "#fdf6ea" }}
      >
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#b9831f]">
          <AlertTriangle className="h-4 w-4" /> Review needed before grading
        </div>
        <h2 className="mt-2 text-lg font-black tracking-tight text-[#7a5a1e]">
          We didn&apos;t grade this yet
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#7a5a1e]">
          {result.message ??
            "The transcribed/extracted text was low-confidence. Review and correct it, then submit again."}
        </p>
      </section>
    );
  }

  return <EvaluationReportView report={result.report} />;
}

function EvaluationReportView({ report }: { report: EvaluationReportOut }) {
  const sectionEntries = Object.entries(report.sections);
  return (
    <section
      data-testid="answer-eval-report"
      data-complete={report.is_complete ? "true" : "false"}
      role="status"
      aria-live="polite"
      className="rounded-2xl border p-5 shadow-sm md:p-6"
      style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.card }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: PALETTE.accent }} />
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">
            Evaluation report
          </p>
        </div>
        {report.overall_score != null ? (
          <span
            data-testid="answer-eval-overall-score"
            className="inline-flex items-center gap-1 rounded-full bg-[#1a3a2a] px-3 py-1 text-xs font-black text-white"
          >
            {Math.round(report.overall_score)}/100
          </span>
        ) : null}
      </div>

      {/* Honesty banner (Property 6): complete only when nothing is missing. */}
      {report.is_complete ? (
        <div
          data-testid="answer-eval-complete-banner"
          className="mt-3 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold"
          style={{ borderColor: PALETTE.borderSoft, backgroundColor: "#eef7f1", color: "#085041" }}
        >
          <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
          Complete report — every section was assessed.
        </div>
      ) : (
        <div
          data-testid="answer-eval-incomplete-banner"
          className="mt-3 rounded-xl border px-3.5 py-2.5 text-sm font-bold"
          style={{ borderColor: "#e7c79a", backgroundColor: "#fdf6ea", color: "#7a5a1e" }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#b9831f]" />
            Incomplete report — some sections could not be produced.
          </div>
          <ul className="mt-1.5 list-disc pl-6 text-xs font-semibold">
            {report.incomplete_sections.map((s) => (
              <li key={s} data-testid={`answer-eval-incomplete-${s}`}>
                {prettySection(s)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Produced sections */}
      <div className="mt-4 flex flex-col gap-3">
        {sectionEntries.map(([name, section]) => (
          <article
            key={name}
            data-testid={`answer-eval-section-${name}`}
            className="rounded-xl border p-4"
            style={{ borderColor: PALETTE.borderSoft, backgroundColor: PALETTE.bg }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-[#1a3a2a]">
                {prettySection(name)}
              </h3>
              {section.score != null ? (
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8a7a52]">
                  {section.score}/10
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-sm font-medium leading-6 text-[#31443a]">
              {section.feedback}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AnswerWorkspace;
