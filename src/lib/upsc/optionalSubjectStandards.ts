import {
  buildTopicPractice as buildGeographyTopicPractice,
  geographyGapAreas,
  geographyPyqYears,
  geographyResources,
  geographyTrendByYear,
  geographyTrendWindows,
  type PyqYear,
} from "./optionalGeographyLms";

type ResourceItem = {
  label: string;
  kind: string;
  note?: string;
};

type DiagramItem = {
  title: string;
  expectation: string;
  practice: string;
};

type GapArea = {
  area: string;
  expectation: string;
  status: string;
};

export type OptionalSubjectStandard = {
  slug: string;
  title: string;
  readinessNote: string;
  pyqYears: PyqYear[];
  resources: ResourceItem[];
  diagramLab: DiagramItem[];
  trendByYear: Array<{ year: number; distribution: Array<{ name: string; value: number }> }>;
  trendWindows: Array<{ window: string; insight: string }>;
  gapAreas: GapArea[];
  currentAffairsHooks: Array<{ topic: string; hook: string; sourceRule: string }>;
  buildPractice: (topic: string) => Array<{ level: string; prompt: string }>;
};

function q(year: number, paper: "Paper I" | "Paper II", n: number, text: string) {
  return { id: `anthro-pyq-${year}-${paper === "Paper I" ? "1" : "2"}-${n}`, year, paper, text };
}

const anthropologyPyqYears: PyqYear[] = [
  {
    year: 2024,
    papers: [
      {
        paper: "Paper I",
        questions: [
          q(2024, "Paper I", 1, "Discuss the relationship of anthropology with other disciplines and its relevance in contemporary society."),
          q(2024, "Paper I", 2, "Explain cultural relativism and ethnocentrism with suitable anthropological examples."),
        ],
      },
      {
        paper: "Paper II",
        questions: [
          q(2024, "Paper II", 1, "Examine the role of anthropology in tribal development and welfare programmes in India."),
          q(2024, "Paper II", 2, "Discuss the significance of constitutional safeguards for Scheduled Tribes."),
        ],
      },
    ],
  },
  {
    year: 2023,
    papers: [
      {
        paper: "Paper I",
        questions: [
          q(2023, "Paper I", 1, "Write a note on participant observation as a method of anthropological fieldwork."),
          q(2023, "Paper I", 2, "Critically examine the contribution of functionalism to anthropological theory."),
          q(2023, "Paper I", 3, "Discuss the biological and cultural dimensions of human evolution."),
        ],
      },
      {
        paper: "Paper II",
        questions: [
          q(2023, "Paper II", 1, "Analyse the changing nature of caste and tribe in contemporary India."),
          q(2023, "Paper II", 2, "Discuss problems of displacement and rehabilitation among tribal communities."),
        ],
      },
    ],
  },
  {
    year: 2022,
    papers: [
      {
        paper: "Paper I",
        questions: [
          q(2022, "Paper I", 1, "Explain marriage, family and kinship as interlinked institutions in simple societies."),
          q(2022, "Paper I", 2, "Evaluate the significance of human genetics in physical anthropology."),
        ],
      },
      {
        paper: "Paper II",
        questions: [
          q(2022, "Paper II", 1, "Discuss the contribution of Indian anthropologists to the study of tribes and villages."),
          q(2022, "Paper II", 2, "Examine the impact of development projects on tribal culture and livelihood."),
        ],
      },
    ],
  },
  {
    year: 2021,
    papers: [
      {
        paper: "Paper I",
        questions: [
          q(2021, "Paper I", 1, "Discuss race as a biological and social construct."),
          q(2021, "Paper I", 2, "Explain the major approaches to the study of religion in anthropology."),
        ],
      },
      {
        paper: "Paper II",
        questions: [
          q(2021, "Paper II", 1, "Bring out the role of anthropology in understanding ethnicity and regionalism in India."),
          q(2021, "Paper II", 2, "Discuss PVTGs with reference to vulnerability, policy and development strategy."),
        ],
      },
    ],
  },
  {
    year: 2020,
    papers: [
      {
        paper: "Paper I",
        questions: [
          q(2020, "Paper I", 1, "Explain the concept of culture and its attributes with examples."),
          q(2020, "Paper I", 2, "Discuss the application of anthropology in health, nutrition and development."),
        ],
      },
      {
        paper: "Paper II",
        questions: [
          q(2020, "Paper II", 1, "Examine the demographic profile of Indian tribes and its policy implications."),
          q(2020, "Paper II", 2, "Discuss the role of anthropology in tribal administration."),
        ],
      },
    ],
  },
];

