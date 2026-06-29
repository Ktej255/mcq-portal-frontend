"use client";

import { useState } from "react";
import type { ContentSectionOut } from "@/services/api/gsLmsService";
import { RichBlocks } from "./RichBlockRenderer";

interface ContentSectionsProps {
  sections: ContentSectionOut[];
  onComplete: (sectionId: number) => void;
}

/**
 * Horizontal-tab layout for a topic's content sections (Basic / Advanced /
 * NCERT Level / Examiner Traps). Free navigation — the student can click any
 * section at any time (no sequential locking), with completion ticks shown on
 * each tab. The active section renders its rich content blocks below.
 */
export function ContentSections({ sections, onComplete }: ContentSectionsProps) {
  const ordered = [...sections].sort((a, b) => a.display_order - b.display_order);
  const [activeId, setActiveId] = useState<number | null>(
    ordered[0]?.section_id ?? null,
  );

  if (ordered.length === 0) return null;

  const active = ordered.find((s) => s.section_id === activeId) ?? ordered[0];

  return (
    <div>
      {/* Horizontal tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-[#dcd5c7]">
        {ordered.map((s) => {
          const isActive = s.section_id === active.section_id;
          return (
            <button
              key={s.section_id}
              type="button"
              onClick={() => setActiveId(s.section_id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-[#1d9e75] text-[#1a3a2a]"
                  : "border-transparent text-[#13251d]/50 hover:text-[#1a3a2a]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {s.completed ? <span className="text-[#1d9e75]">✓</span> : null}
                {s.section_label.replace(/_/g, " ")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active section content */}
      <div className="mt-4 rounded-xl border border-[#dcd5c7] bg-[#fffdf8] p-5">
        <h2 className="mb-4 text-base font-semibold text-[#13251d]">{active.title}</h2>
        <RichBlocks blocks={active.blocks} />
        {!active.completed && (
          <button
            type="button"
            onClick={() => onComplete(active.section_id)}
            className="mt-5 w-full rounded-lg bg-[#1d9e75] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#178a65]"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}
