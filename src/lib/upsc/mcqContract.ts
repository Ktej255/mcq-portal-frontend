import type { GeographySession } from "@/lib/upsc/plan";

export type McqContractColumn = {
  key: string;
  label: string;
  required: boolean;
  detail: string;
};

export type GeographyMcqTemplateRow = {
  subject: string;
  day: number;
  week: number;
  chapter: string;
  topic: string;
  batch_code: string;
  test_title: string;
  difficulty: string;
  question_text_en: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation_en: string;
  source: string;
  map_or_case_tag: string;
  pyq_linked: string;
  status: string;
};

export const geographyMcqContractColumns: McqContractColumn[] = [
  {
    key: "subject",
    label: "Subject",
    required: true,
    detail: "Always Geography for this June sprint.",
  },
  {
    key: "day",
    label: "Day",
    required: true,
    detail: "Maps the MCQ to the 30-day Geography class plan.",
  },
  {
    key: "chapter",
    label: "Chapter",
    required: true,
    detail: "Uses the Geography session chapter for reporting and revision.",
  },
  {
    key: "topic",
    label: "Topic",
    required: true,
    detail: "Uses the exact daily session title.",
  },
  {
    key: "batch_code",
    label: "Batch Code",
    required: true,
    detail: "Stable code such as GEO-D10 for test creation and filtering.",
  },
  {
    key: "difficulty",
    label: "Difficulty",
    required: true,
    detail: "EASY, MEDIUM, HARD, or PYQ_STYLE.",
  },
  {
    key: "question_text_en",
    label: "Question",
    required: true,
    detail: "Fresh MCQ stem. Old EduEcosystem MCQs are not imported here.",
  },
  {
    key: "correct_option",
    label: "Correct Option",
    required: true,
    detail: "A, B, C, or D.",
  },
  {
    key: "explanation_en",
    label: "Explanation",
    required: true,
    detail: "Reasoning is mandatory because MCQ remains part of learning.",
  },
  {
    key: "map_or_case_tag",
    label: "Map / Case Tag",
    required: false,
    detail: "Optional place, river, region, climate, relief, or atlas link.",
  },
  {
    key: "pyq_linked",
    label: "PYQ Linked",
    required: false,
    detail: "Yes/No marker for future PYQ-style analytics.",
  },
];

export function getGeographyBatchCode(session: GeographySession) {
  return `GEO-D${String(session.day).padStart(2, "0")}`;
}

export function buildGeographyMcqTemplateRow(
  session: GeographySession,
  difficulty = "MEDIUM"
): GeographyMcqTemplateRow {
  return {
    subject: "Geography",
    day: session.day,
    week: session.week,
    chapter: session.chapter,
    topic: session.title,
    batch_code: getGeographyBatchCode(session),
    test_title: `Geography Day ${session.day}: ${session.title}`,
    difficulty,
    question_text_en: `Fresh MCQ stem for ${session.title}`,
    option_a: "Option A",
    option_b: "Option B",
    option_c: "Option C",
    option_d: "Option D",
    correct_option: "A",
    explanation_en: `Explain the concept, map logic, and UPSC trap for ${session.title}.`,
    source: "FRESH_AUTHORING",
    map_or_case_tag: session.lab,
    pyq_linked: "No",
    status: "DRAFT",
  };
}

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildGeographyMcqCsv(session: GeographySession, difficulty = "MEDIUM") {
  const row = buildGeographyMcqTemplateRow(session, difficulty);
  const headers = Object.keys(row) as Array<keyof GeographyMcqTemplateRow>;
  const values = headers.map((header) => csvEscape(row[header]));

  return `${headers.join(",")}\n${values.join(",")}\n`;
}
