"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { gsLmsService, getGateError } from "@/services/api/gsLmsService";
import { BETA_LOCKED_ERROR_FRAGMENT } from "@/services/api/gsLmsService";
import type {
  ReadinessTopicOut,
  TopicSectionsOut,
} from "@/services/api/gsLmsService";
import { apiErrorMessage } from "@/services/api/error";
import { DiscussionOverlay } from "../DiscussionOverlay";
import { LmsLoadingSkeleton } from "../LmsLoadingSkeleton";
import { VideoPlayer } from "../VideoPlayer";
import { useApiConfig } from "@/lib/hooks/useApi";
import { FunnelOrchestrator } from "../FunnelOrchestrator";
import { RecallCheckStep } from "../RecallCheckStep";
import { McqLabStep } from "../McqLabStep";
import { MainsPracticeStep } from "../MainsPracticeStep";
import { GrowthReportStep } from "../GrowthReportStep";
import { ExternalResourceCards } from "../ExternalResourceCards";
import { RichBlocks } from "../RichBlockRenderer";
import { ReadingTrackedSection } from "../ReadingTrackedSection";
import { PdfDownloadButton } from "../PdfDownloadButton";
import { PrelimsPyqPanel } from "../PrelimsPyqPanel";
import { useSubjectLms } from "../SubjectLmsContext";
import { parsePositiveRouteId } from "@/lib/gsLmsRoutePolicy";
import { LockedTopicScreen } from "../LockedTopicScreen";
import { TopicConcepts } from "../TopicConcepts";
import { MasteryNotice } from "../MasteryNotice";

const REVISIT_LABELS: Record<string, string> = {
  day_3: "Day 3 recall",
  day_7: "Day 7 recall",
  day_21: "Day 21 recall",
  day_start: "Start-of-day recall",
};

function revisitLabel(revisitType: string): string {
  return REVISIT_LABELS[revisitType] ?? "Spaced recall";
}

function formatRevisitDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface DueRevisit {
  id: number;
  revisit_type: string;
  due_date: string;
  overdue: boolean;
}

/** The server's reason the current step can't be completed yet (HTTP 409). */
function StepGateMessage({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [message]);
  return (
    <div
      ref={ref}
      role="alert"
      data-testid="step-gate-message"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
    >
      {message}
    </div>
  );
}

