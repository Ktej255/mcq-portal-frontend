export type GeographyDay30GeographyCommandDayStage = {
  id: "recall" | "map" | "proof" | "revision" | "verdict";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
  diagramTitle: string;
  diagramCue: string;
};

export const geographyDay30GeographyCommandDayStages: GeographyDay30GeographyCommandDayStage[] = [
  {
    id: "recall",
    label: "Run final recall",
    eyebrow: "Whole-subject closure",
    explanation:
      "Explain every major Geography theme through cause and location: physical systems, India map, human geography, atlas, environment bridge, and disaster bridge.",
    proof: "Command check: explain the subject, do not merely recognize it.",
    diagramTitle: "FULL RECALL",
    diagramCue: "physical  India  human  atlas  environment  disaster",
  },
  {
    id: "map",
    label: "Check map confidence",
    eyebrow: "Spatial command",
    explanation:
      "Verify recurring places, directions, neighboring regions, relief, rivers, climate, resources, biodiversity, hazards, and examples one final time.",
    proof: "Map check: locate, connect, compare, and explain.",
    diagramTitle: "MAP CONFIDENCE",
    diagramCue: "locate  connect  compare  explain",
  },
  {
    id: "proof",
    label: "Audit the evidence",
    eyebrow: "Confidence needs proof",
    explanation:
      "Use completed lessons, accepted Talk explanations, optional Lab evidence, fresh MCQ practice, and revisit closure as the confidence record.",
    proof: "Proof check: Watch + Talk + MCQ + Revisit closure.",
    diagramTitle: "LEARNING PROOF",
    diagramCue: "Watch  Talk  Lab support  MCQ  Revisit",
  },
  {
    id: "revision",
    label: "Lock revision dates",
    eyebrow: "Retention continues",
    explanation:
      "Schedule the next review dates before moving to another subject. Preserve the repair cards and retest queue for future command checks.",
    proof: "Revision lock: the next review date is part of completion.",
    diagramTitle: "REVISION LOCK",
    diagramCue: "schedule  retain  revisit  retest",
  },
  {
    id: "verdict",
    label: "Set the command verdict",
    eyebrow: "Honest closeout",
    explanation:
      "Mark Geography command-ready, revision-needed, or retest-needed from evidence. Familiarity is not command under exam pressure.",
    proof: "Recall chain: explain -> locate -> prove -> schedule -> decide.",
    diagramTitle: "COMMAND VERDICT",
    diagramCue: "ready  revision-needed  retest-needed",
  },
];

export const geographyDay30PortalLesson = {
  title: "Geography Command Day",
  promise:
    "Close the sprint with full recall, map confidence, proof-based command status, revision dates, and an honest next-step verdict.",
  sourceSummary:
    "Promoted from the staged Command Phase pack into a compact portal-native command-day visual.",
  scenes: [
    {
      id: "30-briefing",
      kind: "briefing" as const,
      title: "Run full-syllabus recall",
      objective: "Explain every major theme through cause and location.",
      narration:
        "Move across physical systems, India map, human geography, atlas, environment bridge, and disaster bridge. State mechanism, place, example, and trap.",
      checkpoint:
        "Student can explain the complete subject map without recognition-only recall.",
      durationMinutes: 2,
    },
    {
      id: "30-mechanism",
      kind: "mechanism" as const,
      title: "Audit spatial and learning proof",
      objective: "Base confidence on evidence.",
      narration:
        "Check recurring places, directions, neighboring regions, relief, rivers, climate, resources, biodiversity, and hazards. Then review Watch, Talk, MCQ, and Revisit closure.",
      checkpoint:
        "Student can identify the proof behind the command decision.",
      durationMinutes: 3,
    },
    {
      id: "30-map",
      kind: "map" as const,
      title: "Lock revision dates",
      objective: "Protect retention after the sprint.",
      narration:
        "Schedule the next review dates before moving to another subject. Preserve repair cards and retest cues so future revision starts from evidence.",
      checkpoint:
        "Student can state the next revision date and remaining weak cue.",
      durationMinutes: 3,
    },
    {
      id: "30-trap",
      kind: "trap" as const,
      title: "Reject familiarity as command",
      objective: "Prepare for honest closeout.",
      narration:
        "Recognizing a topic is not the same as explaining and applying it under exam pressure. Let the evidence decide the status.",
      checkpoint:
        "Student can separate familiarity from proven command.",
      durationMinutes: 2,
    },
    {
      id: "30-recap",
      kind: "recap" as const,
      title: "Set the Geography verdict",
      objective: "Move into discussion with one honest subject closeout.",
      narration:
        "State strongest area, weakest area, map confidence, retest need, revision date, and whether Geography is command-ready, revision-needed, or retest-needed.",
      checkpoint:
        "Student is ready to explain the final Geography command verdict.",
      durationMinutes: 2,
    },
  ],
};
