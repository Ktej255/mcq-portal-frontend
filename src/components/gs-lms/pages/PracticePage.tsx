"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { apiErrorMessage } from "@/services/api/error";
import type {
  ReadinessTopicOut,
  SyllabusNodeOut,
} from "@/services/api/gsLmsService";
import { LmsLoadingSkeleton } from "../LmsLoadingSkeleton";
import { LmsEmptyState } from "../LmsEmptyState";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

/** One compact line of reviewed-PYQ evidence for a practice row. */
function demandSummary(row: ReadinessTopicOut): string {
  const counted = row.pyq_count + row.mains_pyq_count;
  if (counted === 0) return "demand not measured";
  const parts: string[] = [];
  if (row.pyq_count > 0) parts.push(`${row.pyq_count} Prelims`);
  if (row.mains_pyq_count > 0) parts.push(`${row.mains_pyq_count} Mains`);
  return `${parts.join(" + ")} PYQ${counted === 1 ? "" : "s"} · ${
    Math.round(row.demand_share_pct * 10) / 10
  }% of demand`;
}

export function PracticePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, lmsBase } = useSubjectLms();
  const [leafTopics, setLeafTopics] = useState<SyllabusNodeOut[]>([]);
  // null means demand evidence could not be loaded; practice still works.
  const [demandByNode, setDemandByNode] = useState<
    Record<number, ReadinessTopicOut> | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [startError, setStartError] = useState<{ nodeId: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(() => {
    setLoading(true);
    setError(null);
    setDemandByNode(null);
    // Demand is context, not a gate: a readiness failure must not hide the
    // topics that can actually be practised.
    Promise.allSettled([
      gsLmsService.getSyllabusTree(subject),
      gsLmsService.getReadiness(subject, { persist: false }),
    ])
      .then(([treeResult, readinessResult]) => {
        if (treeResult.status === "rejected") {
          setError(
            apiErrorMessage(treeResult.reason, "Failed to load topics"),
          );
          return;
        }
        const data = treeResult.value;
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
        if (readinessResult.status === "fulfilled") {
          const byNode: Record<number, ReadinessTopicOut> = {};
          for (const row of readinessResult.value.topics) {
            byNode[row.node_id] = row;
          }
          setDemandByNode(byNode);
        }
      })
      .finally(() => setLoading(false));
  }, [subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => fetchTopics());
  }, [isLoaded, isSignedIn, fetchTopics]);

  const handleStartPractice = async (nodeId: number) => {
    setStarting(nodeId);
    setStartError(null);
    try {
      const session = await gsLmsService.startPractice(subject, nodeId);
      sessionStorage.setItem(
        `practice-session-${subject}-${session.session_id}`,
        JSON.stringify(session)
      );
      router.push(`${lmsBase}/practice/${session.session_id}`);
    } catch (err) {
      setStarting(null);
      setStartError({
        nodeId,
        message: apiErrorMessage(err, "Couldn't start practice. Please try again."),
      });
    }
  };

  // When the paid-beta scope is active, the syllabus annotates every leaf with
  // beta_ready. Practice must follow that same gate: a topic with 14 reviewed
  // questions is still locked, and offering it would dead-end on a 409.
  const betaScoped = leafTopics.some(
    (topic) => topic.beta_ready !== null && topic.beta_ready !== undefined
  );
  const readyTopics = leafTopics.filter((topic) =>
    betaScoped ? topic.beta_ready === true : (topic.mcq_count ?? 0) > 0
  );
  const uncoveredTopics = leafTopics.filter((topic) =>
    betaScoped ? topic.beta_ready === false : (topic.mcq_count ?? 0) === 0
  );

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
        <button
          type="button"
          onClick={fetchTopics}
          className="mt-3 inline-flex min-h-11 items-center rounded-md border border-[#dcd5c7] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
        >
          Retry
        </button>
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
    <div className="py-4 sm:py-6 px-1 sm:px-0 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a3a2a] mb-1">Practice</h1>
        <p className="text-xs sm:text-sm text-[#13251d]/65 max-w-2xl leading-relaxed">
          Answer reviewed UPSC-style questions on one topic at a time. Every
          attempt becomes accuracy evidence in your readiness report, so practice
          where your evidence is thin rather than everywhere at once.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 text-xs font-bold text-[#536259]">
        <span className="px-3 py-1.5 rounded-lg bg-[#e7f5ee] text-[#085041] border border-[#1d9e75]/20">
          {readyTopics.length} topics with practice sets
        </span>
        {uncoveredTopics.length > 0 && (
          <span className="px-3 py-1.5 rounded-lg bg-[#f7f4ee] text-[#13251d] border border-[#dcd5c7]">
            {uncoveredTopics.length}{" "}
            {betaScoped ? "in preparation" : "awaiting question coverage"}
          </span>
        )}
      </div>

      {betaScoped && readyTopics.length === 0 && uncoveredTopics.length > 0 && (
        <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-4 text-xs text-[#536259] leading-relaxed shadow-2xs">
          Practice opens topic by topic. The topics below are still being
          authored — each one becomes available once it has reviewed content,
          measured PYQ demand, and a complete 15-question reviewed lab.
        </div>
      )}

      {readyTopics.length === 0 ? (
        <LmsEmptyState
          title="Practice sets are being reviewed"
          description="No topic in this subject has a reviewed practice set yet. Read a topic and use its knowledge check for now; practice opens here as questions are reviewed."
        />
      ) : (
        <div className="space-y-3">
          {readyTopics.map((topic) => (
            <div
              key={topic.node_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] hover:border-[#1d9e75]/50 transition-colors shadow-2xs"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-bold text-[#1a3a2a]">{topic.title}</p>
                <p className="text-xs text-[#13251d]/60 mt-0.5">
                  <span className="font-semibold text-[#1a3a2a]/80">{topic.mcq_count} reviewed question{topic.mcq_count === 1 ? "" : "s"}</span>
                  {demandByNode?.[topic.node_id]
                    ? ` · ${demandSummary(demandByNode[topic.node_id])}`
                    : ""}
                  {topic.completed === true ? " · ✅ topic completed" : ""}
                </p>
                {startError?.nodeId === topic.node_id ? (
                  <div role="alert" className="mt-2 flex items-center gap-2 text-xs text-red-700">
                    <span>{startError.message}</span>
                    <button
                      type="button"
                      onClick={() => handleStartPractice(topic.node_id)}
                      disabled={starting === topic.node_id}
                      className="font-semibold underline hover:no-underline disabled:opacity-60"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleStartPractice(topic.node_id)}
                disabled={starting === topic.node_id}
                className="min-h-11 shrink-0 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
              >
                {starting === topic.node_id ? (
                  "Starting…"
                ) : (
                  <>
                    Start Practice <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {uncoveredTopics.length > 0 && (
        <details className="mt-6 rounded-xl border border-[#dcd5c7] bg-[#f7f4ee] p-4">
          <summary className="cursor-pointer text-xs font-bold text-[#536259]">
            {uncoveredTopics.length}{" "}
            {betaScoped ? "topics in preparation" : "topics awaiting question coverage"}
          </summary>
          <p className="mt-2 text-xs text-[#536259]">
            {betaScoped
              ? "These topics stay on the map and open once their reviewed content, PYQ demand, and 15-question practice lab are complete."
              : "We only open practice where reviewed questions exist. These topics are still read-only; their practice sets are a known coverage gap."}
          </p>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {uncoveredTopics.map((topic) => (
              <li key={topic.node_id} className="text-xs text-[#536259]/80">
                {topic.title}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
