"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { apiErrorMessage } from "@/services/api/error";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { SyllabusTree } from "../SyllabusTree";
import { LmsLoadingSkeleton } from "../LmsLoadingSkeleton";
import { LmsEmptyState } from "../LmsEmptyState";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "../SubjectLmsContext";

export function SyllabusPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useApiConfig();
  const { subject, label, lmsBase } = useSubjectLms();
  const [tree, setTree] = useState<SyllabusNodeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchSyllabus = useCallback(() => {
    setLoading(true);
    setError(null);
    gsLmsService
      .getSyllabusTree(subject)
      .then((data) => setTree(data.tree))
      .catch((err) => setError(apiErrorMessage(err, "Failed to load syllabus")))
      .finally(() => setLoading(false));
  }, [subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => fetchSyllabus());
  }, [isLoaded, isSignedIn, fetchSyllabus]);

  const handleLeafClick = (nodeId: number) => {
    router.push(`${lmsBase}/topic/${nodeId}`);
  };

  // Count leaf topics, completed ones, and paid-beta availability
  const countLeaves = (
    nodes: SyllabusNodeOut[]
  ): { total: number; completed: number; betaOpen: number; betaLocked: number } => {
    let total = 0;
    let completed = 0;
    let betaOpen = 0;
    let betaLocked = 0;
    for (const node of nodes) {
      if (node.node_type === "LEAF_TOPIC") {
        total++;
        if (node.completed) completed++;
        if (node.beta_ready === true) betaOpen++;
        else if (node.beta_ready === false) betaLocked++;
      }
      const childCounts = countLeaves(node.children);
      total += childCounts.total;
      completed += childCounts.completed;
      betaOpen += childCounts.betaOpen;
      betaLocked += childCounts.betaLocked;
    }
    return { total, completed, betaOpen, betaLocked };
  };

  const {
    total: totalLeafCount,
    completed: completedCount,
    betaOpen: betaOpenCount,
    betaLocked: betaLockedCount,
  } = countLeaves(tree);
  const betaScoped = betaOpenCount + betaLockedCount > 0;

  // Filter tree by search
  const filterTree = (nodes: SyllabusNodeOut[], query: string): SyllabusNodeOut[] => {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes
      .map((node) => {
        const titleMatch = node.title.toLowerCase().includes(q);
        const filteredChildren = filterTree(node.children, query);
        if (titleMatch || filteredChildren.length > 0) {
          return { ...node, children: titleMatch ? node.children : filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as SyllabusNodeOut[];
  };

  const filteredTree = filterTree(tree, search);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">{label} Syllabus</h1>
        <LmsLoadingSkeleton variant="tree" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchSyllabus}
          className="mt-3 rounded-md border border-[#dcd5c7] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a] mb-6">{label} Syllabus</h1>
        <LmsEmptyState
          title="No syllabus available"
          description={`The ${label.toLowerCase()} syllabus hasn't been set up yet. Check back soon.`}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-[#1a3a2a]">{label} Syllabus</h1>
        <div className="flex items-center gap-2">
          <a
            href={`${lmsBase}/planner`}
            className="inline-flex items-center gap-2 rounded-md border border-[#1d9e75] bg-[#e7f5ee] px-3 py-2 text-xs font-bold text-[#085041] transition hover:bg-[#1d9e75] hover:text-white"
          >
            📅 Today&apos;s Plan
          </a>
        </div>
      </div>

      {/* Search filter */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics..."
          className="w-full max-w-sm px-3 py-2 text-sm border border-[#dcd5c7] rounded-lg outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] bg-white"
        />
      </div>

      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs font-bold text-[#536259]">
        <span className="px-2 py-1 rounded-md bg-[#e7f5ee] text-[#085041]">
          ✅ {completedCount} completed
        </span>
        {betaScoped ? (
          <>
            <span className="px-2 py-1 rounded-md bg-[#e7f5ee] text-[#085041]">
              {betaOpenCount} open now
            </span>
            <span className="px-2 py-1 rounded-md bg-[#f3e4c8] text-[#7a5a1e]">
              {betaLockedCount} in preparation
            </span>
          </>
        ) : (
          <span className="px-2 py-1 rounded-md bg-[#f7f4ee] text-[#13251d]">
            📖 {totalLeafCount - completedCount} remaining
          </span>
        )}
        <span className="px-2 py-1 rounded-md bg-[#f7f4ee] text-[#13251d]">
          {totalLeafCount} total topics
        </span>
      </div>

      {betaScoped && betaLockedCount > 0 && (
        <p className="mb-2 max-w-2xl text-xs text-[#536259]">
          Topics marked <span className="font-semibold">Soon</span> are still
          being authored. They stay on the map so you can see the full syllabus,
          and they open one by one as their content, PYQ demand, and 15-question
          practice lab pass review. Nothing is hidden and nothing is a dead end.
        </p>
      )}

      <p className="mb-4 max-w-2xl text-xs text-[#536259]">
        Demand evidence: <span className="font-semibold">P</span> = reviewed
        Prelims PYQs, <span className="font-semibold">M</span> = reviewed Mains
        PYQs (counted at lower weight). A leaf with no P/M chip has no measured
        demand yet; its weighted demand share is on the topic page.
      </p>

      <SyllabusTree tree={filteredTree} onLeafClick={handleLeafClick} />
    </div>
  );
}
