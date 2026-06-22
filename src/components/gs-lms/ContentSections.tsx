"use client";

import type { ContentSectionOut } from "@/services/api/gsLmsService";
import { ContentSectionCard } from "./ContentSectionCard";

interface ContentSectionsProps {
  sections: ContentSectionOut[];
  onComplete: (sectionId: number) => void;
}

export function ContentSections({ sections, onComplete }: ContentSectionsProps) {
  // Active section = first section that is unlocked and not completed
  const activeIndex = sections.findIndex((s) => !s.locked && !s.completed);

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <ContentSectionCard
          key={section.section_id}
          section={section}
          isActive={index === activeIndex}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
