import type { SubjectSession } from "@/lib/upsc/subjectPlans";

export type SubjectAssessmentBand = "Revisit" | "Practice" | "Command";

export type SubjectAssessment = {
  score: number;
  band: SubjectAssessmentBand;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
  nextAction: string;
};

export type SubjectAssessmentContext = {
  extraKeywords?: string[];
  appliedSignals?: string[];
};

export type SubjectTalkUnlockStage = "revisit" | "retry" | "lab" | "mcq";

export type SubjectMaicRole = "AI Teacher" | "Peer Challenger" | "UPSC Examiner" | "Learning Summarizer";

export type SubjectMaicTurn = {
  role: SubjectMaicRole;
  title: string;
  message: string;
  tone: "teacher" | "peer" | "examiner" | "summarizer";
};

export type SubjectMaicDiscussion = {
  turns: SubjectMaicTurn[];
  verdict: string;
  unlockStage: SubjectTalkUnlockStage;
  score: number;
};

export type SubjectWatchSceneKind = "briefing" | "mechanism" | "application" | "trap" | "handoff";

export type SubjectWatchScene = {
  id: string;
  kind: SubjectWatchSceneKind;
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
  "study",
  "build",
  "fresh",
  "slot",
  "through",
]);

export function getSubjectSubtopics(session: SubjectSession) {
  return Array.from(
    new Set(
      [session.anchor, session.chapter, session.lab]
        .join(",")
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean)
    )
  ).slice(0, 7);
}

export function getCompressedSubjectRecap(session: SubjectSession) {
  const subtopics = getSubjectSubtopics(session);

  return [
    `Start with ${session.title}: ${session.anchor}.`,
    `Explain the mechanism in your own words, then attach one India, policy, map, report, or current-affairs example.`,
    `Connect ${subtopics.slice(0, 3).join(", ")} through cause, impact, institution, and exception.`,
    `End by predicting one UPSC statement trap and one MCQ angle.`,
  ];
}

export function buildSubjectWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const subtopics = getSubjectSubtopics(session);
  const firstTopics = subtopics.slice(0, 3).join(", ");

  return [
    {
      id: `${session.day}-briefing`,
      kind: "briefing",
      title: "Class briefing",
      objective: "Set the boundary before the lecture begins.",
      narration: session.watch,
      checkpoint: `Student can state why ${session.title} matters inside ${session.chapter}.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-mechanism`,
      kind: "mechanism",
      title: "Core mechanism",
      objective: "Convert the topic into concept, process, cause, impact, and exception.",
      narration: `Build the explanation through ${firstTopics || session.anchor}. Avoid isolated facts; show how one variable changes the next.`,
      checkpoint: "Student can explain the mechanism without reading the screen.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-application`,
      kind: "application",
      title: "Applied proof",
      objective: "Attach the idea to India, policy, institution, report, map, technology, society, or current affairs.",
      narration: `Use ${session.anchor} to create one applied proof for ${session.title}. The example should make the concept testable.`,
      checkpoint: "Student can give one concrete applied example or case.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-trap`,
      kind: "trap",
      title: "UPSC statement trap",
      objective: "Prepare for wrong-generalization, pair-matching, and exception traps.",
      narration: session.test,
      checkpoint: "Student can predict one almost-correct statement and identify the hidden exception.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-handoff`,
      kind: "handoff",
      title: "Talk room handoff",
      objective: "Compress the class into an oral answer before forward movement.",
      narration: session.talk,
      checkpoint: "Student is ready to explain the topic to the AI teacher in their own words.",
      durationMinutes: 2,
    },
  ];
}

function extractKeywords(session: SubjectSession, extraKeywords: string[] = []) {
  const source = [
    session.title,
    session.chapter,
    session.anchor,
    session.watch,
    session.talk,
    session.test,
    session.lab,
    ...getSubjectSubtopics(session),
    ...extraKeywords,
  ].join(" ");

  const words = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !stopWords.has(word));

  return Array.from(new Set(words)).slice(0, 24);
}

