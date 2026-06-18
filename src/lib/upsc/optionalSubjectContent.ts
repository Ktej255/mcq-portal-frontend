import {
  optionalSubjectsContent,
  type OptionalSubjectContent,
  type OptionalPaperContent,
  type OptionalTopicSection,
} from "./generated/optionalSubjectsContent";

export type { OptionalSubjectContent, OptionalPaperContent, OptionalTopicSection };

/** Real Paper I/II syllabus content sourced from saritclasses.com, or null if not available. */
export function getOptionalSubjectContent(slug: string): OptionalSubjectContent | null {
  const content = optionalSubjectsContent[slug];
  return content && content.papers?.length ? content : null;
}

export function hasOptionalSubjectContent(slug: string): boolean {
  return Boolean(getOptionalSubjectContent(slug));
}

export function optionalSubjectTopicCount(slug: string): number {
  const content = getOptionalSubjectContent(slug);
  if (!content) return 0;
  return content.papers.reduce(
    (total, paper) => total + paper.sections.reduce((sum, section) => sum + section.topics.length, 0),
    0,
  );
}