export function TopicPage() {
  const params = useParams<{ nodeId: string }>();
  const nodeId = parsePositiveRouteId(params.nodeId);
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();

  const [data, setData] = useState<TopicSectionsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioningStep, setTransitioningStep] = useState<number | null>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [showCompletedReport, setShowCompletedReport] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dueRevisit, setDueRevisit] = useState<DueRevisit | null>(null);
  const [demand, setDemand] = useState<{
    nodeId: number;
    row: ReadinessTopicOut;
  } | null>(null);
  const [revisitSaving, setRevisitSaving] = useState(false);
  // Both messages are keyed to the topic they belong to, so navigating to
  // another topic never shows the previous topic's confirmation or failure.
  const [revisitSavedFor, setRevisitSavedFor] = useState<number | null>(null);
  const [revisitError, setRevisitError] = useState<{
    nodeId: number;
    message: string;
  } | null>(null);
  const contentTransitionInFlight = useRef(false);
  const fetchSeq = useRef(0);
  const revisitSeq = useRef(0);
  const demandSeq = useRef(0);

  // A completed topic reappears here on its spaced-recall dates. The revisit is
  // only cleared when the learner records it, so the loop has a visible end.
  const fetchDueRevisit = useCallback(() => {
    if (nodeId === null) return;
    const requestId = ++revisitSeq.current;
    gsLmsService
      .getDueRevisits(subject)
      .then(({ revisits }) => {
        if (requestId !== revisitSeq.current) return;
        const match = revisits.find((item) => item.syllabus_node_id === nodeId);
        setDueRevisit(
          match
            ? {
                id: match.id,
                revisit_type: match.revisit_type,
                due_date: match.due_date,
                overdue: match.overdue,
              }
            : null
        );
      })
      .catch(() => {
        // Revisit lookup failure must never block the topic itself.
        if (requestId === revisitSeq.current) setDueRevisit(null);
      });
  }, [nodeId, subject]);
  // Set when the server answers 423: the topic isn't open to this student yet.
  const [lockedReason, setLockedReason] = useState<string | null>(null);

  const fetchSections = useCallback(() => {
    const requestId = ++fetchSeq.current;
    if (nodeId === null) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setActionError(null);
    gsLmsService
      .getTopicSections(subject, nodeId)
      .then((sections) => {
        if (requestId !== fetchSeq.current) return;
        setLockedReason(null);
        setData(sections);
      })
      .catch((err) => {
        if (requestId !== fetchSeq.current) return;
        const gate = getGateError(err);
        if (gate?.status === 423) {
          setLockedReason(gate.detail);
          return;
        }
        setError(apiErrorMessage(err, "Failed to load topic"));
      })
      .finally(() => {
        if (requestId === fetchSeq.current) setLoading(false);
      });
  }, [nodeId, subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => fetchSections());
  }, [isLoaded, isSignedIn, fetchSections]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => fetchDueRevisit());
    return () => {
      revisitSeq.current += 1;
    };
  }, [isLoaded, isSignedIn, fetchDueRevisit]);

  // The topic page answers "what does UPSC demand from this topic?" in place.
  // Readiness is computed subject-wide, so we read it without persisting a
  // snapshot; a failure simply omits the strip and never blocks the topic.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || nodeId === null) return;
    const requestId = ++demandSeq.current;
    gsLmsService
      .getReadiness(subject, { persist: false })
      .then((report) => {
        if (requestId !== demandSeq.current) return;
        const row = report.topics.find((item) => item.node_id === nodeId);
        setDemand(row ? { nodeId, row } : null);
      })
      .catch(() => {
        if (requestId === demandSeq.current) setDemand(null);
      });
    return () => {
      demandSeq.current += 1;
    };
  }, [isLoaded, isSignedIn, nodeId, subject]);

  const handleCompleteRevisit = async () => {
    if (!dueRevisit || revisitSaving || nodeId === null) return;
    setRevisitSaving(true);
    setRevisitError(null);
    try {
      await gsLmsService.completeRevisit(subject, dueRevisit.id);
      setDueRevisit(null);
      setRevisitSavedFor(nodeId);
      fetchDueRevisit();
    } catch {
      setRevisitError({
        nodeId,
        message: "We couldn't record this revisit. Please try again.",
      });
    } finally {
      setRevisitSaving(false);
    }
  };

  const handleDiscussionComplete = useCallback(() => {
    // Re-read the persisted discussion result; never override it in memory.
    setShowDiscussion(false);
    fetchSections();
  }, [fetchSections]);

  if (nodeId === null) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-lg font-semibold text-[#1a3a2a]">Topic not found</h1>
        <p className="mt-2 text-sm text-[#13251d]/60">
          The topic URL is invalid. Choose a topic from the syllabus.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <LmsLoadingSkeleton variant="content" />
      </div>
    );
  }

  if (lockedReason) {
    return <LockedTopicScreen reason={lockedReason} nodeId={nodeId} />;
  }

  if (error) {
    // A topic outside the paid-beta scope is visible on the syllabus map but
    // intentionally not enterable. Retrying cannot succeed, so offer the way
    // back instead of a retry loop.
    const isBetaLocked = error.includes(BETA_LOCKED_ERROR_FRAGMENT);
    return (
      <div className="p-6" role={isBetaLocked ? "status" : "alert"}>
        {isBetaLocked && (
          <h1 className="text-lg font-semibold text-[#1a3a2a]">
            This topic is not open yet
          </h1>
        )}
        <p
          className={`text-sm ${isBetaLocked ? "mt-2 text-[#13251d]/70" : "text-red-600"}`}
        >
          {error}
        </p>
        {isBetaLocked ? (
          <a
            href={`${lmsBase}/syllabus`}
            className="mt-4 inline-block rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs font-bold text-[#085041] transition hover:bg-[#1d9e75] hover:text-white"
          >
            Back to the syllabus
          </a>
        ) : (
          <button
            type="button"
            onClick={fetchSections}
            className="mt-3 rounded-md border border-[#dcd5c7] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
          >
            Retry topic
          </button>
        )}
      </div>
    );
  }

  if (!data) return null;

  const revisitErrorMessage =
    revisitError && revisitError.nodeId === nodeId ? revisitError.message : null;
  const revisitJustSaved = revisitSavedFor === nodeId;
  // Keyed by topic so a slow readiness response never labels the next topic.
  const demandRow = demand && demand.nodeId === nodeId ? demand.row : null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#1a3a2a]">{data.title}</h1>

      {demandRow && (
        <section
          aria-label="What UPSC demands from this topic"
          className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7a70]">
              What UPSC demands
            </p>
            <p className="text-[11px] text-[#8a978f]">
              Official syllabus + reviewed PYQs only
            </p>
          </div>
          {demandRow.pyq_count > 0 ? (
            <p className="mt-1 text-sm text-[#254438]">
              <span className="font-semibold">
                {demandRow.pyq_count} reviewed Prelims PYQ
                {demandRow.pyq_count === 1 ? "" : "s"}
              </span>{" "}
              mapped
              {demandRow.last_pyq_year
                ? ` · last Prelims ${demandRow.last_pyq_year}`
                : ""}{" "}
              {demandRow.mains_pyq_count > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold">
                    {demandRow.mains_pyq_count} Mains PYQ
                    {demandRow.mains_pyq_count === 1 ? "" : "s"}
                  </span>{" "}
                  {demandRow.last_mains_year
                    ? `(latest ${demandRow.last_mains_year}) `
                    : ""}
                  count at lower weight{" "}
                </>
              )}
              · {Math.round(demandRow.demand_share_pct * 10) / 10}% of Geography
              demand
              {demandRow.demand_confidence_pct < 50 &&
                " (low confidence — thin PYQ evidence)"}
            </p>
          ) : demandRow.mains_pyq_count > 0 ? (
            <p className="mt-1 text-sm text-[#6b5a3a]">
              No reviewed Prelims PYQ is mapped, so Prelims demand is
              unmeasured.{" "}
              <span className="font-semibold">
                {demandRow.mains_pyq_count} reviewed Mains PYQ
                {demandRow.mains_pyq_count === 1 ? "" : "s"}
              </span>{" "}
              still contribute at lower weight to{" "}
              {Math.round(demandRow.demand_share_pct * 10) / 10}% of Geography
              demand.
            </p>
          ) : (
            <p className="mt-1 text-sm text-[#6b5a3a]">
              No reviewed Prelims or Mains PYQ is mapped to this topic yet, so
              demand is unmeasured. Readiness will not rank this topic high or
              low until evidence exists.
            </p>
          )}
          <p className="mt-1 text-xs text-[#5d675f]">
            Your state: {Math.round(demandRow.coverage_pct)}% covered ·{" "}
            {Math.round(demandRow.depth_pct)}% depth ·{" "}
            {demandRow.has_evidence
              ? `tested ${Math.round(demandRow.performance_pct)}%`
              : "no test evidence yet"}
          </p>
        </section>
      )}

      {dueRevisit && (
        <div className="rounded-xl border border-[#ef9f27]/40 bg-[#fff4df] p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg" aria-hidden="true">🔁</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#6f4a12]">
                {revisitLabel(dueRevisit.revisit_type)} is due
                {dueRevisit.overdue && " · overdue"}
              </p>
              <p className="mt-1 text-sm text-[#6f4a12]/80">
                You completed this topic earlier. Before marking the recall done,
                re-read the sections that felt thin and try to state the key
                concepts from memory. Due {formatRevisitDate(dueRevisit.due_date)}.
              </p>
              {revisitErrorMessage && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {revisitErrorMessage}
                </p>
              )}
              <button
                type="button"
                onClick={handleCompleteRevisit}
                disabled={revisitSaving}
                className="mt-3 rounded-lg bg-[#ef9f27] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d98c1e] disabled:opacity-50"
              >
                {revisitSaving ? "Recording…" : "Mark this revisit reviewed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {revisitJustSaved && !dueRevisit && (
        <p
          role="status"
          className="rounded-xl border border-[#b9d9cd] bg-[#f3faf6] px-4 py-3 text-sm text-[#1a3a2a]"
        >
          Revisit recorded. The remaining spaced recalls stay in your planner.
        </p>
      )}

      {showDiscussion && (
        <DiscussionOverlay
          nodeId={nodeId}
          topicTitle={data.title}
          onComplete={handleDiscussionComplete}
          onClose={() => setShowDiscussion(false)}
        />
      )}

      {data.discussion_gate_passed ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#b9d9cd] bg-[#f3faf6] px-4 py-3 text-xs text-[#1a3a2a]">
          <p>
            <span className="font-bold">Optional knowledge check completed.</span>{" "}
            Your recall evidence for this topic is feeding the readiness report.
          </p>
          <button
            type="button"
            onClick={() => setShowDiscussion(true)}
            className="rounded-lg border border-[#b9d9cd] bg-white px-3 py-1.5 font-bold text-[#1d9e75] transition hover:bg-[#e7f5ee]"
          >
            Review knowledge check
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] px-4 py-3 text-xs text-[#49675e]">
          <p className="max-w-2xl">
            <span className="font-bold text-[#1a3a2a]">
              Optional: check what you already know.
            </span>{" "}
            A short discussion adds recall evidence to your readiness report and can
            unlock skip allowances. It is not required. The first section is already open.
          </p>
          <button
            type="button"
            onClick={() => setShowDiscussion(true)}
            className="rounded-lg bg-[#1d9e75] px-3 py-1.5 font-bold text-white transition hover:bg-[#167a5b]"
          >
            Start knowledge check
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
        >
          <p>{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="shrink-0 font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <FunnelOrchestrator nodeId={nodeId} subject={subject}>
        {({ currentStep, completeStep: advanceStep, gateMessage, displayTab }) => {

          const getActiveSectionLabel = (): string => {
            if (displayTab === 'ncert') return 'NCERT_LEVEL';
            if (displayTab === 'current') return 'CURRENT_AFFAIRS';
            if (displayTab === 'traps') return 'EXAMINER_TRAPS';
            if (displayTab === 'learn') {
              if (currentStep >= 6 && currentStep <= 7) return 'ADVANCED';
              return 'BASIC';
            }
            if (currentStep <= 3) return 'BASIC';
            if (currentStep <= 5) return 'NCERT_LEVEL';
            if (currentStep <= 7) return 'ADVANCED';
            if (currentStep <= 9) return 'CURRENT_AFFAIRS';
            return 'EXAMINER_TRAPS';
          };

          const activeLabel = getActiveSectionLabel();
          const activeSection = data.sections?.find(
            (sec) => sec.section_label.toUpperCase() === activeLabel.toUpperCase()
          );

          const handleContentContinue = async () => {
            if (
              contentTransitionInFlight.current ||
              transitioningStep !== null ||
              !activeSection ||
              activeSection.locked
            ) {
              return;
            }

            contentTransitionInFlight.current = true;
            setTransitioningStep(currentStep);
            setActionError(null);

            try {
              // Content progress is persisted before funnel progress. This keeps
              // progressive disclosure server-authoritative after refresh.
              await gsLmsService.completeSection(
                subject,
                nodeId,
                activeSection.section_id
              );
              const refreshed = await gsLmsService.getTopicSections(subject, nodeId);
              setData(refreshed);
              await advanceStep(currentStep);
            } catch (err: unknown) {
              const detail =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data
                  : undefined;
              setActionError(
                detail?.detail ||
                  detail?.message ||
                  "Failed to complete this section"
              );
            } finally {
              contentTransitionInFlight.current = false;
              setTransitioningStep(null);
            }
          };

          const handleGrowthReportComplete = async () => {
            setActionError(null);
            try {
              await advanceStep(14);
              const refreshed = await gsLmsService.getTopicSections(subject, nodeId);
              setData(refreshed);
            } catch (err: unknown) {
              const detail =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data
                  : undefined;
              setActionError(
                detail?.detail ||
                  detail?.message ||
                  "Failed to complete the topic"
              );
            }
          };

          return (
          <>
            {gateMessage && <StepGateMessage message={gateMessage} />}

            {(displayTab === 'learn' || displayTab === 'ncert' || displayTab === 'current' || displayTab === 'traps') && (
              <div className="space-y-6">
                {data.video_url && displayTab === 'learn' && (
                  <VideoPlayer
                    videoUrl={data.video_url}
                    watched={data.video_watched}
                    nodeId={nodeId}
                    onWatched={fetchSections}
                  />
                )}

                {currentStep === 1 ? (
                  <div className="rounded-xl border border-[#dcd5c7] bg-white p-5 space-y-3">
                    <h2 className="text-base font-black text-[#13251d]">Start this topic</h2>
                    <p className="text-sm text-[#5d675f]">
                      Work through each reviewed section, complete the recall check, then move
                      to the MCQ lab and Mains practice. The knowledge check above is optional
                      and never locks content.
                    </p>
                    <button
                      onClick={() => void advanceStep(1)}
                      className="w-full rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] py-3 text-sm font-black text-white"
                    >
                      Start with the BASIC section &rarr;
                    </button>
                  </div>
                ) : activeSection ? (
                  <ReadingTrackedSection
                    key={`${subject}-${nodeId}-${activeSection.section_id}`}
                    nodeId={nodeId}
                    sectionId={activeSection.section_id}
                    subject={subject}
                    enabled={!activeSection.locked}
                    completionRequested={transitioningStep === currentStep}
                  >
                    <div className="rounded-xl border border-[#dcd5c7] bg-white p-5 space-y-4">
                      <h2 className="text-base font-black text-[#13251d]">{activeSection.title}</h2>
                      {activeSection.blocks && activeSection.blocks.length > 0 ? (
                        <RichBlocks blocks={activeSection.blocks} />
                      ) : activeSection.locked ? (
                        <p className="text-sm text-[#5d675f]">Complete the previous section to unlock this content.</p>
                      ) : (
                        <p className="text-sm text-[#5d675f]">Content for this section is being authored.</p>
                      )}
                    </div>
                  </ReadingTrackedSection>
                ) : (
                  <div className="rounded-xl border border-[#dcd5c7] bg-white p-5">
                    <p className="text-sm text-[#5d675f]">Content for this section is not available.</p>
                  </div>
                )}

                {displayTab === 'learn' && <TopicConcepts nodeId={nodeId} subject={subject} />}

                <ExternalResourceCards nodeId={nodeId} subject={subject} />

                {(() => {
                  const stepToTabRecall: Record<number, string> = {
                    3: 'learn',
                    5: 'ncert',
                    7: 'learn',
                    9: 'current',
                    11: 'traps',
                  };
                  const expectedRecallTab = stepToTabRecall[currentStep];
                  if (displayTab !== expectedRecallTab) return null;
                  if (!activeSection) return null;
                  return (
                    <RecallCheckStep
                      nodeId={nodeId}
                      sectionLabel={activeSection.section_label}
                      subject={subject}
                      onComplete={() => advanceStep(currentStep)}
                    />
                  );
                })()}

                {(() => {
                  const recallStepToTab: Record<number, string> = {
                    3: 'learn',
                    5: 'ncert',
                    7: 'learn',
                    9: 'current',
                    11: 'traps',
                  };
                  const expectedRecallTab = recallStepToTab[currentStep];
                  if (expectedRecallTab === undefined || displayTab !== expectedRecallTab) return null;
                  if (activeSection) return null;
                  return (
                    <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 space-y-2">
                      <p className="text-sm text-[#5d675f]">
                        No reviewed content is available for this recall check yet.
                        You can continue without it.
                      </p>
                      <button
                        type="button"
                        onClick={() => void advanceStep(currentStep)}
                        className="w-full rounded-xl border border-[#dcd5c7] bg-white py-3 text-sm font-black text-[#1a3a2a] transition hover:border-[#1d9e75]"
                      >
                        Continue without this recall check &rarr;
                      </button>
                    </div>
                  );
                })()}

                {(() => {
                  if (![2, 4, 6, 8, 10].includes(currentStep)) return null;
                  const stepToTab: Record<number, string> = {
                    2: 'learn',
                    4: 'ncert',
                    6: 'learn',
                    8: 'current',
                    10: 'traps',
                  };
                  const expectedTab = stepToTab[currentStep];
                  if (displayTab !== expectedTab) return null;
                  if (!activeSection) {
                    return (
                      <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 space-y-2">
                        <p className="text-sm text-[#5d675f]">
                          No reviewed content is available for this section yet.
                          Nothing is locked; you can continue without it.
                        </p>
                        <button
                          type="button"
                          onClick={() => void advanceStep(currentStep)}
                          className="w-full rounded-xl border border-[#dcd5c7] bg-white py-3 text-sm font-black text-[#1a3a2a] transition hover:border-[#1d9e75]"
                        >
                          Continue without this section &rarr;
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      onClick={() => void handleContentContinue()}
                      disabled={transitioningStep === currentStep || activeSection.locked}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {transitioningStep === currentStep
                        ? 'Saving Section...'
                        : "I've Read This Section → Continue"}
                    </button>
                  );
                })()}
              </div>
            )}

            {displayTab === 'mcq-lab' && (
              <McqLabStep
                nodeId={nodeId}
                subject={subject}
                onComplete={() => advanceStep(12)}
              />
            )}

            {displayTab === 'mains' && currentStep === 13 && (
              <div className="space-y-6">
                <PrelimsPyqPanel nodeId={nodeId} subject={subject} />
                <MainsPracticeStep
                  nodeId={nodeId}
                  subject={subject}
                  onComplete={() => advanceStep(13)}
                />
              </div>
            )}

            {displayTab === 'mains' && currentStep === 14 && (
              <GrowthReportStep
                nodeId={nodeId}
                subject={subject}
                onComplete={handleGrowthReportComplete}
              />
            )}

            {currentStep > 14 && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#1d9e75] p-8 text-center text-white">
                  <h2 className="text-lg font-black">Topic Complete!</h2>
                  <p className="text-sm opacity-80 mt-2">
                    You&apos;ve completed all 14 steps for this topic.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {data.topic_completed && (
                      <PdfDownloadButton
                        nodeId={nodeId}
                        topicCompleted={data.topic_completed}
                        topicTitle={data.title}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCompletedReport((visible) => !visible)}
                      aria-expanded={showCompletedReport}
                      className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20"
                    >
                      {showCompletedReport ? 'Hide growth report' : 'View growth report'}
                    </button>
                  </div>
                </div>
                {showCompletedReport && (
                  <GrowthReportStep nodeId={nodeId} subject={subject} />
                )}
                <MasteryNotice nodeId={nodeId} />
              </div>
            )}
          </>
          );
        }}
      </FunnelOrchestrator>
    </div>
  );
}