export function assessSubjectExplanation(
  session: SubjectSession,
  answer: string,
  context: SubjectAssessmentContext = {}
): SubjectAssessment {
  const keywords = extractKeywords(session, context.extraKeywords);
  const normalizedAnswer = answer.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(keyword));
  const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 6);
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const keywordScore = keywords.length ? (matchedKeywords.length / keywords.length) * 65 : 0;
  const structureScore = Math.min(wordCount / 75, 1) * 20;
  const appliedPattern = new RegExp(
    ["india", "example", "policy", "report", "map", "species", "institution", "law", "cause", "impact", "effect", "mechanism", "current", ...(context.appliedSignals ?? [])]
      .map((signal) => signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|"),
    "i"
  );
  const appliedScore = appliedPattern.test(answer)
    ? 15
    : 0;
  const score = Math.min(100, Math.round(keywordScore + structureScore + appliedScore));

  if (score < 40) {
    return {
      score,
      band: "Revisit",
      matchedKeywords,
      missingKeywords,
      summary: "The explanation is still thin. The student should revisit the compressed recap before MCQs.",
      nextAction: "Rewatch compressed recap",
    };
  }

  if (score < 70) {
    return {
      score,
      band: "Practice",
      matchedKeywords,
      missingKeywords,
      summary: "The concept is forming, but it is not strong enough to unlock the lab. Revisit the compressed explanation, then explain again.",
      nextAction: "Retry oral check",
    };
  }

  if (score < 85) {
    return {
      score,
      band: "Practice",
      matchedKeywords,
      missingKeywords,
      summary: "The explanation has enough conceptual coverage for the lab. Add one stronger applied proof before MCQs.",
      nextAction: "Open visual lab",
    };
  }

  return {
    score,
    band: "Command",
    matchedKeywords,
    missingKeywords,
    summary: "The explanation has enough conceptual and applied coverage to proceed.",
    nextAction: "Proceed to MCQs",
  };
}

export function getSubjectTalkUnlockStage(assessment?: SubjectAssessment | null): SubjectTalkUnlockStage {
  const score = assessment?.score ?? 0;
  if (score < 40) return "revisit";
  if (score < 70) return "retry";
  if (score < 85) return "lab";
  return "mcq";
}

export function buildSubjectMaicDiscussion(
  session: SubjectSession,
  answer: string,
  assessment: SubjectAssessment
): SubjectMaicDiscussion {
  const stage = getSubjectTalkUnlockStage(assessment);
  const subtopics = getSubjectSubtopics(session);
  const conciseAnswer = answer.trim().replace(/\s+/g, " ").slice(0, 220);
  const missing = assessment.missingKeywords.length
    ? assessment.missingKeywords.join(", ")
    : "no major keyword gap";
  const matched = assessment.matchedKeywords.length
    ? assessment.matchedKeywords.slice(0, 5).join(", ")
    : "not enough mapped concepts yet";

  const verdictByStage: Record<SubjectTalkUnlockStage, string> = {
    revisit: "Revisit required: the explanation is too thin for forward movement.",
    retry: "Retry required: the student has partial logic, but the answer needs a cleaner mechanism and applied example.",
    lab: "Visual Lab unlocked: the concept is good enough for applied proof before MCQs.",
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
        message: `Explain ${session.title} through concept, mechanism, and one applied example. Your current response starts: "${conciseAnswer || "No student response yet."}"`,
      },
      {
        role: "Peer Challenger",
        title: "Counter-question",
        tone: "peer",
        message: `I will challenge the weak point: connect ${subtopics.slice(0, 3).join(", ")} with one India, policy, institution, map, report, or current-affairs example. Avoid only listing terms.`,
      },
      {
        role: "UPSC Examiner",
        title: "Score gate",
        tone: "examiner",
        message: `Score ${assessment.score}/100. Matched: ${matched}. Repair: ${missing}. This decides whether the route is Revisit, retry Talk, Visual Lab, or MCQ readiness.`,
      },
      {
        role: "Learning Summarizer",
        title: "Compressed memory",
        tone: "summarizer",
        message: `${assessment.summary} End the answer with one applied proof and one UPSC trap before moving ahead.`,
      },
    ],
  };
}
