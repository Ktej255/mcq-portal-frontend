"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { TopicSectionsOut } from "@/services/api/gsLmsService";
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
import { PdfDownloadButton } from "../PdfDownloadButton";
import { PrelimsPyqPanel } from "../PrelimsPyqPanel";
import { useSubjectLms } from "../SubjectLmsContext";

function AutoAdvanceStep({
  shouldAdvance,
  step,
  advanceStep,
}: {
  shouldAdvance: boolean;
  step: number;
  advanceStep: (step: number) => Promise<void>;
}) {
  useEffect(() => {
    if (!shouldAdvance) return;
    advanceStep(step).catch(() => {});
  }, [advanceStep, shouldAdvance, step]);

  return null;
}

export function TopicPage() {
  const params = useParams();
  const nodeId = Number(params.nodeId);
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject } = useSubjectLms();

  const [data, setData] = useState<TopicSectionsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = useCallback(() => {
    setLoading(true);
    gsLmsService
      .getTopicSections(subject, nodeId)
      .then(setData)
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load topic")
      )
      .finally(() => setLoading(false));
  }, [nodeId, subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchSections();
  }, [isLoaded, isSignedIn, fetchSections]);

  const [forceGatePassed, setForceGatePassed] = useState(false);

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

  const discussionGateActive =
    !data.discussion_gate_passed && !forceGatePassed;

  if (discussionGateActive) {
    return <DiscussionOverlay nodeId={nodeId} topicTitle={data.title} onComplete={handleGateComplete} />;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-[#1a3a2a]">{data.title}</h1>

      <FunnelOrchestrator nodeId={nodeId} subject={subject}>
        {({ currentStep, completeStep: advanceStep, displayTab }) => {

          const getViewingSectionIndex = (): number => {
            if (displayTab === 'ncert') return 1;
            if (displayTab === 'current') return 3;
            if (displayTab === 'traps') return 4;
            if (displayTab === 'learn') {
              if (currentStep >= 6 && currentStep <= 7) return 2;
              return 0;
            }
            return currentStep <= 3 ? 0 : currentStep <= 5 ? 1 : currentStep <= 7 ? 2 : currentStep <= 9 ? 3 : 4;
          };
          const viewingSectionIndex = getViewingSectionIndex();

          return (
          <>
            <AutoAdvanceStep
              shouldAdvance={currentStep === 1 && data.discussion_gate_passed}
              step={1}
              advanceStep={advanceStep}
            />

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

                <ExternalResourceCards nodeId={nodeId} />

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

                {(() => {
                  if (currentStep === 1) {
                    return (
                      <button
                        onClick={() => advanceStep(1)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black"
                      >
                        Continue to Next Step &rarr;
                      </button>
                    );
                  }
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
                  return (
                    <button
                      onClick={() => advanceStep(currentStep)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white text-sm font-black"
                    >
                      I&apos;ve Read This Section &rarr; Continue
                    </button>
                  );
                })()}
              </div>
            )}

            {displayTab === 'mcq-lab' && (
              <McqLabStep
                nodeId={nodeId}
                onComplete={() => advanceStep(12)}
              />
            )}

            {displayTab === 'mains' && currentStep === 13 && (
              <div className="space-y-6">
                <PrelimsPyqPanel nodeId={nodeId} subject={subject} />
                <MainsPracticeStep
                  nodeId={nodeId}
                  onComplete={() => advanceStep(13)}
                />
              </div>
            )}

            {displayTab === 'mains' && currentStep === 14 && (
              <GrowthReportStep
                nodeId={nodeId}
                onComplete={() => advanceStep(14)}
              />
            )}

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
