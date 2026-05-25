import type { GeographySession } from "@/lib/upsc/plan";

export type GeographyAssessmentBand = "Revisit" | "Practice" | "Command";

export type GeographyAssessmentRubricItem = {
  label: "Recall" | "Mechanism" | "Map proof" | "UPSC trap" | "Expression";
  score: number;
  max: number;
  status: "Weak" | "Forming" | "Ready";
  evidence: string;
};

export type GeographyAssessment = {
  score: number;
  band: GeographyAssessmentBand;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  nextAction: string;
  rubric: GeographyAssessmentRubricItem[];
  repairHints: string[];
};

export type GeographyTalkUnlockStage = "revisit" | "retry" | "lab" | "mcq";

export type GeographyMaicRole = "AI Teacher" | "Peer Challenger" | "UPSC Examiner" | "Learning Summarizer";

export type GeographyMaicTurn = {
  role: GeographyMaicRole;
  title: string;
  message: string;
  tone: "teacher" | "peer" | "examiner" | "summarizer";
};

export type GeographyMaicDiscussion = {
  turns: GeographyMaicTurn[];
  verdict: string;
  unlockStage: GeographyTalkUnlockStage;
  score: number;
};

export type GeographyWatchSceneKind = "briefing" | "mechanism" | "map" | "trap" | "recap";

export type GeographyWatchScene = {
  id: string;
  kind: GeographyWatchSceneKind;
  title: string;
  objective: string;
  narration: string;
  checkpoint: string;
  durationMinutes: number;
};

const stopWords = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "into",
  "this",
  "that",
  "why",
  "how",
  "are",
  "does",
  "can",
  "day",
  "base",
  "basics",
  "study",
  "understand",
]);

export function labSlugForGeographySession(labTitle: string) {
  if (labTitle === "Monsoon Simulator") return "monsoon";
  if (labTitle === "India Interactive Map") return "india-map";
  if (labTitle === "Disaster Link") return "disaster-link";
  if (labTitle === "Environment Bridge") return "environment-bridge";
  if (labTitle === "MCQ Engine") return "mcq-engine";
  return "earth-layers";
}

export function getGeographySubtopics(session: GeographySession) {
  if (session.subtopics?.length) return session.subtopics;

  return session.anchor
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function getGeographyGsCompatibility(session: GeographySession) {
  return (
    session.gsCompatibility ??
    `GS Paper I Geography: ${session.chapter}. This class maps the day topic to concepts, maps, examples, and prelims-style statement logic.`
  );
}

export function getCompressedGeographyRecap(session: GeographySession) {
  const subtopics = getGeographySubtopics(session);

  return [
    `Start with ${session.title}: ${session.anchor}.`,
    `Explain the core mechanism in your own words, then attach it to one map or Indian example.`,
    `Do not memorize isolated facts. Connect ${subtopics.slice(0, 3).join(", ")} through cause, location, and exception.`,
    `End by predicting one UPSC statement trap and one MCQ angle.`,
  ];
}

export function buildGeographyWatchScenes(session: GeographySession): GeographyWatchScene[] {
  const subtopics = getGeographySubtopics(session);
  const firstTopics = subtopics.slice(0, 3).join(", ");

  return [
    {
      id: `${session.day}-briefing`,
      kind: "briefing",
      title: "Class briefing",
      objective: "Set the topic boundary before details begin.",
      narration: session.watch,
      checkpoint: `By the end of this scene, the student should state why ${session.title} matters for GS Geography.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-mechanism`,
      kind: "mechanism",
      title: "Core mechanism",
      objective: "Convert the topic into cause, process, and consequence.",
      narration: `Build the mechanism through ${firstTopics || session.anchor}. Avoid isolated facts; explain how one variable changes another.`,
      checkpoint: "Student can explain the mechanism without reading the slide.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-map`,
      kind: "map",
      title: "Map or example proof",
      objective: "Attach the idea to a place, pattern, region, or Indian example.",
      narration: `Place ${session.title} on a map using ${session.anchor}. The example must make the concept visible spatially.`,
      checkpoint: "Student can name one location or map cue that proves the concept.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-trap`,
      kind: "trap",
      title: "UPSC statement trap",
      objective: "Prepare the student for wrong-generalization and pair-matching traps.",
      narration: session.test,
      checkpoint: "Student can predict one almost-correct statement and the hidden exception.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-recap`,
      kind: "recap",
      title: "Talk room handoff",
      objective: "Compress the class into an oral answer.",
      narration: session.talk,
      checkpoint: "Student is ready to explain the topic to the AI teacher in their own words.",
      durationMinutes: 2,
    },
  ];
}

export function getGeographyTalkUnlockStage(assessment?: GeographyAssessment | null): GeographyTalkUnlockStage {
  const score = assessment?.score ?? 0;
  if (score < 40) return "revisit";
  if (score < 70) return "retry";
  if (score < 85) return "lab";
  return "mcq";
}

function extractKeywords(session: GeographySession) {
  const source = [
    session.title,
    session.chapter,
    session.anchor,
    session.watch,
    session.talk,
    session.test,
    ...getGeographySubtopics(session),
  ].join(" ");

  const words = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !stopWords.has(word));

  return Array.from(new Set(words)).slice(0, 14);
}

