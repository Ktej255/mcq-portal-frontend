export type GeographyDay28WeakAreaRepairStage = {
  id: "classify" | "root" | "repair" | "retest" | "schedule";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
  diagramTitle: string;
  diagramCue: string;
};

export const geographyDay28WeakAreaRepairStages: GeographyDay28WeakAreaRepairStage[] = [
  {
    id: "classify",
    label: "Classify the mistake",
    eyebrow: "Repair begins precisely",
    explanation:
      "Separate knowledge gap, map-recall gap, concept confusion, and statement-reading error before opening another chapter or question set.",
    proof: "First question: what kind of mistake actually happened?",
    diagramTitle: "MISTAKE TYPE",
    diagramCue: "knowledge  map  concept  reading",
  },
  {
    id: "root",
    label: "Find the root cause",
    eyebrow: "Repeated error logic",
    explanation:
      "Repeated mistakes need root-cause repair. Identify the exact process, location, exception, or trap pattern that remains unstable.",
    proof: "Root-cause check: name the smallest unstable idea.",
    diagramTitle: "ROOT CAUSE",
    diagramCue: "process  location  exception  trap",
  },
  {
    id: "repair",
    label: "Write one repair card",
    eyebrow: "Targeted revisit",
    explanation:
      "Build a compact revisit card with concept, map cue, example, UPSC trap, and the corrected explanation. Keep the repair narrow.",
    proof: "Repair card: concept + map cue + example + trap + correction.",
    diagramTitle: "REPAIR CARD",
    diagramCue: "concept  map  example  correction",
  },
  {
    id: "retest",
    label: "Use a fresh retest",
    eyebrow: "Proof after repair",
    explanation:
      "Retest the repaired idea with fresh questions. Compare original confidence with retest confidence instead of repeating the memorized answer.",
    proof: "Retest check: new question, same repaired concept.",
    diagramTitle: "FRESH RETEST",
    diagramCue: "new question  same concept  compare",
  },
  {
    id: "schedule",
    label: "Schedule the remainder",
    eyebrow: "Revision queue",
    explanation:
      "Move only the remaining unstable ideas into the next revision window. Do not reopen an entire chapter when one location or process is weak.",
    proof: "Recall chain: classify -> root cause -> repair -> retest -> schedule.",
    diagramTitle: "REVISION QUEUE",
    diagramCue: "only unstable ideas move forward",
  },
];

export const geographyDay28PortalLesson = {
  title: "Weak Area Repair",
  promise:
    "Repair repeated Geography mistakes through precise classification, root cause, narrow revisit cards, fresh retest, and revision scheduling.",
  sourceSummary:
    "Promoted from the staged revision pack into a compact portal-native targeted-recovery visual.",
  scenes: [
    {
      id: "28-briefing",
      kind: "briefing" as const,
      title: "Classify the mistake",
      objective: "Separate the weak signal before revising.",
      narration:
        "Identify whether the error is a knowledge gap, map-recall gap, concept confusion, or statement-reading error. Avoid random chapter-wide revision.",
      checkpoint:
        "Student can classify one repeated error precisely.",
      durationMinutes: 2,
    },
    {
      id: "28-mechanism",
      kind: "mechanism" as const,
      title: "Find root cause and repair",
      objective: "Create one narrow revisit card.",
      narration:
        "Name the unstable process, location, exception, or trap. Add concept, map cue, example, correction, and the question type that will retest it.",
      checkpoint:
        "Student can write one complete repair card.",
      durationMinutes: 3,
    },
    {
      id: "28-map",
      kind: "map" as const,
      title: "Retest with fresh questions",
      objective: "Prove repair instead of repeating an answer.",
      narration:
        "Use a fresh question against the repaired concept. Compare the original confidence with the retest result and keep only unresolved gaps.",
      checkpoint:
        "Student can explain why the retest is genuinely fresh.",
      durationMinutes: 3,
    },
    {
      id: "28-trap",
      kind: "trap" as const,
      title: "Avoid chapter-wide overrevision",
      objective: "Prepare for inefficient recovery habits.",
      narration:
        "Do not reopen a whole chapter when one location, process, or reading trap remains weak. Keep the revision queue precise.",
      checkpoint:
        "Student can name the smallest remaining repair target.",
      durationMinutes: 2,
    },
    {
      id: "28-recap",
      kind: "recap" as const,
      title: "Schedule the remaining weak idea",
      objective: "Move into discussion with one repair and retest plan.",
      narration:
        "Explain the mistake type, root cause, repair card, fresh retest, confidence comparison, and next revision date.",
      checkpoint:
        "Student is ready to explain one precise recovery plan.",
      durationMinutes: 2,
    },
  ],
};
