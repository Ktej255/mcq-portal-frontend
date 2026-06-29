"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { TopicSectionsOut } from "@/services/api/gsLmsService";
import { ContentSections } from "@/components/gs-lms/ContentSections";
import { PYQPanel } from "@/components/gs-lms/PYQPanel";
import { PdfDownloadButton } from "@/components/gs-lms/PdfDownloadButton";
import { DiscussionOverlay } from "@/components/gs-lms/DiscussionOverlay";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";
import { VideoPlayer } from "@/components/gs-lms/VideoPlayer";
import { useApiConfig } from "@/lib/hooks/useApi";
// Interactive Learning Funnel components
import { FunnelOrchestrator } from "@/components/gs-lms/FunnelOrchestrator";
import { RecallCheckStep } from "@/components/gs-lms/RecallCheckStep";
import { McqLabStep } from "@/components/gs-lms/McqLabStep";
import { MainsPracticeStep } from "@/components/gs-lms/MainsPracticeStep";
import { GrowthReportStep } from "@/components/gs-lms/GrowthReportStep";
import { ExternalResourceCards } from "@/components/gs-lms/ExternalResourceCards";
import { useFunnelState } from "@/hooks/useFunnelState";
import { useReadingTimer } from "@/hooks/useReadingTimer";

export default function TopicContentPage() {
  const params = useParams();
  const router = useRouter();
  const nodeId = Number(params.nodeId);
  const { isLoaded, isSignedIn } = useApiConfig();

  const [data, setData] = useState<TopicSectionsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingPractice, setStartingPractice] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  // Interactive Learning Funnel state
  const funnel = useFunnelState(nodeId, "geography");

  const fetchSections = useCallback(() => {
    setLoading(true);
    gsLmsService
      .getTopicSections("geography", nodeId)
      .then(setData)
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load topic")
      )
      .finally(() => setLoading(false));
  }, [nodeId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchSections();
  }, [isLoaded, isSignedIn, fetchSections]);

  const [forceGatePassed, setForceGatePassed] = useState(false);

  // Called when student clicks "Proceed to Content" in the discussion overlay.
  const handleGateComplete = useCallback(() => {
    setForceGatePassed(true);
    // Also advance funnel step 1
    funnel.completeStep(1).catch(() => {});
    fetchSections();
  }, [fetchSections, funnel]);

  const handleSectionComplete = async (sectionId: number) => {
    try {
      await gsLmsService.completeSection("geography", nodeId, sectionId);
      fetchSections();
    } catch {
      // Silently handle — user can retry
    }
  };

  const handleStartPractice = async () => {
    setStartingPractice(true);
    setPracticeError(null);
    try {
      const session = await gsLmsService.startPractice("geography", nodeId);
      sessionStorage.setItem(
        `practice-session-${session.session_id}`,
        JSON.stringify(session),
      );
      router.push(`/upsc/geography/lms/practice/${session.session_id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "No practice questions are available for this topic yet.";
      setPracticeError(msg);
      setStartingPractice(false);
    }
  };

  if (loading || funnel.loading) {
    return (
      <div className="p-6">
        <LmsLoadingSkeleton variant="content" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  // ---------------------------------------------------------------------------
  // INTERACTIVE LEARNING FUNNEL (14-step guided experience)
  // ---------------------------------------------------------------------------

  // Determine which funnel step to render
  const { currentStep, completeStep: advanceStep } = funnel;

  // Step 1: Discussion Gate
  if (currentStep === 1 && !data.discussion_gate_passed && !forceGatePassed) {
    return <DiscussionOverlay nodeId={nodeId} topicTitle={data.title} onComplete={handleGateComplete} />;
  }

  // For steps 2-11 (content + recall), 12 (MCQ Lab), 13 (Mains), 14 (Growth Report)
  // we wrap everything in the FunnelOrchestrator for the 6-tab navigation
  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <h1 className="text-xl font-semibold text-[#1a3a2a]">{data.title}</h1>

      {/* Funnel Orchestrator — 6-tab navigation with progress */}
      <FunnelOrchestrator nodeId={nodeId} subject="geography">
        {/* Content Steps (2-11): Progressive disclosure + recall checks */}
        {currentStep >= 2 && currentStep <= 11 && (
          <div className="space-y-6">
            {/* Video player — rendered only when topic has a video */}
            {data.video_url && (
              <VideoPlayer
                videoUrl={data.video_url}
                watched={data.video_watched}
                nodeId={nodeId}
                onWatched={fetchSections}
              />
            )}

            {/* Progressive-disclosure sections with reading time tracking */}
            <ContentSections
              sections={data.sections.map((section, index) => {
                const isFirst = index === 0;
                const prevCompleted = index > 0 && data.sections[index - 1].completed;
                if (isFirst || prevCompleted) {
                  return { ...section, locked: false };
                }
                return section;
              })}
              onComplete={handleSectionComplete}
            />

            {/* External resources (shown after content, before recall) */}
            <ExternalResourceCards nodeId={nodeId} />

            {/* Recall Check — shown after content section is read */}
            {(currentStep === 3 || currentStep === 5 || currentStep === 7 || currentStep === 9 || currentStep === 11) && (
              <RecallCheckStep
                nodeId={nodeId}
                sectionLabel={
                  currentStep === 3 ? "BASIC" :
                  currentStep === 5 ? "NCERT_LEVEL" :
                  currentStep === 7 ? "ADVANCED" :
                  currentStep === 9 ? "CURRENT_AFFAIRS" :
                  "EXAMINER_TRAPS"
                }
                onComplete={() => advanceStep(currentStep)}
              />
            )}

            {/* PYQ Panel */}
            <PYQPanel nodeId={nodeId} />
          </div>
        )}

        {/* Step 12: MCQ Lab */}
        {currentStep === 12 && (
          <McqLabStep
            nodeId={nodeId}
            onComplete={() => advanceStep(12)}
          />
        )}

        {/* Step 13: Mains Practice */}
        {currentStep === 13 && (
          <MainsPracticeStep
            nodeId={nodeId}
            onComplete={() => advanceStep(13)}
          />
        )}

        {/* Step 14: Growth Report */}
        {currentStep === 14 && (
          <GrowthReportStep
            nodeId={nodeId}
            onComplete={() => advanceStep(14)}
          />
        )}

        {/* Funnel complete — show completion state */}
        {currentStep > 14 && (
          <div className="rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#1d9e75] p-8 text-center text-white">
            <h2 className="text-lg font-black">🎉 Topic Complete!</h2>
            <p className="text-sm opacity-80 mt-2">
              You've completed all 14 steps for this topic. Check your Growth Report for insights.
            </p>
            {data.topic_completed && (
              <div className="mt-4">
                <PdfDownloadButton
                  nodeId={nodeId}
                  topicCompleted={data.topic_completed}
                  topicTitle={data.title}
                />
              </div>
            )}
          </div>
        )}
      </FunnelOrchestrator>

      {/* Practice MCQs — legacy sequential practice (still accessible) */}
      <section className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5">
        <h2 className="text-base font-semibold text-[#13251d]">Practice Questions</h2>
        <p className="mt-1 text-sm text-[#13251d]/60">
          Test yourself with UPSC-style MCQs for this topic.
        </p>
        <button
          type="button"
          onClick={handleStartPractice}
          disabled={startingPractice}
          className="mt-3 rounded-lg bg-[#1d9e75] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#178a65] disabled:opacity-50"
        >
          {startingPractice ? "Starting…" : "Start Practice →"}
        </button>
        {practiceError ? (
          <p className="mt-2 text-sm font-medium text-[#a23b46]">{practiceError}</p>
        ) : null}
      </section>

      {/* PDF download — visible only when topic is fully completed */}
      {data.topic_completed && (
        <PdfDownloadButton
          nodeId={nodeId}
          topicCompleted={data.topic_completed}
          topicTitle={data.title}
        />
      )}
    </div>
  );
}
