"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import {
  gsLmsService,
  getGateError,
  type CheckpointOut,
  type CheckpointQuestionOut,
  type CheckpointResultOut,
  type LeafRefOut,
} from "@/services/api/gsLmsService";
import { LmsLoadingSkeleton } from "../LmsLoadingSkeleton";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

type Phase = "loading" | "intro" | "question" | "submitting" | "result" | "unavailable";

const primaryButton =
  "rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50";

function errorText(err: unknown, fallback: string): string {
  return getGateError(err)?.detail ?? fallback;
}

/**
 * Cumulative review test: 10 MCQs drawn from the last few topics. Passing it
 * unlocks the next topic; failing lets the student try again with a new draw.
 */
export function CheckpointPage() {
  const params = useParams();
  const checkpointId = Number(params.id);
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();

  const [phase, setPhase] = useState<Phase>("loading");
  const [checkpoint, setCheckpoint] = useState<CheckpointOut | null>(null);
  const [questions, setQuestions] = useState<CheckpointQuestionOut[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<CheckpointResultOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nextLeaf, setNextLeaf] = useState<LeafRefOut | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    gsLmsService
      .getDueCheckpoints(subject)
      .then((due) => {
        if (cancelled) return;
        const found = due.find((cp) => cp.checkpoint_id === checkpointId) ?? null;
        setCheckpoint(found);
        setPhase(found ? "intro" : "unavailable");
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load the review test");
        setPhase("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, subject, checkpointId]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const started = await gsLmsService.startCheckpoint(subject, checkpointId);
      setQuestions(started.questions);
      setAnswers({});
      setResult(null);
      setIndex(0);
      setPhase("question");
    } catch (err) {
      setError(errorText(err, "Could not start the review test"));
    } finally {
      setBusy(false);
    }
  }, [subject, checkpointId]);

  const submit = useCallback(async () => {
    setPhase("submitting");
    setError(null);
    try {
      const res = await gsLmsService.submitCheckpoint(
        subject,
        checkpointId,
        questions.map((q) => ({ question_id: q.question_id, chosen_answer: answers[q.question_id] })),
      );
      setResult(res);
      setPhase("result");
      if (res.passed) {
        gsLmsService
          .getProgression(subject)
          .then((p) => setNextLeaf(p.next_leaf))
          .catch(() => setNextLeaf(null));
      }
    } catch (err) {
      setError(errorText(err, "Submission failed. Please try again."));
      setPhase("question");
    }
  }, [subject, checkpointId, questions, answers]);

  if (phase === "loading") {
    return (
      <div className="p-6">
        <LmsLoadingSkeleton variant="content" />
      </div>
    );
  }

  if (phase === "unavailable" || !checkpoint) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#dcd5c7] bg-white p-8 text-center space-y-3">
          <h1 className="text-lg font-black text-[#1a3a2a]">No review test to take</h1>
          <p className="text-sm text-[#49675e]">
            {error ?? "This review test is already passed or isn't available."}
          </p>
          <Link href={`${lmsBase}/syllabus`} className="text-xs font-bold text-[#1d9e75] hover:underline">
            Back to syllabus
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="p-6">
        <div data-testid="checkpoint-intro" className="mx-auto max-w-xl rounded-2xl border border-[#dcd5c7] bg-white p-6 space-y-4">
          <h1 className="text-xl font-semibold text-[#1a3a2a]">Review test: {checkpoint.sub_topic_title}</h1>
          <p className="text-sm text-[#49675e]">
            10 questions from the topics below. Score at least {checkpoint.pass_score}% to unlock the next topic.
            {checkpoint.attempts > 0 && checkpoint.best_score !== null && (
              <> Your best so far: {checkpoint.best_score}%.</>
            )}
          </p>
          <ul className="space-y-1 text-sm text-[#13251d]">
            {checkpoint.leaves.map((leaf) => (
              <li key={leaf.node_id} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1d9e75]" />
                {leaf.title}
              </li>
            ))}
          </ul>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="button" onClick={start} disabled={busy} className={primaryButton}>
            {busy ? "Starting..." : "Start review test"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const byId = new Map(questions.map((q) => [q.question_id, q]));
    return (
      <div className="p-6">
        <div data-testid="checkpoint-result" className="mx-auto max-w-2xl space-y-6">
          <div
            className={`rounded-2xl border p-6 text-center ${
              result.passed ? "border-[#b9d9cd] bg-[#e7f5ee]" : "border-red-200 bg-red-50"
            }`}
          >
            <div className={`text-4xl font-black ${result.passed ? "text-[#1d9e75]" : "text-red-600"}`}>
              {result.score}%
            </div>
            <p className="mt-1 text-sm text-[#49675e]">
              {result.correct_count}/{result.total_questions} correct
            </p>
            <p className={`mt-2 text-sm font-black ${result.passed ? "text-[#085041]" : "text-red-700"}`}>
              {result.passed
                ? "Passed. The next topic is unlocked."
                : `Not yet. You need ${result.pass_score}% to pass. Revise and try again.`}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {result.passed ? (
                <>
                  {nextLeaf && (
                    <Link href={`${lmsBase}/topic/${nextLeaf.node_id}`} className={primaryButton}>
                      Continue: {nextLeaf.title}
                    </Link>
                  )}
                  <Link href={`${lmsBase}/syllabus`} className="text-xs font-bold text-[#1d9e75] hover:underline">
                    Back to syllabus
                  </Link>
                </>
              ) : (
                <>
                  <button type="button" onClick={start} disabled={busy} className={primaryButton}>
                    {busy ? "Starting..." : "Try again"}
                  </button>
                  <Link href={`${lmsBase}/syllabus`} className="text-xs font-bold text-[#1d9e75] hover:underline">
                    Back to syllabus
                  </Link>
                </>
              )}
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase text-[#49675e]">Per-topic accuracy</h2>
            {result.leaf_breakdown.map((leaf) => (
              <div key={leaf.leaf_id} className="flex items-center justify-between text-xs">
                <span className="text-[#1f2e26]">{leaf.title}</span>
                <span className={`font-black ${leaf.accuracy >= result.pass_score ? "text-[#1d9e75]" : "text-red-600"}`}>
                  {leaf.accuracy}% ({leaf.correct}/{leaf.total})
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase text-[#49675e]">Explanations</h2>
            {result.attempts.map((attempt, i) => (
              <details key={attempt.question_id} className="rounded-lg border border-[#dcd5c7] bg-white">
                <summary className="flex cursor-pointer items-center gap-2 p-3 text-xs">
                  {attempt.is_correct ? (
                    <CheckCircle2 className="h-4 w-4 text-[#1d9e75]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold text-[#1f2e26]">Q{i + 1}</span>
                </summary>
                <div className="space-y-1 px-3 pb-3 text-xs text-[#49675e]">
                  {byId.get(attempt.question_id) && (
                    <p className="whitespace-pre-wrap text-[#1f2e26]">{byId.get(attempt.question_id)?.question_text}</p>
                  )}
                  <p>
                    Your answer: <strong>{attempt.chosen_answer}</strong>
                  </p>
                  <p>
                    Correct answer: <strong className="text-[#1d9e75]">{attempt.correct_answer}</strong>
                  </p>
                  {attempt.explanation && <p className="text-[#1f2e26]">{attempt.explanation}</p>}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Question view: one question at a time.
  const question = questions[index];
  if (!question) return null;
  const isLast = index === questions.length - 1;
  const chosen = answers[question.question_id];
  const allAnswered = questions.every((q) => answers[q.question_id]);

  return (
    <div className="p-6">
      <div data-testid="checkpoint-question" className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-[#49675e]">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#dcd5c7]">
          <div
            className="h-full rounded-full bg-[#1d9e75] transition-all"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-[#dcd5c7] bg-white p-4">
          <span className="rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] px-2.5 py-0.5 text-[8px] font-black text-white">
            {question.question_type.replace(/_/g, " ")}
          </span>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1f2e26]">{question.question_text}</p>
          <div className="space-y-2">
            {question.options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [question.question_id]: opt.label }))}
                className={`w-full rounded-lg border p-3 text-left text-xs transition-all ${
                  chosen === opt.label
                    ? "border-[#1a3a2a] bg-[#e7f5ee] shadow-sm"
                    : "border-[#dcd5c7] bg-white hover:border-[#b9d9cd]"
                }`}
              >
                <span className="font-black text-[#1a3a2a]">{opt.label}.</span>{" "}
                <span className="text-[#1f2e26]">{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0 || phase === "submitting"}
            className="rounded-lg border border-[#b9d9cd] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] disabled:opacity-40"
          >
            Previous
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={submit}
              disabled={!allAnswered || phase === "submitting"}
              className={primaryButton}
            >
              {phase === "submitting" ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit"
              )}
            </button>
          ) : (
            <button type="button" onClick={() => setIndex((i) => i + 1)} disabled={!chosen} className={primaryButton}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckpointPage;
