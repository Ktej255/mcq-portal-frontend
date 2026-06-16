// Generic course-player data for ANY optional subject.
// Geography keeps its bespoke Paper I/II split; every other subject is built
// directly from its scraped syllabus (optionalSubjectsContent).
import { getOptionalSubjectContent } from "./optionalSubjectContent";
import {
  GEOGRAPHY_FREE_LESSON_COUNT,
  GEOGRAPHY_OPTIONAL_SLUG,
  getGeographyPapers,
  type LmsPaper,
} from "./optionalGeographyLms";

export function getOptionalCoursePapers(slug: string): LmsPaper[] {
  if (slug === GEOGRAPHY_OPTIONAL_SLUG) return getGeographyPapers();

  const content = getOptionalSubjectContent(slug);
  if (!content) return [];

  let lessonIndex = 0;
  return content.papers.map((paper, pi) => ({
    paper: paper.paper,
    subtitle: paper.paper.toLowerCase().includes("paper") ? `${paper.sections.length} sections` : "Syllabus",
    modules: paper.sections.map((section, si) => ({
      id: `p${pi}-m${si}`,
      title: section.heading,
      lessons: section.topics.map((topic, ti) => {
        const free = lessonIndex < GEOGRAPHY_FREE_LESSON_COUNT;
        lessonIndex += 1;
        return { id: `p${pi}-m${si}-l${ti}`, title: topic, durationLabel: "Video coming soon", free };
      }),
    })),
  }));
}
