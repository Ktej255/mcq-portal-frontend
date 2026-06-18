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


// ─── Study plan + spaced revision (generated from the subject's syllabus) ───
export type StudyDay = { day: number; kind: "study" | "revision"; title: string; detail: string };

export function buildStudyPlan(papers: LmsPaper[]): StudyDay[] {
  const modules = papers.flatMap((p) => p.modules.map((m) => ({ paper: p.paper, title: m.title, count: m.lessons.length })));
  const days: StudyDay[] = [];
  let day = 1;
  modules.forEach((m, i) => {
    days.push({
      day: day++,
      kind: "study",
      title: `${m.paper}: ${m.title}`,
      detail: `${m.count} topic${m.count === 1 ? "" : "s"} — learn, recall to 95%, then a fresh practice answer.`,
    });
    if ((i + 1) % 4 === 0) {
      days.push({
        day: day++,
        kind: "revision",
        title: "Spaced revision",
        detail: "Revisit the last 4 modules with active recall + 5 short practice answers.",
      });
    }
  });
  return days;
}
