// Generic course-player data for ANY optional subject.
// Geography keeps its bespoke LMS; authored optional shells such as
// Anthropology use the curated Paper I/II structure as upload-ready slots.
// Remaining subjects fall back to scraped syllabus content when available.
import { getOptionalSubjectContent } from "./optionalSubjectContent";
import { getSubjectStructure, hasBespokeStructure } from "./optionalSubjectStructure";
import {
  GEOGRAPHY_FREE_LESSON_COUNT,
  GEOGRAPHY_OPTIONAL_SLUG,
  getGeographyPapers,
  type LmsPaper,
} from "./optionalGeographyLms";

function lessonFromTopic(topic: string, id: string, lessonIndex: number) {
  return {
    id,
    title: topic,
    durationLabel: "Video coming soon",
    free: lessonIndex < GEOGRAPHY_FREE_LESSON_COUNT,
  };
}

export function getOptionalCoursePapers(slug: string): LmsPaper[] {
  if (slug === GEOGRAPHY_OPTIONAL_SLUG) return getGeographyPapers();

  if (hasBespokeStructure(slug)) {
    const structure = getSubjectStructure(slug);
    let lessonIndex = 0;
    const paperOneModules = structure.paperOne.sections.map((section, si) => ({
      id: `p0-m${si}`,
      title: `${section.label}: ${section.title}`,
      lessons: section.topics.map((topic, ti) => {
        const lesson = lessonFromTopic(topic, `p0-m${si}-l${ti}`, lessonIndex);
        lessonIndex += 1;
        return lesson;
      }),
    }));
    const paperTwoModule = {
      id: "p1-m0",
      title: structure.paperTwo.title,
      lessons: structure.paperTwo.topics.map((topic, ti) => {
        const lesson = lessonFromTopic(topic, `p1-m0-l${ti}`, lessonIndex);
        lessonIndex += 1;
        return lesson;
      }),
    };

    return [
      {
        paper: structure.paperOne.label,
        subtitle: `${structure.paperOne.sections.length} sections`,
        modules: paperOneModules,
      },
      {
        paper: structure.paperTwo.label,
        subtitle: structure.paperTwo.title,
        modules: [paperTwoModule],
      },
    ];
  }

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
        const lesson = lessonFromTopic(topic, `p${pi}-m${si}-l${ti}`, lessonIndex);
        lessonIndex += 1;
        return lesson;
      }),
    })),
  }));
}

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
      detail: `${m.count} topic${m.count === 1 ? "" : "s"} - learn, recall to 95%, then a fresh practice answer.`,
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