"use client";

import { useState } from "react";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { SyllabusNodeRow } from "./SyllabusNodeRow";

interface SyllabusTreeProps {
  tree: SyllabusNodeOut[];
  onLeafClick: (nodeId: number) => void;
  reviewTestHref?: string;
}

export function SyllabusTree({ tree, onLeafClick, reviewTestHref }: SyllabusTreeProps) {
  // Mega-topics start collapsed, others start expanded
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    const addNonMega = (nodes: SyllabusNodeOut[]) => {
      for (const node of nodes) {
        if (node.node_type !== "MEGA_TOPIC" && node.children.length > 0) {
          initial.add(node.node_id);
        }
        addNonMega(node.children);
      }
    };
    addNonMega(tree);
    return initial;
  });

  const getAllParentNodeIds = (nodes: SyllabusNodeOut[]): number[] => {
    const ids: number[] = [];
    const traverse = (list: SyllabusNodeOut[]) => {
      for (const node of list) {
        if (node.children && node.children.length > 0) {
          ids.push(node.node_id);
          traverse(node.children);
        }
      }
    };
    traverse(nodes);
    return ids;
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(getAllParentNodeIds(tree)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const toggleNode = (nodeId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNodes = (nodes: SyllabusNodeOut[], depth: number) => {
    return nodes.map((node) => {
      const isExpanded = expandedIds.has(node.node_id);
      return (
        <div key={node.node_id} role="group">
          <SyllabusNodeRow
            node={node}
            depth={depth}
            expanded={isExpanded}
            onToggle={() => toggleNode(node.node_id)}
            onLeafClick={onLeafClick}
            reviewTestHref={reviewTestHref}
          />
          {isExpanded && node.children.length > 0 && (
            <div>{renderNodes(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  const allParentIds = getAllParentNodeIds(tree);
  const isAllExpanded = allParentIds.length > 0 && expandedIds.size >= allParentIds.length;

  return (
    <div className="bg-[#fffdf8] rounded-xl border border-[#dcd5c7] p-2.5 sm:p-3.5 shadow-2xs space-y-2" role="tree">
      {/* Quick Tree Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-[#dcd5c7]/60 px-1">
        <span className="text-[11px] sm:text-xs font-semibold text-[#13251d]/60">
          Syllabus Navigation Tree
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={isAllExpanded ? handleCollapseAll : handleExpandAll}
            className="inline-flex min-h-11 items-center px-3 py-1.5 rounded-md border border-[#dcd5c7] bg-white text-xs font-bold text-[#1a3a2a] hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            {isAllExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>
      </div>

      {tree.length === 0 ? (
        <div className="py-8 text-center text-xs sm:text-sm text-[#13251d]/60">
          No topics match your current search query.
        </div>
      ) : (
        <div className="space-y-0.5">
          {renderNodes(tree, 0)}
        </div>
      )}
    </div>
  );
}
