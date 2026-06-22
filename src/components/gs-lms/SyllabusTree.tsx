"use client";

import { useState } from "react";
import type { SyllabusNodeOut } from "@/services/api/gsLmsService";
import { SyllabusNodeRow } from "./SyllabusNodeRow";

interface SyllabusTreeProps {
  tree: SyllabusNodeOut[];
  onLeafClick: (nodeId: number) => void;
}

export function SyllabusTree({ tree, onLeafClick }: SyllabusTreeProps) {
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
          />
          {isExpanded && node.children.length > 0 && (
            <div>{renderNodes(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-[#fffdf8] rounded-xl border border-[#dcd5c7] p-3" role="tree">
      {renderNodes(tree, 0)}
    </div>
  );
}
