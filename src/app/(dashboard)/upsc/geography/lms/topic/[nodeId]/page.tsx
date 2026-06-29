"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { TopicSectionsOut } from "@/services/api/gsLmsService";
import { ContentSections } from "@/components/gs-lms/ContentSections";
import { PYQPanel } from "@/components/gs-lms/PYQPanel";
import { PdfDownloadButton } from "@/components/gs-lms/PdfDownloadButton";
import { DiscussionOverlay } from "@/components/gs-lms/DiscussionOverlay";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";
import { VideoPlayer } from "@/components/gs-lms/VideoPlayer";
import { useApiConfig } from "@/lib/hooks/useApi";

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
  // Set forceGatePassed FIRST so that even if the backend still returns
  // discussion_gate_passed=false, we skip the overlay and show content.
  const handleGateComplete = useCallback(() => {
    setForceGatePassed(true);
    fetchSections();
  }, [fetchSections]);

  const handleSectionComplete = async (sectionId: number) => {
    try {
      await gsLmsService.completeSection("geography", nodeId, sectionId);
      // Refetch to get updated lock/complete states
      fetchSections();
    } catch {
      // Silently handle — user can retry
    }
  };

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

  // Discussion gate — must pass before seeing content.
  // forceGatePassed lets the UI bypass a stale backend flag after the student clicks Proceed.
  if (!data.discussion_gate_passed && !forceGatePassed) {
    return <DiscussionOverlay nodeId={nodeId} topicTitle={data.title} onComplete={handleGateComplete} />;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page title */}
      <h1 className="text-xl font-semibold text-[#1a3a2a]">{data.title}</h1>

      {/* Video player — rendered only when topic has a video */}
      {data.video_url && (
        <VideoPlayer
          videoUrl={data.video_url}
          watched={data.video_watched}
          nodeId={nodeId}
          onWatched={fetchSections}
        />
      )}

      {/* Progressive-disclosure sections */}
      <ContentSections sections={data.sections} onComplete={handleSectionComplete} />

      {/* PYQ Panel */}
      <PYQPanel nodeId={nodeId} />

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
