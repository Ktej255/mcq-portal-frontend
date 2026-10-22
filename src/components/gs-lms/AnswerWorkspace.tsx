"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  gsAnswerService,
  type AnswerEvalStatus,
  type AnswerCapabilities,
  type EvaluationReportOut,
  type GsPaper,
  type PageUploadOut,
} from "@/services/api/gsAnswerService";

/**
 * GS Mains answer workspace (R9, R10, R11, R12, R14, R15).
 *
 * Presents a Mains PYQ as its GS paper + year + max marks, lets the student
 * either TYPE an answer or UPLOAD handwritten pages, submits for evaluation,
 * polls the background job, and renders the structured report (sections,
 * incomplete sections, marks-normalized score, word count/limit). Surfaces the
 * confidence-gate review prompt for low-confidence handwriting.
 */

interface AnswerWorkspaceProps {
  subject?: string;
  pyqId?: number;
  questionText: string;
  gsPaper?: GsPaper;
  year?: number;
  maxMarks?: number;
  /** Whether the current user may override (evaluator). */
  canOverride?: boolean;
}

const GREEN = "#1d9e75";
const NOT_SET_UP = "Answer checking is not set up yet";

/** The server's `detail` message from a failed request, else the fallback. */
function detailOf(e: unknown, fallback: string): string {
  const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof detail === "string" && detail ? detail : fallback;
}

