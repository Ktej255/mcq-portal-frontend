import type { SubjectSession } from "@/lib/upsc/subjectPlans";
import type { SubjectWatchScene } from "@/lib/upsc/subjectLearning";

export type EnvironmentLearningPack = {
  lens: string;
  teacherFocus: string;
  caseAnchors: string[];
  causeChain: string[];
  oralChecklist: string[];
  trapBank: string[];
  keywords: string[];
};

const packByLab: Record<string, EnvironmentLearningPack> = {
  "Ecosystem Board": {
    lens: "Ecology mechanism",
    teacherFocus: "Teach the topic as a living system: component, flow, disturbance, recovery, and exam trap.",
    caseAnchors: ["Wetland food web", "Grassland ecosystem", "Nutrient cycling", "Invasive species pressure"],
    causeChain: ["Habitat condition", "Species interaction", "Energy or nutrient flow", "Disturbance", "Ecological response"],
    oralChecklist: ["Define the ecological unit", "Explain one relationship", "Attach one India example", "Predict one statement trap"],
    trapBank: [
      "Treating ecology as isolated definitions instead of relationships.",
      "Assuming only forests have ecosystem value.",
      "Mixing energy flow with nutrient cycling.",
    ],
    keywords: ["habitat", "niche", "trophic", "producer", "consumer", "decomposer", "nutrient", "cycle", "disturbance"],
  },
  "Biodiversity Map": {
    lens: "Map-linked biodiversity",
    teacherFocus: "Make the student bind location, habitat, species, legal category, threat, and institution together.",
    caseAnchors: ["Western Ghats hotspot", "Kaziranga floodplain", "Sundarbans mangroves", "Great Indian Bustard grassland"],
    causeChain: ["Location", "Habitat", "Species or category", "Threat", "Conservation response"],
    oralChecklist: ["Name the region", "Name the habitat", "Name the threat", "Name the institution or legal hook"],
    trapBank: [
      "Confusing hotspot status with only high species richness.",
      "Treating protected areas as identical legal categories.",
      "Ignoring corridors and landscape-level conservation.",
    ],
    keywords: ["hotspot", "endemism", "protected", "sanctuary", "biosphere", "corridor", "species", "habitat", "iucn"],
  },
  "Pollution Control": {
    lens: "Pollution source-to-control chain",
    teacherFocus: "Force every answer through source, pollutant, pathway, impact, standard, and control.",
    caseAnchors: ["Delhi winter smog", "Eutrophication sequence", "Plastic leakage", "Industrial effluent chain"],
    causeChain: ["Source", "Pollutant", "Pathway", "Exposure", "Impact", "Control"],
    oralChecklist: ["Identify the pollutant", "Trace the pathway", "Explain the health/ecology impact", "Give one control tool"],
    trapBank: [
      "Giving a one-cause answer for multi-source pollution.",
      "Mixing BOD, COD, DO, and nutrient load.",
      "Treating bans as a complete waste-management solution.",
    ],
    keywords: ["source", "pollutant", "pathway", "impact", "control", "aqi", "bod", "eutrophication", "standard"],
  },
  "Climate Link": {
    lens: "Climate science-to-response chain",
    teacherFocus: "Move from physical mechanism to impact, then adaptation, mitigation, equity, and governance.",
    caseAnchors: ["Heat Action Plan", "Himalayan glacier risk", "Mangrove blue carbon", "Urban flooding and climate extremes"],
    causeChain: ["Forcing", "Feedback", "Impact", "Vulnerability", "Adaptation", "Mitigation"],
    oralChecklist: ["Separate adaptation and mitigation", "Give one vulnerable group/place", "Name one policy response", "Add one equity angle"],
    trapBank: [
      "Calling adaptation and mitigation the same response.",
      "Mixing ozone depletion with greenhouse effect.",
      "Ignoring vulnerability while describing climate hazards.",
    ],
    keywords: ["forcing", "feedback", "adaptation", "mitigation", "vulnerability", "resilience", "ndc", "equity", "warming"],
  },
  "Convention Tracker": {
    lens: "Convention logic",
    teacherFocus: "Separate treaty objective, principle, institution, obligation, mechanism, and common UPSC pair trap.",
    caseAnchors: ["Paris Agreement", "CITES appendix logic", "Ramsar wise use", "Montreal Protocol"],
    causeChain: ["Convention objective", "Principle", "Mechanism", "Institution", "Compliance", "Exam trap"],
    oralChecklist: ["Name the convention objective", "State the mechanism", "Avoid one pair-matching error", "Attach one Indian relevance"],
    trapBank: [
      "Mixing domestic wildlife law with CITES trade control.",
      "Assuming Ramsar wise use means total ban on human use.",
      "Reading nationally determined contributions as identical imposed targets.",
    ],
    keywords: ["unfccc", "paris", "cites", "ramsar", "montreal", "convention", "mechanism", "obligation", "principle"],
  },
  "Current Affairs Bridge": {
    lens: "News-to-static conversion",
    teacherFocus: "Convert news into static concept, institution, place, data/report, policy tool, and MCQ/revision hook.",
    caseAnchors: ["Environment report filter", "Species news filter", "Policy update filter", "Disaster-environment link"],
    causeChain: ["News trigger", "Static topic", "Institution", "Place or group", "Policy tool", "Question angle"],
    oralChecklist: ["Name the source", "Connect to static concept", "Add one institution", "Create one MCQ trap"],
    trapBank: [
      "Memorizing report names without publisher and indicator.",
      "Missing habitat and threat in species news.",
      "Remembering policy name but not instrument or ministry.",
    ],
    keywords: ["report", "species", "policy", "ministry", "indicator", "current", "place", "institution", "static"],
  },
};

