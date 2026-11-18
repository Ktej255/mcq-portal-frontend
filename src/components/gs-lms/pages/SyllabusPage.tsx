"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import { apiErrorMessage } from "@/services/api/error";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { useProgression } from "@/hooks/useProgression";
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
  const { progression } = useProgression(subject);
  const dueCheckpoint = progression?.due_checkpoint ?? null;
  const reviewTestHref = dueCheckpoint ? `${lmsBase}/checkpoint/${dueCheckpoint.checkpoint_id}` : undefined;

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
          className="mt-3 inline-flex min-h-11 items-center rounded-md border border-[#dcd5c7] bg-white px-4 py-2 text-xs font-bold text-[#1a3a2a] transition hover:border-[#1d9e75] hover:bg-[#e7f5ee]"
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
    <div className="py-4 sm:py-6 px-1 sm:px-0 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a3a2a]">
            {label} Syllabus
          </h1>
          <p className="text-xs sm:text-sm text-[#13251d]/60 mt-0.5">
            Structured syllabus roadmap with verified Prelims & Mains PYQ demand mapping
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {progression?.next_leaf && (
            <Link
              href={`${lmsBase}/topic/${progression.next_leaf.node_id}`}
              data-testid="continue-topic"
              className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-[#1a3a2a] px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:bg-[#1d9e75] active:scale-[0.98]"
            >
              Continue: {progression.next_leaf.title} &rarr;
            </Link>
          )}
          <Link
            href={`${lmsBase}/planner`}
            className="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-[#1d9e75] bg-[#e7f5ee] px-4 py-2 text-xs sm:text-sm font-bold text-[#085041] transition hover:bg-[#1d9e75] hover:text-white active:scale-[0.98] shadow-2xs"
          >
            📅 Today&apos;s Plan
          </Link>
        </div>
      </div>

      {progression && (
        <div className="mb-4" data-testid="progression-summary">
          <div className="flex items-center justify-between text-xs font-bold text-[#536259]">
            <span>
              {progression.mastered_count} / {progression.total_leaves} topics mastered
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-[#dcd5c7]">
            <div
              className="h-full rounded-full bg-[#1d9e75] transition-all"
              style={{
                width: `${progression.total_leaves ? (progression.mastered_count / progression.total_leaves) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {dueCheckpoint && reviewTestHref && (
        <div
          data-testid="checkpoint-due"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-amber-900">
            A review test is due: {dueCheckpoint.sub_topic_title} ({dueCheckpoint.leaves.map((l) => l.title).join(", ")})
          </p>
          <Link
            href={reviewTestHref}
            className="rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1d9e75]"
          >
            Take review test
          </Link>
        </div>
      )}

      {/* Search filter with touch-friendly clear */}
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#13251d]/40">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics (e.g. Plate Tectonics, Monsoons)..."
          className="w-full min-h-11 pl-10 pr-10 py-2 text-base sm:text-sm border border-[#dcd5c7] rounded-xl outline-none focus:border-[#1d9e75] focus:ring-1 focus:ring-[#1d9e75] bg-white shadow-2xs"
        />
        {search.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#13251d]/40 hover:text-[#13251d] min-w-11 min-h-11 justify-center"
            aria-label="Clear search"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-700">
              ✕
            </span>
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 sm:gap-2.5 text-xs font-bold">
        <span className="px-3 py-1.5 rounded-lg bg-[#e7f5ee] text-[#085041] border border-[#1d9e75]/20">
          ✅ {completedCount} completed
        </span>
        {betaScoped ? (
          <>
            <span className="px-3 py-1.5 rounded-lg bg-[#e7f5ee] text-[#085041] border border-[#1d9e75]/20">
              {betaOpenCount} open now
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#f3e4c8] text-[#7a5a1e] border border-[#ef9f27]/30">
              {betaLockedCount} in preparation
            </span>
          </>
        ) : (
          <span className="px-3 py-1.5 rounded-lg bg-[#f7f4ee] text-[#13251d] border border-[#dcd5c7]">
            📖 {totalLeafCount - completedCount} remaining
          </span>
        )}
        <span className="px-3 py-1.5 rounded-lg bg-[#f7f4ee] text-[#13251d] border border-[#dcd5c7]">
          {totalLeafCount} total topics
        </span>
      </div>

      {betaScoped && betaLockedCount > 0 && (
        <div className="rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-3.5 sm:p-4 text-xs text-[#536259] space-y-1 shadow-2xs">
          <p>
            <span className="font-bold text-[#1a3a2a]">Beta Curriculum Scope:</span> Topics marked <span className="font-bold text-[#7a5a1e]">Soon</span> remain on the map so you see the complete UPSC syllabus. They open as their verified study notes, PYQ demand analysis, and 15-question practice labs pass peer review.
          </p>
          <p className="text-[11px] text-[#536259]/80">
            Demand indicators: <span className="font-semibold text-[#1a3a2a]">P</span> = reviewed Prelims PYQs · <span className="font-semibold text-[#1a3a2a]">M</span> = reviewed Mains PYQs.
          </p>
        </div>
      )}

      <p className="mb-4 max-w-2xl text-xs text-[#536259]">
        Demand evidence: <span className="font-semibold">P</span> = reviewed
        Prelims PYQs, <span className="font-semibold">M</span> = reviewed Mains
        PYQs (counted at lower weight). A leaf with no P/M chip has no measured
        demand yet; its weighted demand share is on the topic page.
      </p>

      <SyllabusTree tree={filteredTree} onLeafClick={handleLeafClick} reviewTestHref={reviewTestHref} />
    </div>
  );
}
