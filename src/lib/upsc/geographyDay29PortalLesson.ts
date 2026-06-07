export type GeographyDay29FinalMockReviewStage = {
  id: "score" | "classify" | "map" | "queue" | "confidence";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
  diagramTitle: string;
  diagramCue: string;
};

export const geographyDay29FinalMockReviewStages: GeographyDay29FinalMockReviewStage[] = [
  {
    id: "score",
    label: "Read beyond the score",
    eyebrow: "Mock review begins",
    explanation:
      "A mock score is only a signal. Open the mistakes and separate content weakness from attention, map recall, confidence, and time-pressure errors.",
    proof: "Score check: the number is not the diagnosis.",
    diagramTitle: "MOCK SIGNAL",
    diagramCue: "score opens review, not conclusion",
  },
  {
    id: "classify",
    label: "Classify every mistake",
    eyebrow: "Error analysis",
    explanation:
      "Tag each error as knowledge gap, map error, statement-reading error, overconfidence, or time pressure before choosing the repair.",
    proof: "Classification check: one mistake, one primary category.",
    diagramTitle: "ERROR CATEGORY",
    diagramCue: "knowledge  map  reading  confidence  time",
  },
  {
    id: "map",
    label: "Repair spatial errors",
    eyebrow: "Map correction",
    explanation:
      "Target wrong locations, neighboring regions, directions, features, and cause links. Add a short visual cue that prevents the repeat error.",
    proof: "Map repair: locate, compare neighbor, explain feature, retest.",
    diagramTitle: "MAP REPAIR",
    diagramCue: "location  neighbor  direction  feature",
  },
  {
    id: "queue",
    label: "Build the 24-hour queue",
    eyebrow: "Prioritize revision",
    explanation:
      "Move repeated and high-value mistakes to the top. Give every wrong answer a short correction and one retest cue.",
    proof: "Queue check: repeat risk + exam value decide priority.",
    diagramTitle: "24-HOUR QUEUE",
    diagramCue: "repeat risk  exam value  retest cue",
  },
  {
    id: "confidence",
    label: "Control confidence",
    eyebrow: "Ready for command day",
    explanation:
      "Separate genuine command from familiarity. Confidence rises only when the corrected idea survives a fresh retest under realistic pressure.",
    proof: "Recall chain: score -> classify -> repair -> prioritize -> retest.",
    diagramTitle: "CONFIDENCE CONTROL",
    diagramCue: "proof beats familiarity",
  },
];

export const geographyDay29PortalLesson = {
  title: "Final Mock and Review",
  promise:
    "Convert the final mock into a precise repair queue through error classification, map correction, priority, retest, and confidence control.",
  sourceSummary:
    "Promoted from the staged Command Phase pack into a compact portal-native mock-analysis visual.",
  scenes: [
    {
      id: "29-briefing",
      kind: "briefing" as const,
      title: "Read beyond the score",
      objective: "Treat mock performance as evidence, not a verdict.",
      narration:
        "Open every mistake. Separate content weakness from map error, statement-reading error, overconfidence, and time pressure.",
      checkpoint:
        "Student can explain why the score alone is not the diagnosis.",
      durationMinutes: 2,
    },
    {
      id: "29-mechanism",
      kind: "mechanism" as const,
      title: "Classify and repair",
      objective: "Give every error a category and short correction.",
      narration:
        "Tag the primary error category, write the corrected concept, and attach one retest cue. Use map repair for location, direction, neighbor, feature, and cause-link errors.",
      checkpoint:
        "Student can turn one wrong question into one repair action.",
      durationMinutes: 3,
    },
    {
      id: "29-map",
      kind: "map" as const,
      title: "Prioritize the 24-hour queue",
      objective: "Put repeated and high-value mistakes first.",
      narration:
        "Rank mistakes by repeat risk and exam value. Schedule the smallest useful revision action before command day.",
      checkpoint:
        "Student can identify the highest-priority repair item.",
      durationMinutes: 3,
    },
    {
      id: "29-trap",
      kind: "trap" as const,
      title: "Reject false confidence",
      objective: "Prepare for score and familiarity traps.",
      narration:
        "A familiar topic can still fail under pressure. Confidence must follow correction and fresh retest, not recognition alone.",
      checkpoint:
        "Student can separate familiarity from proven recall.",
      durationMinutes: 2,
    },
    {
      id: "29-recap",
      kind: "recap" as const,
      title: "Explain one mock repair",
      objective: "Move into discussion with one prioritized correction.",
      narration:
        "State the mistake category, corrected idea, map or process cue, retest prompt, queue priority, and confidence decision.",
      checkpoint:
        "Student is ready to explain one final-mock repair path.",
      durationMinutes: 2,
    },
  ],
};