function fallbackPack(session: SubjectSession): EnvironmentLearningPack {
  return {
    lens: session.lab,
    teacherFocus: `Teach ${session.title} through concept, mechanism, applied example, and UPSC trap.`,
    caseAnchors: [session.chapter, session.lab, "India example", "Current affairs hook"],
    causeChain: ["Concept", "Mechanism", "Example", "Institution", "Exam trap"],
    oralChecklist: ["Define", "Explain", "Apply", "Predict trap"],
    trapBank: ["Moving to MCQs without a concrete applied proof."],
    keywords: [session.title, session.chapter, session.lab]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
  };
}

export function getEnvironmentLearningPack(session: SubjectSession): EnvironmentLearningPack {
  return packByLab[session.lab] ?? fallbackPack(session);
}

export function buildEnvironmentWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const pack = getEnvironmentLearningPack(session);

  return [
    {
      id: `${session.day}-environment-briefing`,
      kind: "briefing",
      title: "Environment frame",
      objective: pack.lens,
      narration: `${pack.teacherFocus} Today's anchor is ${session.anchor}.`,
      checkpoint: `Student can say why ${session.title} matters for Environment GS, maps, and current affairs.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-environment-chain`,
      kind: "mechanism",
      title: "Cause chain",
      objective: "Build the answer sequence before memorizing facts.",
      narration: `Use this chain: ${pack.causeChain.join(" -> ")}. Explain each link with ${session.title}.`,
      checkpoint: "Student can speak the chain without reading the screen.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-environment-case`,
      kind: "application",
      title: "Case anchor",
      objective: "Attach one real example to the concept.",
      narration: `Choose one case: ${pack.caseAnchors.join(", ")}. The example must prove the concept, not just decorate the answer.`,
      checkpoint: "Student can connect one case to place, institution, threat, or policy.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-environment-trap`,
      kind: "trap",
      title: "UPSC trap bank",
      objective: "Predict the wrong statement before the test.",
      narration: `Common trap: ${pack.trapBank[0] ?? "Overgeneralizing the concept."}`,
      checkpoint: "Student can create one almost-correct statement and identify the hidden exception.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-environment-handoff`,
      kind: "handoff",
      title: "AI teacher handoff",
      objective: "Prepare the oral answer.",
      narration: `In Talk room, cover: ${pack.oralChecklist.join(", ")}.`,
      checkpoint: "Student is ready to explain the topic through concept, case, institution, and trap.",
      durationMinutes: 2,
    },
  ];
}
