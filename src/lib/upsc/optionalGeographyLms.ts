// LMS content model for the Geography optional course player.
// Curriculum (modules/lessons) is derived from the real syllabus scraped from
// saritclasses.com; video links, PYQs, practice, and resources are seeded here
// and meant to be updated by the founder over time.
import { getOptionalSubjectContent } from "./optionalSubjectContent";

export const GEOGRAPHY_OPTIONAL_SLUG = "geography";
export const GEOGRAPHY_FREE_LESSON_COUNT = 2;

export type LmsLesson = {
  id: string;
  title: string;
  videoUrl?: string; // empty for now; founder adds links later
  durationLabel: string;
  free: boolean;
};
export type LmsModule = { id: string; title: string; lessons: LmsLesson[] };
export type PyqYear = { year: number; questions: string[] };
export type PracticeItem = {
  id: string;
  mode: "mcq" | "mains";
  marks: number;
  prompt: string;
  statements?: string[];
  options?: string[];
};

/** Build the curriculum (modules -> lessons) from the real Geography syllabus. */
export function getGeographyOptionalModules(): LmsModule[] {
  const content = getOptionalSubjectContent(GEOGRAPHY_OPTIONAL_SLUG);
  if (!content) return [];
  const sections = content.papers.flatMap((paper) => paper.sections);
  let lessonIndex = 0;
  return sections.map((section, si) => ({
    id: `m${si}`,
    title: section.heading,
    lessons: section.topics.map((topic, ti) => {
      const free = lessonIndex < GEOGRAPHY_FREE_LESSON_COUNT;
      lessonIndex += 1;
      return { id: `m${si}-l${ti}`, title: topic, durationLabel: "Video coming soon", free };
    }),
  }));
}


// Year-wise Geography optional PYQs shown IN-PAGE (no external redirects).
// Seeded with representative questions; replace/extend with founder-verified text.
export const geographyPyqYears: PyqYear[] = [
  {
    year: 2023,
    questions: [
      "Discuss the relevance of Davisian model of cycle of erosion in the present-day context.",
      "Examine the role of jet streams in the development of the Indian monsoon.",
      "Bring out the geographical basis of the inter-state water disputes in India.",
    ],
  },
  {
    year: 2022,
    questions: [
      "Explain the concept of isostasy and discuss the views of Airy and Pratt.",
      "Discuss the applied aspects of coastal geomorphology.",
      "Analyse the spatial pattern of drought-prone areas in India and suggest remedies.",
    ],
  },
  {
    year: 2021,
    questions: [
      "Critically examine the heartland theory of Mackinder in the contemporary world order.",
      "Discuss the factors responsible for the localisation of the cotton textile industry in India.",
    ],
  },
  { year: 2020, questions: ["Discuss the climatic classification of Koppen with reference to India."] },
  { year: 2019, questions: ["Examine the relationship between glacial cycles and sea-level changes."] },
  { year: 2018, questions: ["Bring out the role of agro-climatic regional planning in Indian agriculture."] },
];

export const geographyPracticeItems: PracticeItem[] = [
  {
    id: "geo-p1",
    mode: "mcq",
    marks: 2,
    prompt: "With reference to plate tectonics, consider the following statements:",
    statements: [
      "Transform boundaries are sites of crust creation.",
      "The Himalayas are formed along a convergent continental-continental boundary.",
      "Mid-oceanic ridges mark divergent plate boundaries.",
    ],
    options: ["Only one statement is correct", "Only two statements are correct", "All three are correct", "None is correct"],
  },
  {
    id: "geo-p2",
    mode: "mains",
    marks: 15,
    prompt:
      "Answer in 250 words: Examine the mechanism of the Indian monsoon and the role of jet streams and El Nino in its variability. Upload your written answer for AI evaluation.",
  },
];

export const geographyResources = [
  { label: "NCERT Geography (Class XI-XII) anchor notes", kind: "PDF" },
  { label: "Topic map sheet and diagram pack", kind: "PDF" },
  { label: "Answer-writing model structure", kind: "DOC" },
];
