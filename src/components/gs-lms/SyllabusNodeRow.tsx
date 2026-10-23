"use client";

import Link from "next/link";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";

interface SyllabusNodeRowProps {
  node: SyllabusNodeOut;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  onLeafClick: (nodeId: number) => void;
  /** Where "Take review test" goes when a due review test is what locks a topic. */
  reviewTestHref?: string;
}

export function SyllabusNodeRow({
  node,
  depth,
  expanded,
  onToggle,
  onLeafClick,
  reviewTestHref,
}: SyllabusNodeRowProps) {
  const isLeaf = node.node_type === "LEAF_TOPIC";
  const isLocked = isLeaf && node.locked === true;
  const needsReviewTest = isLocked && /review test/i.test(node.lock_reason ?? "");
  const hasChildren = node.children && node.children.length > 0;

  const badgeColors: Record<string, string> = {
    MEGA_TOPIC: "bg-[#1a3a2a] text-white",
    SUB_TOPIC: "bg-[#1d9e75]/20 text-[#1a3a2a]",
    LEAF_TOPIC: "bg-[#dcd5c7] text-[#13251d]",
  };

  const handleClick = () => {
    if (isLeaf) {
      if (isLocked) return; // locked topics are not opened from the tree
      onLeafClick(node.node_id);
    } else if (hasChildren) {
      onToggle();
    }
  };

  // Color-coded row background based on completion status
  const rowBg = isLocked
    ? "bg-[#f7f4ee]/60 cursor-not-allowed"
    : isLeaf
    ? node.completed
      ? "hover:bg-[#e7f5ee] bg-[#e7f5ee]/30"
      : "hover:bg-[#f7f4ee]"
    : (node.completion_percent ?? 0) > 0
      ? "hover:bg-[#e7f5ee]/50"
      : "hover:bg-[#f7f4ee]";

  return (
    <div
      className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg transition-colors ${isLocked ? "" : "cursor-pointer"} ${rowBg}`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={handleClick}
      role="treeitem"
      aria-expanded={!isLeaf ? expanded : undefined}
      aria-disabled={isLocked || undefined}
      title={isLocked ? node.lock_reason ?? "Locked" : undefined}
      data-locked={isLocked || undefined}
    >
      {/* Expand/Collapse toggle */}
      {hasChildren && !isLeaf ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[#13251d] shrink-0"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <span className="w-4 md:w-5 shrink-0" />
      )}

      {/* Title */}
      <span className="flex-1 min-w-0">
        <span
          className={`block text-xs md:text-sm font-medium truncate ${isLocked ? "text-[#5d675f]" : "text-[#13251d]"}`}
        >
          {node.title}
        </span>
        {isLocked && (
          <span data-testid="lock-reason" className="block text-[11px] leading-snug text-[#7a6a4f]">
            {node.lock_reason}
            {needsReviewTest && reviewTestHref && (
              <>
                {" "}
                <Link
                  href={reviewTestHref}
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-[#1d9e75] underline"
                >
                  Take review test
                </Link>
              </>
            )}
          </span>
        )}
      </span>

      {/* Node type badge */}
      <span
        className={`text-[9px] md:text-[10px] font-semibold px-1.5 md:px-2 py-0.5 rounded-full uppercase shrink-0 ${badgeColors[node.node_type]}`}
      >
        {node.node_type.replace("_", " ")}
      </span>

      {isLeaf && node.mastered && (
        <span className="text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-[#1d9e75] text-white shrink-0">
          Mastered
        </span>
      )}
      {isLeaf && node.completed && node.mastered === false && (
        <span
          className="text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0"
          title="Score 60% in the MCQ lab to master this topic"
        >
          Not mastered
        </span>
      )}

      {/* Progress or completion indicator */}
      {isLocked ? (
        <svg
          className="w-4 h-4 md:w-5 md:h-5 text-[#7a6a4f] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          role="img"
          aria-label="Locked"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path strokeLinecap="round" d="M8 11V8a4 4 0 118 0v3" />
        </svg>
      ) : isLeaf ? (
        node.completed ? (
          <svg className="w-4 h-4 md:w-5 md:h-5 text-[#1d9e75] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-[#dcd5c7] shrink-0" />
        )
      ) : (
        <div className="w-14 md:w-20 h-1.5 md:h-2 bg-[#dcd5c7] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[#1d9e75] rounded-full transition-all"
            style={{ width: `${node.completion_percent ?? 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