function rubricStatus(score: number, max: number): GeographyAssessmentRubricItem["status"] {
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= 0.72) return "Ready";
  if (ratio >= 0.42) return "Forming";
  return "Weak";
}

function buildRubricItem(
  label: GeographyAssessmentRubricItem["label"],
  score: number,
  max: number,
  evidence: string
): GeographyAssessmentRubricItem {
  return {
    label,
    score,
    max,
    status: rubricStatus(score, max),
    evidence,
  };
}

export function assessGeographyExplanation(session: GeographySession, answer: string): GeographyAssessment {
  const keywords = extractKeywords(session);
  const normalizedAnswer = answer.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 5);
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const keywordScore = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 30) : 0;
  const mechanismScore = Math.min(
    20,
    (/(cause|because|mechanism|process|leads|results|creates|drives|controls|forms|explains|due to|shift|gradient|convection|collision|subduction|upwelling|orograph)/i.test(answer) ? 12 : 0) +
      (/(effect|impact|consequence|therefore|so that|connects|link|affect|redistribute|variation|exception)/i.test(answer) ? 8 : 0)
  );
  const mapScore = Math.min(
    20,
    (/(map|region|river|coast|relief|climate|location|india|example|himalaya|plateau|plain|ghat|bay|arabian|western|eastern|delta|desert|floodplain|margin)/i.test(answer) ? 12 : 0) +
      (/(case|such as|for example|instance|corbett|kaziranga|sundarbans|monsoon|ganga|brahmaputra|deccan|thar|kerala|tamil nadu|andaman)/i.test(answer) ? 8 : 0)
  );
  const trapScore = Math.min(
    15,
    (/(upsc|trap|statement|pair|match|incorrect|almost-correct|wrong|reverse|confuse|exception|not all|however|but|avoid)/i.test(answer) ? 10 : 0) +
      (/(salinity alone|always|never|uniform|identical|only|all|every|not simply|not the same)/i.test(answer) ? 5 : 0)
  );
  const expressionScore = Math.min(
    15,
    (wordCount >= 45 ? 8 : wordCount >= 25 ? 5 : wordCount >= 15 ? 3 : 0) +
      (/(first|then|finally|start|end|core|map|trap|concept|mechanism)/i.test(answer) ? 4 : 0) +
      (answer.trim().length > 0 && !/(confused|cannot explain|don't know|do not know)/i.test(answer) ? 3 : 0)
  );
  const score = Math.min(100, Math.round(keywordScore + mechanismScore + mapScore + trapScore + expressionScore));
  const rubric: GeographyAssessmentRubricItem[] = [
    buildRubricItem(
      "Recall",
      keywordScore,
      30,
      matchedKeywords.length > 0 ? `Matched ${matchedKeywords.slice(0, 4).join(", ")}.` : "Core topic vocabulary is missing."
    ),
    buildRubricItem(
      "Mechanism",
      mechanismScore,
      20,
      mechanismScore >= 15 ? "Cause-effect chain is visible." : "Needs clearer cause, process, and consequence."
    ),
    buildRubricItem(
      "Map proof",
      mapScore,
      20,
      mapScore >= 15 ? "Location/example proof is visible." : "Needs one map cue, Indian example, or region anchor."
    ),
    buildRubricItem(
      "UPSC trap",
      trapScore,
      15,
      trapScore >= 11 ? "Statement trap or exception is visible." : "Needs one almost-correct UPSC statement and exception."
    ),
    buildRubricItem(
      "Expression",
      expressionScore,
      15,
      expressionScore >= 11 ? "Answer has enough length and structure." : "Needs a cleaner spoken structure."
    ),
  ];
  const repairHints = rubric
    .filter((item) => item.status !== "Ready")
    .map((item) => {
      if (item.label === "Recall") return `Use these missing terms: ${missingKeywords.join(", ") || session.title}.`;
      if (item.label === "Mechanism") return "Add a because-chain: cause -> process -> effect -> exception.";
      if (item.label === "Map proof") return "Add one map proof: region, river, coast, relief, climate belt, or Indian example.";
      if (item.label === "UPSC trap") return "Add one UPSC trap: an almost-correct statement and the exception.";
      return "Speak in a compact order: concept -> mechanism -> map/example -> trap.";
    });

  if (score < 40) {
    return {
      score,
      band: "Revisit",
      matchedKeywords,
      missingKeywords,
      summary: "The explanation is still thin. The student should revisit a compressed recap before attempting MCQs.",
      nextAction: "Rewatch compressed recap",
      rubric,
      repairHints,
    };
  }

  if (score < 70) {
    return {
      score,
      band: "Practice",
      matchedKeywords,
      missingKeywords,
      summary: "The core idea is forming, but it is not strong enough to unlock the lab. Revisit the compressed explanation, then explain again.",
      nextAction: "Retry oral check",
      rubric,
      repairHints,
    };
  }

  if (score < 85) {
    return {
      score,
      band: "Practice",
      matchedKeywords,
      missingKeywords,
      summary: "The explanation has enough conceptual coverage for the Visual Lab. Add one stronger map proof before MCQs.",
      nextAction: "Open visual lab",
      rubric,
      repairHints,
    };
  }

  return {
    score,
    band: "Command",
    matchedKeywords,
    missingKeywords,
    summary: "The explanation has enough conceptual coverage to proceed to topic MCQs and the next class.",
    nextAction: "Proceed to MCQs",
    rubric,
    repairHints,
  };
}

export function buildGeographyChallengeScaffold(session: GeographySession, assessment: GeographyAssessment) {
  const weakLabels = assessment.rubric
    .filter((item) => item.status !== "Ready")
    .map((item) => item.label.toLowerCase())
    .join(", ");
  const repairHint = assessment.repairHints[0] ?? "Add a stronger mechanism, map example, and UPSC trap.";
  const missing = assessment.missingKeywords.length ? assessment.missingKeywords.slice(0, 3).join(", ") : session.title;

  return [
    `I will repair the weak area: ${weakLabels || "final polish"}.`,
    `Core concept: ${session.title} is linked with ${session.anchor}.`,
    `Mechanism: ${repairHint}`,
    `Map/example: I will attach it to one region, river, coast, relief feature, climate belt, or Indian example using ${missing}.`,
    "UPSC trap: the statement becomes risky when it overgeneralizes location, cause, or exception.",
  ].join(" ");
}

export function buildGeographyMaicDiscussion(
  session: GeographySession,
  answer: string,
  assessment: GeographyAssessment
): GeographyMaicDiscussion {
  const stage = getGeographyTalkUnlockStage(assessment);
  const subtopics = getGeographySubtopics(session);
  const conciseAnswer = answer.trim().replace(/\s+/g, " ").slice(0, 220);
  const missing = assessment.missingKeywords.length
    ? assessment.missingKeywords.join(", ")
    : "no major keyword gap";
  const matched = assessment.matchedKeywords.length
    ? assessment.matchedKeywords.slice(0, 5).join(", ")
    : "not enough mapped concepts yet";
  const weakestRubric = [...assessment.rubric].sort((first, second) => first.score / first.max - second.score / second.max)[0];
  const repairHint = assessment.repairHints[0] ?? "tighten concept, mechanism, map proof, and trap.";

  const verdictByStage: Record<GeographyTalkUnlockStage, string> = {
    revisit: "Revisit required: the explanation is too thin for forward movement.",
    retry: "Retry required: the student has some logic, but the answer needs a cleaner mechanism and example.",
    lab: "Visual Lab unlocked: the concept is good enough for map/simulation proof before MCQs.",
    mcq: "MCQ route conditionally unlocked: complete Visual Lab proof first if it is still pending.",
  };

  return {
    score: assessment.score,
    unlockStage: stage,
    verdict: verdictByStage[stage],
    turns: [
      {
        role: "AI Teacher",
        title: "Recall and mechanism",
        tone: "teacher",
        message: `Explain ${session.title} through concept, mechanism, map proof, and trap. Your current response starts: "${conciseAnswer || "No student response yet."}"`,
      },
      {
        role: "Peer Challenger",
        title: `Counter-question: ${weakestRubric?.label ?? "Map proof"}`,
        tone: "peer",
        message: `I will challenge the weak point: ${repairHint} Connect ${subtopics.slice(0, 3).join(", ")} with a real map or Indian example. Avoid only listing terms.`,
      },
      {
        role: "UPSC Examiner",
        title: "Score gate",
        tone: "examiner",
        message: `Score ${assessment.score}/100. Matched: ${matched}. Repair: ${missing}. The weakest classroom skill is ${weakestRubric?.label ?? "unknown"}. This decides whether the route is Revisit, retry Talk, Visual Lab, or MCQ readiness.`,
      },
      {
        role: "Learning Summarizer",
        title: "Compressed memory",
        tone: "summarizer",
        message: `${assessment.summary} End the answer with one UPSC trap and one map cue before moving ahead.`,
      },
    ],
  };
}
