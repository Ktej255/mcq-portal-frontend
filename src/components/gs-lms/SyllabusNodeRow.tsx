"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
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
  // A leaf outside the paid-beta scope stays visible (so the learner can see
  // what is coming) but is not enterable until its gates pass.
  const locked = isLeaf && node.beta_ready === false;

  const badgeColors: Record<string, string> = {
    MEGA_TOPIC: "bg-[#1a3a2a] text-white",
    SUB_TOPIC: "bg-[#1d9e75]/20 text-[#085041]",
    LEAF_TOPIC: "bg-[#dcd5c7] text-[#13251d]",
  };

  const handleClick = () => {
    if (locked) {
      return;
    }
    if (isLeaf) {
      if (isLocked) return; // locked topics are not opened from the tree
      onLeafClick(node.node_id);
    } else if (hasChildren) {
      onToggle();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
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
      className={`min-h-11 flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg transition-colors pl-[calc(var(--node-depth)*10px+6px)] sm:pl-[calc(var(--node-depth)*18px+8px)] ${
        locked ? "opacity-60 cursor-not-allowed" : isLocked ? "" : "cursor-pointer"
      } ${rowBg}`}
      style={{ "--node-depth": depth } as CSSProperties}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={locked ? -1 : 0}
      role="treeitem"
      aria-expanded={!isLeaf ? expanded : undefined}
      aria-selected={false}
      aria-disabled={locked || isLocked || undefined}
      title={
        locked
          ? "Still being authored. It opens once its content, PYQ demand, and 15-question practice lab pass review."
          : isLocked
            ? node.lock_reason ?? "Locked"
            : undefined
      }
      data-locked={isLocked || undefined}
    >
      {/* Expand/Collapse toggle */}
      {hasChildren && !isLeaf ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-8 h-8 sm:w-7 sm:h-7 -ml-1 flex items-center justify-center text-[#13251d] shrink-0 rounded-lg hover:bg-black/5 active:bg-black/10 transition-colors touch-manipulation"
          aria-label={expanded ? `Collapse ${node.title}` : `Expand ${node.title}`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <span className="w-5 sm:w-6 shrink-0" />
      )}

      {/* Title */}
      <span className="flex-1 min-w-0">
        <span
          className={`block text-xs sm:text-sm font-semibold break-words sm:truncate ${isLocked ? "text-[#5d675f]" : "text-[#13251d]"}`}
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

      {/* Reviewed PYQ evidence: the demand question, answered per leaf. */}
      {isLeaf && (node.prelims_pyq_count > 0 || node.mains_pyq_count > 0) && (
        <span
          className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 border border-[#dcd5c7] bg-[#f7f4ee] text-[#536259]"
          title={`Demand evidence: ${node.prelims_pyq_count} reviewed Prelims PYQ${
            node.prelims_pyq_count === 1 ? "" : "s"
          } and ${node.mains_pyq_count} reviewed Mains PYQ${
            node.mains_pyq_count === 1 ? "" : "s"
          } (Mains counted at lower weight)`}
        >
          {node.prelims_pyq_count}P
          {node.mains_pyq_count > 0 ? ` · ${node.mains_pyq_count}M` : ""}
        </span>
      )}

      {/* Node type badge - for leaf topics, hidden on mobile to maximize title space */}
      <span
        className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase shrink-0 ${
          isLeaf ? "hidden sm:inline-flex" : "inline-flex"
        } ${badgeColors[node.node_type]}`}
      >
        {node.node_type === "MEGA_TOPIC"
          ? "Unit"
          : node.node_type === "SUB_TOPIC"
            ? "Module"
            : "Topic"}
      </span>

      {/* Beta availability badge */}
      {locked && (
        <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase shrink-0 bg-[#f3e4c8] text-[#7a5a1e]">
          Soon
        </span>
      )}

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
      {isLeaf ? (
        locked || isLocked ? (
          <svg
            className="w-5 h-5 text-[#a39a86] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            role="img"
            aria-label={locked ? "Not open yet" : "Locked"}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        ) : node.completed ? (
          <svg className="w-5 h-5 text-[#1d9e75] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="w-5 h-5 rounded-full border-2 border-[#dcd5c7] shrink-0" />
        )
      ) : (
        <div className="w-14 sm:w-20 h-2 bg-[#dcd5c7] rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[#1d9e75] rounded-full transition-all"
            style={{ width: `${node.completion_percent ?? 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
