"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { TopicSectionsOut } from "@/services/api/gsLmsService";
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
import { RichBlocks } from "@/components/gs-lms/RichBlockRenderer";
import { PdfDownloadButton } from "@/components/gs-lms/PdfDownloadButton";
// useFunnelState is now managed solely by FunnelOrchestrator via render-prop

export default function TopicContentPage() {
  const params = useParams();
  const nodeId = Number(params.nodeId);
  const { isLoaded, isSignedIn } = useApiConfig();

  const [data, setData] = useState<TopicSectionsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchSections();
  }, [fetchSections]);

  if (loading) {
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

  // Step 1: Discussion Gate — handled before FunnelOrchestrator renders
  const discussionGateActive =
    !data.discussion_gate_passed && !forceGatePassed;

  if (discussionGateActive) {
    return <DiscussionOverlay nodeId={nodeId} topicTitle={data.title} onComplete={handleGateComplete} />;
  }

  // For steps 2-11 (content + recall), 12 (MCQ Lab), 13 (Mains), 14 (Growth Report)
  // we wrap everything in the FunnelOrchestrator for the 6-tab navigation
  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <h1 className="text-xl font-semibold text-[#1a3a2a]">{data.title}</h1>

      {/* Funnel Orchestrator — 6-tab navigation with progress */}
      {/* children is a render-prop: receives { currentStep, completeStep } from
          the single useFunnelState instance inside FunnelOrchestrator */}
      <FunnelOrchestrator nodeId={nodeId} subject="geography">
        {({ currentStep, completeStep: advanceStep, displayTab }) => {
          // Determine which section to show based on SELECTED TAB (allows revisiting)
          // displayTab changes when user clicks a tab; currentStep is the funnel position
          const tabToSectionIndex: Record<string, number> = {
            'learn': 0,    // BASIC or ADVANCED
            'ncert': 1,    // NCERT_LEVEL
            'current': 3,  // CURRENT_AFFAIRS
            'traps': 4,    // EXAMINER_TRAPS
          };
          const viewingSectionIndex = tabToSectionIndex[displayTab] ?? (currentStep <= 3 ? 0 : currentStep <= 5 ? 1 : currentStep <= 7 ? 2 : currentStep <= 9 ? 3 : 4);

          return (
          <>
            {/* Content Steps — show content for the SELECTED tab (allows revisiting) */}
            {(displayTab === 'learn' || displayTab === 'ncert' || displayTab === 'current' || displayTab === 'traps') && (
              <div className="space-y-6">
                {/* Video player — rendered only when topic has a video */}
                {data.video_url && displayTab === 'learn' && (
                  <VideoPlayer
                    videoUrl={data.video_url}
                    watched={data.video_watched}
                    nodeId={nodeId}
                    onWatched={fetchSections}
                  />
                )}

                {/* Render actual content blocks from the selected section */}
                {data.sections && data.sections.length > 0 && (() => {
                  const activeSection = data.sections[viewingSectionIndex];
                  if (!activeSection) return null;
                  return (
                    <div className="rounded-xl border border-[#dcd5c7] bg-white p-5 space-y-4">
                      <h2 className="text-base font-black text-[#13251d]">{activeSection.title}</h2>
                      {activeSection.blocks && activeSection.blocks.length > 0 ? (
                        <RichBlocks blocks={activeSection.blocks} />
                      ) : (
                        <p className="text-sm text-[#5d675f]">Content for this section is being authored.</p>
                      )}
                    </div>
                  );
                })()}

                {/* External resources */}
                <ExternalResourceCards nodeId={nodeId} />

                {/* Recall Check — only on the CURRENT step (not when revisiting) */}
                {currentStep === (viewingSectionIndex * 2 + 3) && (currentStep === 3 || currentStep === 5 || currentStep === 7 || currentStep === 9 || currentStep === 11) && (() => {
                  const recallSection = data.sections?.[viewingSectionIndex];
                  if (!recallSection) return null;
                  return (
                    <RecallCheckStep
                      nodeId={nodeId}
                      sectionLabel={recallSection.section_label}
                      onComplete={() => advanceStep(currentStep)}
                    />
                  );
                })()}

                {/* Advance button — only on current content step (not when revisiting) */}
                {(currentStep === 2 || currentStep === 4 || currentStep === 6 || currentStep === 8 || currentStep === 10) && (
                  <button
                    onClick={() => advanceStep(currentStep)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black"
                  >
                    I&apos;ve Read This Section &rarr; Continue
                  </button>
                )}
              </div>
            )}

            {/* Step 12: MCQ Lab */}
            {displayTab === 'mcq-lab' && (
              <McqLabStep
                nodeId={nodeId}
                onComplete={() => advanceStep(12)}
              />
            )}

            {/* Step 13-14: Mains + Growth Report */}
            {displayTab === 'mains' && currentStep === 13 && (
              <MainsPracticeStep
                nodeId={nodeId}
                onComplete={() => advanceStep(13)}
              />
            )}

            {displayTab === 'mains' && currentStep === 14 && (
              <GrowthReportStep
                nodeId={nodeId}
                onComplete={() => advanceStep(14)}
              />
            )}

            {/* Funnel complete */}
            {currentStep > 14 && (
              <div className="rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#1d9e75] p-8 text-center text-white">
                <h2 className="text-lg font-black">Topic Complete!</h2>
                <p className="text-sm opacity-80 mt-2">
                  You&apos;ve completed all 14 steps for this topic.
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
          </>
          );
        }}
      </FunnelOrchestrator>
    </div>
  );
}
