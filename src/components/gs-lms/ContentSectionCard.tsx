"use client";

import type { ContentSectionOut, ContentBlock } from "@/services/api/gsLmsService";

interface ContentSectionCardProps {
  section: ContentSectionOut;
  isActive: boolean;
  onComplete: (sectionId: number) => void;
}

function renderBlock(block: ContentBlock, index: number) {
  const type = block.type as string | undefined;
  const text = block.text as string | undefined;

  if (type === "heading" || type === "h2" || type === "h3") {
    return (
      <h3 key={index} className="text-base font-semibold text-[#13251d] mt-4 mb-2">
        {text}
      </h3>
    );
  }

  return (
    <p key={index} className="text-sm text-[#13251d]/80 leading-relaxed mb-3">
      {text ?? JSON.stringify(block)}
    </p>
  );
}

export function ContentSectionCard({ section, isActive, onComplete }: ContentSectionCardProps) {
  // Completed state
  if (section.completed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1d9e75]/30 bg-[#1d9e75]/5">
        <svg className="w-5 h-5 text-[#1d9e75] shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-[#1d9e75]">{section.title}</span>
        <span className="ml-auto text-xs text-[#1d9e75]/70 uppercase font-semibold">
          {section.section_label.replace("_", " ")}
        </span>
      </div>
    );
  }

  // Locked state
  if (section.locked) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#dcd5c7] bg-[#f7f4ee]/50 opacity-60">
        <svg className="w-5 h-5 text-[#dcd5c7] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span className="text-sm font-medium text-[#13251d]/50">{section.title}</span>
        <span className="ml-auto text-xs text-[#13251d]/30 uppercase font-semibold">
          {section.section_label.replace("_", " ")}
        </span>
      </div>
    );
  }

  // Active state (expanded with content)
  return (
    <div className="rounded-xl border-2 border-[#1d9e75] bg-[#fffdf8] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#13251d]">{section.title}</h2>
        <span className="text-xs text-[#1d9e75] uppercase font-semibold">
          {section.section_label.replace("_", " ")}
        </span>
      </div>

      {/* Content blocks */}
      <div className="mb-5">
        {section.blocks?.map((block, i) => renderBlock(block, i))}
      </div>

      {/* Mark Complete button */}
      {isActive && (
        <button
          onClick={() => onComplete(section.section_id)}
          className="w-full py-2.5 text-sm font-medium text-white bg-[#1d9e75] hover:bg-[#178a65] rounded-lg transition-colors"
        >
          Mark Complete
        </button>
      )}
    </div>
  );
}
