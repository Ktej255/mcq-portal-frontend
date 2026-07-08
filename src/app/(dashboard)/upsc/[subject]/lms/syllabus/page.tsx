"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsLmsService } from "@/services/api/gsLmsService";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { SyllabusTree } from "@/components/gs-lms/SyllabusTree";
import { LmsLoadingSkeleton } from "@/components/gs-lms/LmsLoadingSkeleton";
import { LmsEmptyState } from "@/components/gs-lms/LmsEmptyState";
import { useApiConfig } from "@/lib/hooks/useApi";
import { useSubjectLms } from "@/components/gs-lms/SubjectLmsContext";

export default function SyllabusPage() {
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
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load syllabus")
      )
      .finally(() => setLoading(false));
  }, [subject]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchSyllabus();
  }, [isLoaded, isSignedIn, fetchSyllabus]);

  const handleLeafClick = (nodeId: number) => {
    router.push(`${lmsBase}/topic/${nodeId}`);
  };

  // Count leaf topics and completed ones
  const countLeaves = (nodes: SyllabusNodeOut[]): { total: number; completed: number } => {
    let total = 0;
    let completed = 0;
    for (const node of nodes) {
      if (node.node_type === "LEAF_TOPIC") {
        total++;
        if (node.completed) completed++;
      }
      const childCounts = countLeaves(node.children);
      total += childCounts.total;
      completed += childCounts.completed;
    }
    return { total, completed };
  };

  const { total: totalLeafCount, completed: completedCount } = countLeaves(tree);

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
        <span className="px-2 py-1 rounded-md bg-[#f7f4ee] text-[#13251d]">
          📖 {totalLeafCount - completedCount} remaining
        </span>
        <span className="px-2 py-1 rounded-md bg-[#f7f4ee] text-[#13251d]">
          {totalLeafCount} total topics
        </span>
      </div>

      <SyllabusTree tree={filteredTree} onLeafClick={handleLeafClick} />
    </div>
  );
}
