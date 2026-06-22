"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";
import { LmsEmptyState } from "@/components/gs-lms/LmsEmptyState";

export default function PracticeTopicSelectorPage() {
  const router = useRouter();
  const [leafTopics, setLeafTopics] = useState<SyllabusNodeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gsLmsService
      .getSyllabusTree()
      .then((data) => {
        // Extract all leaf topics from the tree
        const leaves: SyllabusNodeOut[] = [];
        const collectLeaves = (nodes: SyllabusNodeOut[]) => {
          for (const node of nodes) {
            if (node.node_type === "LEAF_TOPIC") {
              leaves.push(node);
            }
            if (node.children.length > 0) {
              collectLeaves(node.children);
            }
          }
        };
        collectLeaves(data.tree);
        setLeafTopics(leaves);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load topics")
      )
      .finally(() => setLoading(false));
  }, []);

  const handleStartPractice = async (nodeId: number) => {
    setStarting(nodeId);
    try {
      const session = await gsLmsService.startPractice(nodeId);
      // Store session so the session page can restore on mount
      sessionStorage.setItem(
        `practice-session-${session.session_id}`,
        JSON.stringify(session)
      );
      router.push(`/upsc/geography/lms/practice/${session.session_id}`);
    } catch {
      setStarting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">Practice</h1>
        <LmsLoadingSkeleton variant="list" />
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

  if (leafTopics.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">Practice</h1>
        <LmsEmptyState
          title="No topics available"
          description="Complete onboarding and explore the syllabus first."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-[#1a3a2a] mb-2">Practice</h1>
      <p className="text-sm text-[#13251d]/60 mb-6">
        Select a topic to start a practice session.
      </p>

      <div className="space-y-2">
        {leafTopics.map((topic) => (
          <div
            key={topic.node_id}
            className="flex items-center justify-between p-4 rounded-lg border border-[#dcd5c7] bg-[#fffdf8] hover:border-[#1d9e75]/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-[#1a3a2a]">{topic.title}</p>
              {topic.completion_percent != null && (
                <p className="text-xs text-[#13251d]/50 mt-0.5">
                  {Math.round(topic.completion_percent)}% completed
                </p>
              )}
            </div>
            <button
              onClick={() => handleStartPractice(topic.node_id)}
              disabled={starting === topic.node_id}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg transition-colors disabled:opacity-50"
            >
              {starting === topic.node_id ? "Starting…" : "Start Practice"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