export function AnswerWorkspace({
  subject = "geography",
  pyqId,
  questionText,
  gsPaper,
  year,
  maxMarks,
  canOverride = false,
}: AnswerWorkspaceProps) {
  const [mode, setMode] = useState<"type" | "upload">("type");
  const [text, setText] = useState("");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [status, setStatus] = useState<AnswerEvalStatus | null>(null);
  const [report, setReport] = useState<EvaluationReportOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload mode state.
  const [pages, setPages] = useState<File[]>([]);
  const [pageResults, setPageResults] = useState<PageUploadOut[]>([]);
  const [typingPage, setTypingPage] = useState<number | null>(null);
  const [typedPageText, setTypedPageText] = useState("");
  const [imagesDeleted, setImagesDeleted] = useState(false);

  // Whether real OCR / answer checking is set up (null while loading).
  const [caps, setCaps] = useState<AnswerCapabilities | null>(null);
  useEffect(() => {
    let cancelled = false;
    gsAnswerService
      .getCapabilities(subject)
      .then((c) => {
        if (!cancelled) setCaps(c);
      })
      .catch(() => {
        // Unknown: leave the form usable; the server still answers honestly.
      });
    return () => {
      cancelled = true;
    };
  }, [subject]);
  const evalDown = caps != null && !caps.evaluation_live;
  const ocrDown = caps != null && !caps.ocr_live;
  const checkingDown = mode === "type" ? evalDown : evalDown || ocrDown;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const beginPolling = useCallback(
    (id: number) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const s = await gsAnswerService.getStatus(subject, id);
          setStatus(s.status);
          if (s.report) setReport(s.report);
          if (["completed", "degraded", "failed", "review_required"].includes(s.status)) {
            stopPolling();
          }
        } catch (e) {
          setError("Could not fetch evaluation status.");
          stopPolling();
        }
      }, 1500);
    },
    [subject, stopPolling],
  );

  useEffect(() => stopPolling, [stopPolling]);

  const submitTyped = async () => {
    setError(null);
    if (!text.trim()) {
      setError("Please write your answer before submitting.");
      return;
    }
    setBusy(true);
    try {
      const ack = await gsAnswerService.submitTyped(subject, {
        raw_text: text,
        pyq_id: pyqId,
        question_text: questionText,
        gs_paper: gsPaper,
        max_marks: maxMarks,
      });
      setAttemptId(ack.attempt_id);
      setStatus(ack.status);
      if (["completed", "degraded"].includes(ack.status)) {
        const rep = await gsAnswerService.getReport(subject, ack.attempt_id);
        setReport(rep);
      } else {
        beginPolling(ack.attempt_id);
      }
    } catch (e) {
      setError(detailOf(e, "Submission failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const submitUpload = async (acknowledgeReview = false) => {
    setError(null);
    if (pages.length === 0) {
      setError("Add at least one page image.");
      return;
    }
    setBusy(true);
    try {
      let id = attemptId;
      if (id == null) {
        const ack = await gsAnswerService.createHandwritten(subject, {
          pyq_id: pyqId,
          question_text: questionText,
          gs_paper: gsPaper,
          max_marks: maxMarks,
        });
        id = ack.attempt_id;
        setAttemptId(id);
      }
      // Upload any pages not saved yet (a retry continues where it stopped).
      let results = pageResults;
      for (let i = results.length; i < pages.length; i++) {
        const r = await gsAnswerService.uploadPage(subject, id, pages[i], i + 1);
        results = [...results, r];
        setPageResults(results);
      }
      if (results.some((r) => r.ocr_status === "failed")) {
        // Pages are saved; the student retries reading them before submitting.
        return;
      }
      const sub = await gsAnswerService.submitAttempt(subject, id, acknowledgeReview);
      setStatus(sub.status);
      if (sub.status === "review_required") {
        // The student must confirm the extracted text before grading.
        return;
      }
      beginPolling(id);
    } catch (e) {
      setError(detailOf(e, "Upload/submission failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const retryPage = async (pageOrder: number, typed?: string) => {
    if (attemptId == null) return;
    setError(null);
    setBusy(true);
    try {
      const r = await gsAnswerService.retryPageOcr(subject, attemptId, pageOrder, typed);
      setPageResults((prev) => prev.map((p) => (p.page_order === pageOrder ? r : p)));
      if (r.ocr_status !== "failed") {
        setTypingPage(null);
        setTypedPageText("");
      }
    } catch (e) {
      setError(detailOf(e, "Could not retry reading this page."));
    } finally {
      setBusy(false);
    }
  };

  const deleteImages = async () => {
    if (attemptId == null) return;
    if (!window.confirm("Delete your uploaded page images? Your answer text and report are kept.")) {
      return;
    }
    setError(null);
    try {
      await gsAnswerService.deletePageImages(subject, attemptId);
      setImagesDeleted(true);
    } catch (e) {
      setError(detailOf(e, "Could not delete the images. Please try again."));
    }
  };

  const failedPages = pageResults.filter((p) => p.ocr_status === "failed");

  return (
    <div className="rounded-2xl border border-[#dcd5c7] bg-[#fffdf8] p-5">
      {/* Header: GS paper + year + marks */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {gsPaper ? (
          <span className="rounded-full bg-[#1d9e75]/12 px-2.5 py-1 text-xs font-bold text-[#1a3a2a]">
            {gsPaper}
          </span>
        ) : null}
        {year ? <span className="text-xs font-semibold text-[#5d675f]">{year}</span> : null}
        {maxMarks ? (
          <span className="ml-auto text-xs font-semibold text-[#5d675f]">{maxMarks} marks</span>
        ) : null}
      </div>
      <p className="mb-4 text-sm font-semibold leading-7 text-[#13251d]">{questionText}</p>

      {checkingDown || (mode === "upload" && ocrDown) ? (
        <p className="mb-3 rounded-lg border border-[#f0d59a] bg-[#fff7e8] p-3 text-sm font-semibold text-[#7a5a12]">
          {NOT_SET_UP}. {mode === "type" ? "Your answer can't be checked right now." : "Handwritten pages can't be read or checked right now."}
        </p>
      ) : null}

      {/* Mode toggle */}
      <div className="mb-3 inline-flex rounded-lg border border-[#dcd5c7] p-0.5">
        {(["type", "upload"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              mode === m ? "bg-[#1d9e75] text-white" : "text-[#5d675f]"
            }`}
          >
            {m === "type" ? "Type answer" : "Upload pages"}
          </button>
        ))}
      </div>

      {mode === "type" ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Write your answer here…"
            className="w-full rounded-lg border border-[#dcd5c7] bg-white p-3 text-sm leading-7 text-[#13251d] focus:border-[#1d9e75] focus:outline-none"
          />
          <button
            onClick={submitTyped}
            disabled={busy || checkingDown}
            className="mt-3 rounded-lg bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#178a65] disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit for evaluation"}
          </button>
        </div>
      ) : (
        <div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => setPages(Array.from(e.target.files ?? []))}
            className="block text-sm text-[#13251d]"
          />
          {pages.length > 0 ? (
            <p className="mt-1 text-xs text-[#5d675f]">{pages.length} page(s) selected (in order)</p>
          ) : null}
          <button
            onClick={() => submitUpload(false)}
            disabled={busy || checkingDown}
            className="mt-3 rounded-lg bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white hover:bg-[#178a65] disabled:opacity-60"
          >
            {busy ? "Uploading…" : failedPages.length > 0 ? "Evaluate" : "Upload & evaluate"}
          </button>

          {pageResults.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {pageResults.map((p) => (
                <li key={p.page_order} className="rounded-lg border border-[#e6dcc2] bg-[#faf6ee] p-2 text-xs text-[#31443a]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">Page {p.page_order}</span>
                    {p.ocr_status === "failed" ? (
                      <>
                        <span className="font-semibold text-[#a23b46]">
                          Saved, but we couldn&apos;t read the handwriting.
                        </span>
                        <button
                          onClick={() => retryPage(p.page_order)}
                          disabled={busy}
                          className="rounded-md bg-[#ef9f27] px-2 py-1 font-semibold text-white disabled:opacity-60"
                        >
                          Retry reading
                        </button>
                        <button
                          onClick={() => setTypingPage(typingPage === p.page_order ? null : p.page_order)}
                          className="rounded-md border border-[#dcd5c7] px-2 py-1 font-semibold text-[#5d675f]"
                        >
                          Type it instead
                        </button>
                      </>
                    ) : (
                      <span className="text-[#1d9e75]">Read</span>
                    )}
                  </div>
                  {typingPage === p.page_order ? (
                    <div className="mt-2">
                      <textarea
                        value={typedPageText}
                        onChange={(e) => setTypedPageText(e.target.value)}
                        rows={5}
                        className="w-full rounded-lg border border-[#dcd5c7] bg-white p-2 text-sm text-[#13251d]"
                      />
                      <button
                        onClick={() => retryPage(p.page_order, typedPageText)}
                        disabled={busy || !typedPageText.trim()}
                        className="mt-1 rounded-md bg-[#1d9e75] px-2 py-1 font-semibold text-white disabled:opacity-60"
                      >
                        Save text for this page
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {error ? <p className="mt-3 text-sm font-semibold text-[#a23b46]">{error}</p> : null}

      {/* Review-required prompt (confidence gate) */}
      {status === "review_required" ? (
        <div className="mt-4 rounded-xl border border-[#f0d59a] bg-[#fff7e8] p-4">
          <p className="text-sm font-semibold text-[#7a5a12]">
            We weren't fully confident reading your handwriting. Please review the extracted text,
            then confirm to evaluate.
          </p>
          <button
            onClick={() => submitUpload(true)}
            className="mt-2 rounded-lg bg-[#ef9f27] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Looks correct — evaluate
          </button>
        </div>
      ) : null}

      {/* Status */}
      {status && !report && status !== "review_required" ? (
        <p className="mt-4 text-sm font-medium text-[#5d675f]">
          Evaluation status: {status.replace("_", " ")}…
        </p>
      ) : null}

      {/* Report */}
      {report ? <ReportView report={report} /> : null}

      {/* Delete stored handwriting images (text + report are kept) */}
      {report && pageResults.length > 0 ? (
        imagesDeleted ? (
          <p className="mt-3 text-xs font-medium text-[#5d675f]">
            Your page images were deleted. Your answer text and report are kept.
          </p>
        ) : (
          <button
            onClick={deleteImages}
            className="mt-3 rounded-lg border border-[#dcd5c7] px-3 py-1.5 text-xs font-semibold text-[#a23b46]"
          >
            Delete my uploaded images
          </button>
        )
      ) : null}
    </div>
  );
}

function ReportView({ report }: { report: EvaluationReportOut }) {
  return (
    <div className="mt-5 rounded-xl border border-[#dcd5c7] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {report.marks_awarded != null && report.max_marks != null ? (
          <span className="text-lg font-black" style={{ color: GREEN }}>
            {report.marks_awarded} / {report.max_marks}
          </span>
        ) : null}
        {report.word_count != null ? (
          <span className="text-xs text-[#5d675f]">
            {report.word_count} words
            {report.word_limit != null ? ` (limit ${report.word_limit})` : ""}
          </span>
        ) : null}
        {report.overridden ? (
          <span className="rounded-full bg-[#5b3a86]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5b3a86]">
            Evaluator reviewed
          </span>
        ) : null}
        {!report.is_complete ? (
          <span className="rounded-full bg-[#a23b46]/10 px-2 py-0.5 text-[11px] font-semibold text-[#a23b46]">
            Partial — some sections could not be produced
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {Object.entries(report.sections).map(([name, sec]) => (
          <div key={name} className="rounded-lg border border-[#e6dcc2] bg-[#faf6ee] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-[#1a3a2a]">
                {name.replace(/_/g, " ")}
              </span>
              {sec.score != null ? (
                <span className="text-xs font-semibold text-[#5d675f]">{sec.score}/10</span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-[#31443a]">{sec.feedback}</p>
          </div>
        ))}
      </div>

      {report.incomplete_sections.length > 0 ? (
        <p className="mt-3 text-xs font-medium text-[#a23b46]">
          Not produced: {report.incomplete_sections.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

export default AnswerWorkspace;