const anthropologyStandard: OptionalSubjectStandard = {
  slug: "anthropology",
  title: "Anthropology Optional",
  readinessNote:
    "Built from the existing Anthropology syllabus map plus the shared combined handout as reference metadata. Handout pages are not copied into the LMS unless licensed.",
  pyqYears: anthropologyPyqYears,
  resources: [
    {
      label: "Anthropology Combined Handouts reference index",
      kind: "Reference",
      note: "Use for internal topic mapping; do not publish copied pages without permission.",
    },
    {
      label: "Paper I concept sheet: evolution, culture, kinship, theory, methods",
      kind: "PDF plan",
      note: "Original student-facing PDF to be generated from authored notes.",
    },
    {
      label: "Paper II casework sheet: Indian tribes, safeguards, development, PVTGs",
      kind: "PDF plan",
      note: "Original examples and case studies only.",
    },
    {
      label: "Diagram pack: skull, dentition, kinship symbols, tribe-development flowcharts",
      kind: "Diagram",
      note: "Drawn assets, not scanned coaching pages.",
    },
  ],
  diagramLab: [
    {
      title: "Human evolution plates",
      expectation: "Use labelled evolutionary sequence, cranial capacity, bipedalism and tool-culture markers.",
      practice: "Draw a 6-box evolution timeline and add one cultural trait under each stage.",
    },
    {
      title: "Kinship and marriage notation",
      expectation: "Use standard symbols, descent line, alliance, residence and inheritance terms correctly.",
      practice: "Convert one kinship question into a clean diagram before writing the answer.",
    },
    {
      title: "Tribal development case flow",
      expectation: "Link displacement, livelihood, identity, safeguards, governance and development outcome.",
      practice: "Create one flowchart for PVTG welfare and one for project-induced displacement.",
    },
    {
      title: "Physical anthropology quick diagrams",
      expectation: "Add compact sketches for dentition, skull index, chromosome, growth curve and race critique.",
      practice: "Prepare one 90-second diagram for each recurring Paper I biological theme.",
    },
  ],
  trendByYear: [
    { year: 2024, distribution: [{ name: "Direct", value: 4 }, { name: "Conceptual", value: 5 }, { name: "Applied", value: 5 }] },
    { year: 2023, distribution: [{ name: "Direct", value: 3 }, { name: "Conceptual", value: 6 }, { name: "Applied", value: 6 }] },
    { year: 2022, distribution: [{ name: "Direct", value: 5 }, { name: "Conceptual", value: 5 }, { name: "Applied", value: 4 }] },
    { year: 2021, distribution: [{ name: "Direct", value: 5 }, { name: "Conceptual", value: 6 }, { name: "Applied", value: 3 }] },
    { year: 2020, distribution: [{ name: "Direct", value: 6 }, { name: "Conceptual", value: 4 }, { name: "Applied", value: 4 }] },
  ],
  trendWindows: [
    {
      window: "Last 5 years",
      insight: "Paper II keeps rewarding tribal development, constitutional safeguards, displacement, ethnicity and applied anthropology.",
    },
    {
      window: "Paper I pattern",
      insight: "Theory and methods questions ask for concept clarity first, then examples from fieldwork and Indian context.",
    },
    {
      window: "Scoring signal",
      insight: "High-value answers combine definition, scholar, diagram, tribe/case example and brief criticism.",
    },
  ],
  gapAreas: [
    { area: "Anthropological vocabulary", expectation: "Culture, society, race, tribe, kinship and fieldwork terms used precisely", status: "Track per attempt" },
    { area: "Diagrams and notation", expectation: "Biological diagrams, kinship notation and tribal-development flowcharts where relevant", status: "Track per attempt" },
    { area: "Scholar and theory linkage", expectation: "Tylor, Morgan, Boas, Malinowski, Radcliffe-Brown, Levi-Strauss and Indian anthropologists", status: "Track per attempt" },
    { area: "Indian casework", expectation: "Tribe, PVTG, constitutional safeguard, committee, scheme and regional example", status: "Track per attempt" },
  ],
  currentAffairsHooks: [
    {
      topic: "PVTGs and tribal welfare",
      hook: "Attach scheme changes, budget announcements, FRA implementation, habitat rights and health/nutrition reports.",
      sourceRule: "Use official ministry/PIB/NITI/open reports for inline reading; summarize newspapers instead of copying.",
    },
    {
      topic: "Displacement and development",
      hook: "Track mining, forest diversion, infrastructure displacement, rehabilitation and consent debates.",
      sourceRule: "Keep article text out of the LMS unless licensed; store citation, summary and analysis.",
    },
    {
      topic: "Health and biological anthropology",
      hook: "Link nutrition, anemia, sickle-cell mission, epidemiological anthropology and tribal health data.",
      sourceRule: "Prefer public reports and government dashboards for embedded documents.",
    },
  ],
  buildPractice(topic: string) {
    return [
      { level: "Easy", prompt: `Define "${topic}" and explain its anthropological significance with one example. (150 words)` },
      { level: "Moderate", prompt: `Discuss "${topic}" with scholar/theory linkage and one Indian or tribal example. (250 words)` },
      { level: "UPSC-like", prompt: `Critically examine "${topic}" using anthropological vocabulary, diagram/casework support and a concise conclusion. (250 words)` },
    ];
  },
};

export function getOptionalSubjectStandard(slug: string): OptionalSubjectStandard | null {
  if (slug === "anthropology") return anthropologyStandard;
  return null;
}

export function getSubjectPyqYears(slug: string): PyqYear[] {
  return getOptionalSubjectStandard(slug)?.pyqYears ?? geographyPyqYears;
}

export function buildSubjectPractice(slug: string, topic: string): Array<{ level: string; prompt: string }> {
  return getOptionalSubjectStandard(slug)?.buildPractice(topic) ?? buildGeographyTopicPractice(topic);
}

export function getSubjectResources(slug: string): ResourceItem[] {
  return getOptionalSubjectStandard(slug)?.resources ?? geographyResources;
}

export function getSubjectGapAreas(slug: string): GapArea[] {
  return getOptionalSubjectStandard(slug)?.gapAreas ?? geographyGapAreas;
}

export function getSubjectTrendByYear(slug: string) {
  return getOptionalSubjectStandard(slug)?.trendByYear ?? geographyTrendByYear;
}

export function getSubjectTrendWindows(slug: string) {
  return getOptionalSubjectStandard(slug)?.trendWindows ?? geographyTrendWindows;
}

export function getSubjectPyqQuestion(slug: string, id: string) {
  for (const year of getSubjectPyqYears(slug)) {
    for (const group of year.papers) {
      const found = group.questions.find((item) => item.id === id);
      if (found) return found;
    }
  }
  return null;
}
