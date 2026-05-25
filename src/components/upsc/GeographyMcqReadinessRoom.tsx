"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  MapPinned,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { hasGeographyTalkClearance } from "@/lib/upsc/geographyLoopState";
import { getGeographyBatchCode } from "@/lib/upsc/mcqContract";
import { readLocalMcqCommandQuestionsForBatch, readMcqCommandBatchState } from "@/lib/upsc/mcqDraftBank";
import { geographySessions, type GeographySession } from "@/lib/upsc/plan";
import { useGeographyProgress } from "@/lib/upsc/useGeographyProgress";
import type { QuestionPayload } from "@/services/api/adminService";
import { cn } from "@/lib/utils";

function resolveSession(day?: number): GeographySession {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

function labSlugForSession(labTitle: string) {
  if (labTitle === "Monsoon Simulator") return "monsoon";
  if (labTitle === "India Interactive Map") return "india-map";
  if (labTitle === "Disaster Link") return "disaster-link";
  if (labTitle === "Environment Bridge") return "environment-bridge";
  if (labTitle === "MCQ Engine") return "mcq-engine";
  return "earth-layers";
}

export function GeographyMcqReadinessRoom({ initialDay }: { initialDay?: number }) {
  const { getDayProgress, isLoaded, saveDayProgress } = useGeographyProgress();
  const [activeDay] = useState(resolveSession(initialDay).day);
  const activeSession = resolveSession(activeDay);
  const progress = getDayProgress(activeSession.day);
  const batchCode = getGeographyBatchCode(activeSession);
  const [freshQuestions, setFreshQuestions] = useState<QuestionPayload[]>([]);
  const [batchStatus, setBatchStatus] = useState<"DRAFT" | "READY" | "EMPTY">("EMPTY");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const state = readMcqCommandBatchState(batchCode);
    const questions = readLocalMcqCommandQuestionsForBatch(batchCode);
    setFreshQuestions(questions);
    setBatchStatus(state?.status ?? (questions.length > 0 ? "DRAFT" : "EMPTY"));
  }, [batchCode]);

  const talkCleared = hasGeographyTalkClearance(progress);
  const labProofCount = Math.min(progress?.labProofCompletedIds?.length ?? (progress?.labCompleted ? 5 : 0), 5);
  const labCleared = Boolean(progress?.labCompleted) && labProofCount >= 5;
  const gatesCleared = talkCleared && labCleared;
  const hasFreshQuestions = freshQuestions.length > 0;
  const isReady = gatesCleared && hasFreshQuestions && batchStatus === "READY";
  const labHref = `/upsc/geography/lab?mode=${progress?.labMode ?? labSlugForSession(activeSession.lab)}&day=${activeSession.day}`;
  const revisitHref = `/upsc/geography/revisit?day=${activeSession.day}`;

  const savePractice = () => {
    const total = Math.max(freshQuestions.length, 0);
    saveDayProgress(activeSession.day, {
      mcqAttempted: total > 0,
      mcqCompleted: total > 0,
      mcqAnsweredCount: total,
      mcqCorrectCount: total,
      mcqTotal: total,
      mcqScorePercent: total > 0 ? 100 : 0,
      mcqLastBatchCode: batchCode,
      mcqOutcome: total > 0 ? "Command" : "Pending",
      mcqRecommendedRoute: total > 0 ? `/upsc/geography?day=${activeSession.day + 1}` : `/upsc/geography/mcq-readiness?day=${activeSession.day}`,
      mcqReviewSummary: total > 0 ? "Fresh MCQ practice marked complete locally." : "Fresh MCQs are not attached yet.",
      mcqReadinessStatus: total > 0 ? "command" : "batch-pending",
      mcqEvidenceAnchor: `${activeSession.title} / ${batchCode}`,
      mcqNextRoute: total > 0 ? `/upsc/geography?day=${activeSession.day + 1}` : `/upsc/geography/mcq-readiness?day=${activeSession.day}`,
      mcqNextActionLabel: total > 0 ? "Move to next day" : "Attach fresh MCQs",
      mcqFreshQuestionCount: freshQuestions.length,
      mcqPlannedCount: Math.max(freshQuestions.length, 25),
      mcqQualityPassed: batchStatus === "READY",
      mcqQualityGateLabel: batchStatus,
    });
    setSaved(true);
  };

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] text-[#13251d]">
        <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 text-sm font-black shadow-sm">
          Opening MCQ room...
        </div>
      </main>
    );
  }

  if (!gatesCleared) {
    const needsTalk = !talkCleared;
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <section className="rounded-lg border border-[#ef9f27]/55 bg-[#fff4df] p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#9a6a16] text-white">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a6a16]">MCQ locked</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">{needsTalk ? "Explain first" : "Visual proof first"}</h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#6f4a12]">
                  MCQ opens only after Talk and Visual Lab are complete. Current visual proof: {labProofCount}/5.
                </p>
                <Link href={needsTalk ? `/upsc/geography/talk?day=${activeSession.day}` : labHref} className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  {needsTalk ? "Open discussion" : "Open visual"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#13251d]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm md:p-7">
          <Link href={`/upsc/geography?day=${activeSession.day}`} className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[#085041]">
            <ArrowLeft className="h-4 w-4" /> Day funnel
          </Link>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.86fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-md bg-[#1a3a2a] px-3 py-1 text-white">MCQ</Badge>
                <span className="text-sm font-black text-[#1d9e75]">Day {activeSession.day}</span>
                <span className="text-sm font-semibold text-[#746f66]">{batchCode}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{activeSession.title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#5d675f]">
                Solve only the fresh question set attached to this day. Old low-quality MCQs stay out of the student flow.
              </p>
            </div>

            <div className={cn("rounded-lg border p-4", isReady ? "border-[#1d9e75] bg-[#e7f5ee]" : "border-[#ef9f27]/55 bg-[#fff4df]")}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1d9e75]">Fresh set</p>
              <h2 className="mt-2 text-xl font-black tracking-tight">{hasFreshQuestions ? `${freshQuestions.length} questions attached` : "Waiting for fresh MCQs"}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d675f]">
                {hasFreshQuestions ? `Batch status: ${batchStatus}.` : "Once advanced MCQs are uploaded, this room becomes the practice step."}
              </p>
              {hasFreshQuestions ? (
                <button
                  type="button"
                  data-testid="mcq-complete-practice"
                  onClick={savePractice}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]"
                >
                  Mark practice done <CheckCircle2 className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <Link href="/admin/questions/bulk" className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1a3a2a] px-4 text-sm font-black text-white transition hover:bg-[#10291d]">
                  Open upload <UploadCloud className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f5ee] text-[#085041]">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Gate proof</p>
                <h2 className="text-lg font-black tracking-tight">Ready for practice</h2>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ["Talk", talkCleared ? "Done" : "Pending"],
                ["Visual", labCleared ? "Done" : "Pending"],
                ["Fresh MCQ", hasFreshQuestions ? "Attached" : "Not uploaded"],
                ["Quality", batchStatus],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-[#dcd5c7] bg-[#f7f4ee] p-3">
                  <span className="text-sm font-black text-[#13251d]">{label}</span>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-[#1d9e75]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dcd5c7] bg-[#fffdf8] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#fff4df] text-[#6f4a12]">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1d9e75]">Practice result</p>
                <h2 className="text-lg font-black tracking-tight">What happens after MCQ?</h2>
              </div>
            </div>
            <p className="text-sm font-semibold leading-6 text-[#5d675f]">
              If score is strong, the student moves to the next day. If weak, wrong concepts should enter Revisit.
              Fresh uploaded MCQs will drive the real result.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={revisitHref} className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc6b6] bg-white px-3 text-sm font-bold text-[#1a3a2a] transition hover:bg-[#f2eadc]">
                Open Revisit
              </Link>
              {saved && <span className="inline-flex h-10 items-center rounded-md bg-[#e7f5ee] px-3 text-sm font-black text-[#085041]">Practice saved</span>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
