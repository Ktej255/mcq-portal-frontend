export type GeographyDay23PyqPatternReadingStage = {
  id: "classify" | "sequence" | "pairs" | "explain" | "repair";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay23PyqPatternReadingStages: GeographyDay23PyqPatternReadingStage[] = [
  {
    id: "classify",
    label: "Classify the tested idea",
    eyebrow: "Read before solving",
    explanation:
      "PYQ pattern reading separates difficulty from trap design. First identify whether UPSC is testing a concept, map location, process order, exception, pair match, or current-static link.",
    proof: "Start with the question: what is actually being tested here?",
  },
  {
    id: "sequence",
    label: "Verify process and location",
    eyebrow: "Order and map logic",
    explanation:
      "A correct fact becomes wrong when attached to the wrong stage, region, season, current, soil, crop, or hazard. Verify the process order or map anchor before accepting the statement.",
    proof: "Trap check: right fact + wrong order or location = wrong statement.",
  },
  {
    id: "pairs",
    label: "Inspect pairs and exceptions",
    eyebrow: "Near-correct options",
    explanation:
      "Pair-matching questions mix familiar names with one weak relationship. Exception questions hide the single statement that breaks the pattern. Test each pair independently.",
    proof: "Do not accept a group because most entries look familiar.",
  },
  {
    id: "explain",
    label: "Test cause and effect",
    eyebrow: "Explanation validity",
    explanation:
      "Two statements can both be true while the explanation remains false. Check whether the claimed cause actually produces the stated effect in that region, season, or process.",
    proof: "Reason test: true statement A + true statement B does not guarantee a valid link.",
  },
  {
    id: "repair",
    label: "Create a repair card",
    eyebrow: "Error becomes revision",
    explanation:
      "Tag the error by trap type and rewrite the false statement correctly. Revision should repair the thinking error, not only store the answer key.",
    proof: "Recall chain: classify -> verify -> reject -> rewrite -> retest.",
  },
];

export const geographyDay23PortalLesson = {
  title: "PYQ Pattern Reading",
  promise:
    "Read Geography PYQs through tested idea, process order, map location, pair matching, exceptions, explanation validity, and repair-card discipline.",
  sourceSummary:
    "Promoted from the staged Atlas, PYQ Logic, Revision pack into a compact portal-native trap-reading visual.",
  scenes: [
    {
      id: "23-briefing",
      kind: "briefing" as const,
      title: "Classify the tested idea",
      objective: "Separate content difficulty from question-design difficulty.",
      narration:
        "Before solving, identify whether UPSC is testing concept, map, process order, exception, pair matching, or a current-static link.",
      checkpoint:
        "Student can classify one PYQ-style statement by trap type.",
      durationMinutes: 2,
    },
    {
      id: "23-mechanism",
      kind: "mechanism" as const,
      title: "Verify order, location, pair, and exception",
      objective: "Inspect the relationship that can turn a true fact into a false option.",
      narration:
        "A familiar fact can be attached to the wrong process stage, region, season, soil, crop, current, or hazard. Test each pair and exception independently.",
      checkpoint:
        "Student can explain why one near-correct statement fails.",
      durationMinutes: 3,
    },
    {
      id: "23-map",
      kind: "map" as const,
      title: "Test explanation validity",
      objective: "Check whether the claimed cause actually produces the effect.",
      narration:
        "Two statements may both be true while their explanatory relationship remains false. Verify mechanism, place, timing, and direction of effect.",
      checkpoint:
        "Student can separate two true facts from a valid cause-effect link.",
      durationMinutes: 3,
    },
    {
      id: "23-trap",
      kind: "trap" as const,
      title: "Reject the tempting option",
      objective: "Prepare for familiar-wording and mixed-relationship traps.",
      narration:
        "Reject an option when the tested relationship fails, even if every noun inside the statement looks familiar. Name the precise mismatch.",
      checkpoint:
        "Student can identify the exact mismatch inside one tempting option.",
      durationMinutes: 2,
    },
    {
      id: "23-recap",
      kind: "recap" as const,
      title: "Turn error into repair",
      objective: "Move into discussion with one trap explanation and one corrected statement.",
      narration:
        "Choose one PYQ-style trap. State what is tested, why the option is tempting, why it fails, the corrected statement, and the retest cue.",
      checkpoint:
        "Student is ready to explain one trap and create one repair card.",
      durationMinutes: 2,
    },
  ],
};
