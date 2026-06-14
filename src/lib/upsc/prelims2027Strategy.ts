export type StrategyStatus = "Planned" | "Building" | "Ready";

export type StrategyPriority = {
  id: string;
  subject: string;
  priority: "Critical" | "High" | "Medium" | "Low" | "Minimal";
  accuracy: string;
  window: string;
  ownerSurface: string;
  evidence: string;
  action: string;
  targetRoute: string;
  defaultStatus: StrategyStatus;
  gapTypes: string[];
};

export type StrategyGapType = {
  id: string;
  title: string;
  signal: string;
  softwareAction: string;
  targetSurface: string;
};

export type FormatRebuildRule = {
  id: string;
  format: string;
  targetPercent: number;
  reason: string;
  generatorPrompt: string;
};

export type SimulatorModule = {
  id: string;
  label: string;
  weight: number;
  strength: string;
  exposedIfMissing: string;
};

export type StrategyLaunchStep = {
  id: string;
  title: string;
  output: string;
  route: string;
};

export type StrategySprintCalendarItem = {
  id: string;
  window: string;
  phase: string;
  title: string;
  focus: string;
  priorityIds: string[];
  taskIds: string[];
  blueprintIds: string[];
  proofGate: string;
  releaseSignal: string;
  route: string;
};

export type StrategyTaskPhase = "Source" | "Capsule" | "MCQ" | "Proof" | "Release" | "Planner";

export type StrategyExecutionTask = {
  id: string;
  priorityId: string;
  phase: StrategyTaskPhase;
  title: string;
  output: string;
  ownerSurface: string;
  route: string;
};

export type StrategyEvidenceStatus = "Claim ready" | "Needs source pack" | "Needs page proof" | "Internal only";

export type StrategyEvidenceLedgerEntry = {
  id: string;
  priorityId: string;
  questionWindow: string;
  auditSignal: string;
  coverageRead: string;
  examSurprise: string;
  sourceStandard: string;
  publicClaimRule: string;
  softwareDecision: string;
  nextProofAction: string;
  proofStatus: StrategyEvidenceStatus;
  route: string;
};

export type StrategyPracticeBlueprint = {
  id: string;
  priorityId: string;
  formatRuleId: string;
  title: string;
  instruction: string;
  matchedGap: string;
  expectedOutput: string;
  difficulty: "Foundation" | "Exam Trap" | "Applied";
  minutes: number;
  route: string;
};

export type StrategyPracticeHandoff = {
  id: string;
  blueprintId: string;
  priorityId: string;
  subjectSlug: string;
  day: number;
  title: string;
  format: string;
  instruction: string;
  matchedGap: string;
  expectedOutput: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "PYQ_STYLE";
  plannedQuestions: number;
  minutes: number;
  generatedAt: string;
};

export type StrategyReallocationDecision = {
  id: string;
  priorityId: string;
  decision: "Build from scratch" | "Depth upgrade" | "Patch and tag" | "Maintain" | "Reduce";
  allocation: string;
  sourceShift: string;
  mcqTarget: string;
  releaseGate: string;
  studentSignal: string;
};

export const strategyPracticeHandoffStorageKey = "sarit-upsc-2027-practice-handoffs-v1";

const prioritySubjectSlug: Record<string, string> = {
  "ir-multilateral": "internal-security-society",
  "science-new-domains": "science-tech",
  "polity-legal-ethics": "polity-governance",
  "environment-current": "environment",
  "geography-international": "geography",
  "ancient-tn-board": "history",
  "economy-maintenance": "economy",
  "medieval-reduction": "history",
};

const priorityDefaultDay: Record<string, number> = {
  "ir-multilateral": 1,
  "science-new-domains": 1,
  "polity-legal-ethics": 1,
  "environment-current": 7,
  "geography-international": 8,
  "ancient-tn-board": 1,
  "economy-maintenance": 1,
  "medieval-reduction": 2,
};

function difficultyForBlueprint(blueprint: StrategyPracticeBlueprint): StrategyPracticeHandoff["difficulty"] {
  if (blueprint.difficulty === "Foundation") return "MEDIUM";
  if (blueprint.formatRuleId === "how-many-correct" || blueprint.formatRuleId === "match-pair") return "PYQ_STYLE";
  if (blueprint.difficulty === "Exam Trap") return "PYQ_STYLE";
  return "HARD";
}

function plannedQuestionsForBlueprint(blueprint: StrategyPracticeBlueprint) {
  const count = Number(blueprint.expectedOutput.match(/\d+/)?.[0] ?? 25);
  return Math.max(5, Math.min(100, count));
}

export function buildStrategyPracticeHandoff(
  blueprint: StrategyPracticeBlueprint,
  generatedAt = new Date().toISOString()
): StrategyPracticeHandoff {
  const format = formatRebuildRules.find((rule) => rule.id === blueprint.formatRuleId)?.format ?? "Practice";

  return {
    id: `${blueprint.id}-${generatedAt}`,
    blueprintId: blueprint.id,
    priorityId: blueprint.priorityId,
    subjectSlug: prioritySubjectSlug[blueprint.priorityId] ?? "geography",
    day: priorityDefaultDay[blueprint.priorityId] ?? 1,
    title: blueprint.title,
    format,
    instruction: blueprint.instruction,
    matchedGap: blueprint.matchedGap,
    expectedOutput: blueprint.expectedOutput,
    difficulty: difficultyForBlueprint(blueprint),
    plannedQuestions: plannedQuestionsForBlueprint(blueprint),
    minutes: blueprint.minutes,
    generatedAt,
  };
}

export const prelims2027Priorities: StrategyPriority[] = [
  {
    id: "ir-multilateral",
    subject: "IR / Multilateral Bodies",
    priority: "Critical",
    accuracy: "About 10%",
    window: "Immediate build",
    ownerSurface: "Content + MCQ Command",
    evidence: "Zero dedicated module; 11 questions exposed ASEAN, BIMSTEC, UN, G20, SCO, QUAD and trade gaps.",
    action: "Build from scratch with bodies, charters, members, summits, conventions and India links.",
    targetRoute: "/upsc/content-command?subject=internal-security-society&day=1",
    defaultStatus: "Planned",
    gapTypes: ["Content gap", "Current bridge gap", "Source depth gap"],
  },
  {
    id: "science-new-domains",
    subject: "S&T New Domains",
    priority: "Critical",
    accuracy: "About 45%",
    window: "Immediate build",
    ownerSurface: "Science Tech Command",
    evidence: "AI, blockchain, semiconductors, weather models and rare earths created the main misses.",
    action: "Add 100+ applied questions across AI, blockchain, quantum, semiconductor, defence and space policy.",
    targetRoute: "/upsc/science-tech",
    defaultStatus: "Planned",
    gapTypes: ["Content gap", "Format gap", "Current bridge gap"],
  },
  {
    id: "polity-legal-ethics",
    subject: "Polity Legal + Ethics",
    priority: "High",
    accuracy: "About 55%",
    window: "High-priority patch",
    ownerSurface: "Polity + Readiness Audit",
    evidence: "BNSS, RPwD and ethics-GS1 caselets were underbuilt.",
    action: "Add act-text drills and 40 scenario questions around procedure, rights and accountability.",
    targetRoute: "/upsc/polity-governance",
    defaultStatus: "Planned",
    gapTypes: ["Content gap", "Format gap", "Source depth gap"],
  },
  {
    id: "environment-current",
    subject: "Environment Current Layer",
    priority: "Medium",
    accuracy: "About 70%",
    window: "Patch and tag",
    ownerSurface: "Environment Command",
    evidence: "Species were supported, but climate-policy frameworks and FAO-style language need tagging.",
    action: "Reduce raw volume and add LT-LEDS, REDD+, Blue Transformation, NDC and report bridges.",
    targetRoute: "/upsc/environment",
    defaultStatus: "Building",
    gapTypes: ["Current bridge gap", "Source depth gap"],
  },
  {
    id: "geography-international",
    subject: "Geography International Map Layer",
    priority: "Medium",
    accuracy: "About 55%",
    window: "Patch and drill",
    ownerSurface: "Geography Command",
    evidence: "Indian physical geography was supported; international places-in-news were weaker.",
    action: "Add map radar for straits, lakes, ports, geoparks, corridors and resource routes.",
    targetRoute: "/upsc/geography",
    defaultStatus: "Building",
    gapTypes: ["Map and place gap", "Current bridge gap"],
  },
  {
    id: "ancient-tn-board",
    subject: "Ancient History TN Board Layer",
    priority: "Medium",
    accuracy: "About 80%",
    window: "Depth upgrade",
    ownerSurface: "History Command",
    evidence: "History performed well, but Vedic, Sangam and Tamilakam questions show TN Board depth is useful.",
    action: "Add TN Board source tags and convert deep-source facts into multi-statement traps.",
    targetRoute: "/upsc/history",
    defaultStatus: "Building",
    gapTypes: ["Source depth gap", "Format gap"],
  },
  {
    id: "economy-maintenance",
    subject: "Economy Maintenance Patch",
    priority: "Low",
    accuracy: "About 75%",
    window: "Maintenance",
    ownerSurface: "Economy Command",
    evidence: "Corrected PDF audit shows Economy was a strength after the 10-cluster module.",
    action: "Patch M1xchange/TReDS, bond taxonomy, crowdfunding and IRDAI; keep the core module.",
    targetRoute: "/upsc/economy",
    defaultStatus: "Ready",
    gapTypes: ["Source depth gap", "Current bridge gap"],
  },
  {
    id: "medieval-reduction",
    subject: "Medieval History Effort Reduction",
    priority: "Minimal",
    accuracy: "0 questions",
    window: "Reduce load",
    ownerSurface: "Yearly Planner",
    evidence: "Medieval produced zero questions in 2026 for the first time in the report's six-year lens.",
    action: "Reduce effort to maintenance coverage and shift build time to IR, S&T and legal-current gaps.",
    targetRoute: "/upsc/yearly-planner",
    defaultStatus: "Ready",
    gapTypes: ["Revision gap"],
  },
];

export const strategyGapTypes: StrategyGapType[] = [
  {
    id: "content-gap",
    title: "Content gap",
    signal: "The topic was absent or too thin: IR bodies, AI, blockchain, semiconductors, rare earths.",
    softwareAction: "Create new capsules, source notes and first-principles explainers before MCQ generation.",
    targetSurface: "Content Command",
  },
  {
    id: "format-gap",
    title: "Format gap",
    signal: "Topic may exist, but the student did not practice the UPSC format.",
    softwareAction: "Convert old recall questions into multi, how-many, pair, A-R, NOT and caselet formats.",
    targetSurface: "MCQ Command",
  },
  {
    id: "current-bridge-gap",
    title: "Current bridge gap",
    signal: "Static notes lacked current examples, reports, agencies, missions or schemes.",
    softwareAction: "Attach every current item to a syllabus node and two predicted statement frames.",
    targetSurface: "Current Affairs Bridge",
  },
  {
    id: "map-place-gap",
    title: "Map and place gap",
    signal: "Strategic locations, lakes, straits, ports, geoparks and corridors were underbuilt.",
    softwareAction: "Build a monthly map radar with atlas drills and route-based MCQs.",
    targetSurface: "Geography Command",
  },
  {
    id: "source-depth-gap",
    title: "Source depth gap",
    signal: "TN Board, act text, official frameworks and regulatory bodies were not tagged deeply enough.",
    softwareAction: "Add source ROI tags, exact page proof and accepted/rejected proof states.",
    targetSurface: "Evidence Ledger",
  },
  {
    id: "revision-gap",
    title: "Revision gap",
    signal: "Covered content still needs repeated exam-format practice to become answerable.",
    softwareAction: "Schedule weak-format revision loops for each student profile.",
    targetSurface: "Revision Command",
  },
];

export const strategyReallocationPlan: StrategyReallocationDecision[] = [
  {
    id: "ir-reallocation",
    priorityId: "ir-multilateral",
    decision: "Build from scratch",
    allocation: "Move this into the first build block with dedicated source rows before regular current-affairs coverage.",
    sourceShift: "Official body pages, charters, summit declarations, MEA releases and membership tables.",
    mcqTarget: "Match-pair, how-many-correct and institution-role traps for ASEAN, BIMSTEC, SCO, QUAD, G20 and UN.",
    releaseGate: "No public or student-facing claim until each body has source, date and India-link proof.",
    studentSignal: "Student can identify role, membership, charter language and India connection without guessing from news memory.",
  },
  {
    id: "science-reallocation",
    priorityId: "science-new-domains",
    decision: "Build from scratch",
    allocation: "Create a new applied S&T track before adding more generic science revision.",
    sourceShift: "PIB, MeitY, ISRO, DRDO, DST, semiconductor policy, rare-earth and space-policy official sources.",
    mcqTarget: "100+ applied questions across AI, blockchain, quantum, semiconductors, defence tech, space and rare earths.",
    releaseGate: "Each technology card needs source date, application, limitation and governance trap.",
    studentSignal: "Student can solve use-case and limitation questions, not only define the technology.",
  },
  {
    id: "polity-reallocation",
    priorityId: "polity-legal-ethics",
    decision: "Depth upgrade",
    allocation: "Add legal-current caselets without rebuilding the whole Polity base.",
    sourceShift: "Bare act text, official rules, ministry explainer and committee/rights sources.",
    mcqTarget: "40 scenario, assertion-reason and act-definition questions around BNSS, RPwD and accountability.",
    releaseGate: "Act section, definition or official source must be attached to every public claim.",
    studentSignal: "Student can pick the lawful or ethical action in a short applied situation.",
  },
  {
    id: "environment-reallocation",
    priorityId: "environment-current",
    decision: "Patch and tag",
    allocation: "Keep species strength but add report and policy-current bridges.",
    sourceShift: "MoEFCC, UNFCCC, FAO, CBD, official protected-area sources and dated framework anchors.",
    mcqTarget: "Species-policy crosswalk plus FAO/LT-LEDS/REDD+/NDC statement traps.",
    releaseGate: "Species, framework and source phrase must be visible together.",
    studentSignal: "Student can connect protected-area facts with policy framework language.",
  },
  {
    id: "geography-reallocation",
    priorityId: "geography-international",
    decision: "Patch and tag",
    allocation: "Add a monthly international map-current radar rather than more generic physical geography.",
    sourceShift: "Atlas proof, official map/source where available, current-affairs date and location clue.",
    mcqTarget: "Strait, lake, port, corridor, geopark and resource-route match-pair drills.",
    releaseGate: "Every place claim must show exact clue plus map/source anchor.",
    studentSignal: "Student can locate and connect the place to route, resource, country or event context.",
  },
  {
    id: "ancient-reallocation",
    priorityId: "ancient-tn-board",
    decision: "Depth upgrade",
    allocation: "Keep broad Ancient coverage and add TN Board/source-depth traps.",
    sourceShift: "TN Board source tags, standard text reference, page/section proof and teacher trap note.",
    mcqTarget: "How-many-correct, match-pair and multi-statement questions on Sangam, Vedic, Tamilakam and texts.",
    releaseGate: "Deep-source hits remain locked until exact text/page proof is retained.",
    studentSignal: "Student can distinguish close terms, text traditions and chronology traps.",
  },
  {
    id: "economy-reallocation",
    priorityId: "economy-maintenance",
    decision: "Maintain",
    allocation: "Protect the existing strong Economy module and only patch named residual gaps.",
    sourceShift: "RBI, SEBI, IRDAI, official scheme pages, regulator circulars and current data source.",
    mcqTarget: "Maintenance questions on M1xchange/TReDS, bond taxonomy, crowdfunding, IRDAI and instruments.",
    releaseGate: "Each example needs regulator/source proof before being used as a public hit example.",
    studentSignal: "Student keeps Economy answerability without stealing build time from IR and S&T.",
  },
  {
    id: "medieval-reallocation",
    priorityId: "medieval-reduction",
    decision: "Reduce",
    allocation: "Cap Medieval at maintenance and move saved build hours to IR, S&T and legal-current gaps.",
    sourceShift: "Existing high-yield notes plus minimum viable source tags for revision-only practice.",
    mcqTarget: "Short maintenance drills only; no expansion batch unless trend changes.",
    releaseGate: "Frame as internal planning logic, not a public coverage claim.",
    studentSignal: "Student revises essentials without over-investing in a low-yield 2026 area.",
  },
];

export const strategyEvidenceLedger: StrategyEvidenceLedgerEntry[] = [
  {
    id: "ir-proof-ledger",
    priorityId: "ir-multilateral",
    questionWindow: "ASEAN, BIMSTEC, UN, G20, SCO, QUAD, trade and convention questions",
    auditSignal: "The PDF shows a structural miss: IR bodies were repeatedly asked but no dedicated module existed.",
    coverageRead: "Mostly absent, not merely weak. Treat as a new 2027 pillar.",
    examSurprise: "UPSC tested institutional role, membership, charter language and India links rather than broad diplomacy news.",
    sourceStandard: "Official organisation pages, summit declarations, MEA releases and one dated current bridge per body.",
    publicClaimRule: "Do not show a public hit claim until the exact body, statement and official source are retained.",
    softwareDecision: "Create IR body source matrix, then generate match-pair and how-many-correct drills.",
    nextProofAction: "Lock source rows for ASEAN, BIMSTEC, SCO, QUAD, G20 and UN before release.",
    proofStatus: "Needs source pack",
    route: "/upsc/content-command?subject=internal-security-society&day=1",
  },
  {
    id: "science-proof-ledger",
    priorityId: "science-new-domains",
    questionWindow: "AI, blockchain, quantum, semiconductor, defence tech, space policy and rare earths",
    auditSignal: "The final PDF identifies new-domain Science and Tech as the largest applied miss zone.",
    coverageRead: "Conceptual coverage existed in places, but not enough official-current and application depth.",
    examSurprise: "UPSC converted technology news into limitation, governance, use-case and strategic-material traps.",
    sourceStandard: "PIB, MeitY, ISRO, DRDO, DST, ministry notes, official policy documents and dated explainers.",
    publicClaimRule: "A claim is publishable only when the technology, application and source date are all visible.",
    softwareDecision: "Build six new capsules and convert them into applied multi-statement and NOT/exception questions.",
    nextProofAction: "Attach official source tags to every AI, blockchain, quantum, semiconductor and rare-earth capsule.",
    proofStatus: "Needs source pack",
    route: "/upsc/science-tech",
  },
  {
    id: "polity-proof-ledger",
    priorityId: "polity-legal-ethics",
    questionWindow: "BNSS, RPwD, social justice, rights, committees and governance-ethics caselets",
    auditSignal: "Polity fundamentals were present, but act-text and caselet-style legal-current questions were underbuilt.",
    coverageRead: "Partial coverage. Needs depth and format conversion rather than a full subject rebuild.",
    examSurprise: "The paper moved toward rights, procedure and accountable action in short applied scenarios.",
    sourceStandard: "Bare act text, official rules, ministry explainer, committee report and teacher caselet explanation.",
    publicClaimRule: "Public proof must show the relevant act, section/definition or official committee source.",
    softwareDecision: "Add act-text packs and release scenario/caselet and assertion-reason practice.",
    nextProofAction: "Proof-lock BNSS and RPwD statements before connecting them to student-facing practice.",
    proofStatus: "Needs page proof",
    route: "/upsc/polity-governance",
  },
  {
    id: "environment-proof-ledger",
    priorityId: "environment-current",
    questionWindow: "Species, protected areas, FAO language, LT-LEDS, REDD+, Blue Transformation, NDC and CBD",
    auditSignal: "Environment direction was strong, but report language and policy-current tagging need tightening.",
    coverageRead: "Good base coverage with a current-bridge gap.",
    examSurprise: "UPSC blended species facts with framework terms and official report phrasing.",
    sourceStandard: "MoEFCC, UNFCCC, FAO, CBD, official protected-area sources and dated scheme/report anchors.",
    publicClaimRule: "Use public language only when species, framework and source phrase are visible together.",
    softwareDecision: "Create species-policy crosswalk and monthly environment current bridge.",
    nextProofAction: "Tag each framework with one official source and one likely UPSC statement trap.",
    proofStatus: "Needs page proof",
    route: "/upsc/environment",
  },
  {
    id: "geography-proof-ledger",
    priorityId: "geography-international",
    questionWindow: "Strategic straits, ports, lakes, geoparks, corridors, borders, resources and places in news",
    auditSignal: "Indian physical geography was supported, but international places-in-news were weaker.",
    coverageRead: "Partial coverage. The correction is a map-current layer, not more generic notes.",
    examSurprise: "The paper asked map intelligence as route, resource, country and event associations.",
    sourceStandard: "Atlas proof, official map/source where available, current-affairs date and location clue.",
    publicClaimRule: "A geography claim should show the exact place clue and the map or source anchor.",
    softwareDecision: "Build monthly map radar and convert it into match-pair plus route-based MCQs.",
    nextProofAction: "Create the first strait/lake/port/corridor ledger with atlas and current clue columns.",
    proofStatus: "Needs page proof",
    route: "/upsc/geography",
  },
  {
    id: "ancient-proof-ledger",
    priorityId: "ancient-tn-board",
    questionWindow: "Vedic, Sangam, Tamilakam, texts, archaeology, chronology and early settlement themes",
    auditSignal: "History performed well, but deeper source precision still improved answerability.",
    coverageRead: "Broadly covered with a source-depth upgrade needed.",
    examSurprise: "UPSC rewarded exact distinction among terms, texts, chronology and cultural context.",
    sourceStandard: "TN Board source tag, standard text reference, page/section proof and trap explanation.",
    publicClaimRule: "Do not advertise deep-source hits unless exact text/page proof is retained.",
    softwareDecision: "Turn TN Board facts into how-many-correct, match-pair and multi-statement traps.",
    nextProofAction: "Create source-depth fact ledger for Sangam, Vedic and Tamilakam entries.",
    proofStatus: "Needs page proof",
    route: "/upsc/history",
  },
  {
    id: "economy-proof-ledger",
    priorityId: "economy-maintenance",
    questionWindow: "Digital finance, MSME finance, TReDS, M1xchange, bonds, crowdfunding, IRDAI and inclusion",
    auditSignal: "The corrected PDF audit treats Economy as a strength after the 10-cluster module.",
    coverageRead: "Strong coverage with named maintenance patches.",
    examSurprise: "UPSC stayed applied: terms, regulator roles, instruments, indices and data interpretation.",
    sourceStandard: "RBI, SEBI, IRDAI, official scheme pages, regulator circulars and current data source.",
    publicClaimRule: "Economy strength can be shown, but each example needs regulator/source proof.",
    softwareDecision: "Preserve the core module and add maintenance questions only for named residual gaps.",
    nextProofAction: "Proof-lock M1xchange/TReDS, bond taxonomy, crowdfunding and IRDAI rows.",
    proofStatus: "Claim ready",
    route: "/upsc/economy",
  },
  {
    id: "medieval-proof-ledger",
    priorityId: "medieval-reduction",
    questionWindow: "Medieval essentials, art, administration, Bhakti-Sufi and revision-only coverage",
    auditSignal: "The six-year lens shows zero Medieval questions in 2026, so expansion has low immediate return.",
    coverageRead: "Maintain, do not expand.",
    examSurprise: "The surprise was absence; the lesson is time reallocation, not deletion.",
    sourceStandard: "Existing high-yield notes plus minimum viable source tags for revision-only practice.",
    publicClaimRule: "This should be framed as internal planning logic, not a public hit claim.",
    softwareDecision: "Cap Medieval in the planner and move saved build hours to IR and S&T.",
    nextProofAction: "Keep a maintenance sheet and document the hour reallocation in the yearly planner.",
    proofStatus: "Internal only",
    route: "/upsc/yearly-planner",
  },
];

export const formatRebuildRules: FormatRebuildRule[] = [
  {
    id: "multi-statement",
    format: "Multi-statement",
    targetPercent: 50,
    reason: "Dominant UPSC style after 2026.",
    generatorPrompt: "Create 3-4 statements with one scope trap, one exception and one application clue.",
  },
  {
    id: "how-many-correct",
    format: "How-many-correct",
    targetPercent: 15,
    reason: "Rising format that students faced cold.",
    generatorPrompt: "Write four statements where students must count correct statements, not identify a single pair.",
  },
  {
    id: "match-pair",
    format: "Match-pair",
    targetPercent: 10,
    reason: "Stable across years and useful for maps, indices and culture.",
    generatorPrompt: "Pair institution/place/report/style with a close distractor from the same domain.",
  },
  {
    id: "not-exception",
    format: "NOT / Exception",
    targetPercent: 10,
    reason: "Persistent trap style that rewards elimination discipline.",
    generatorPrompt: "Ask the incorrect or not-applicable statement after teaching the correct rule.",
  },
  {
    id: "assertion-reason",
    format: "Assertion-reason",
    targetPercent: 5,
    reason: "Returning format that tests why, not just what.",
    generatorPrompt: "Frame an assertion and reason where both may be true but the explanation link is tested.",
  },
  {
    id: "scenario-caselet",
    format: "Scenario / Caselet",
    targetPercent: 10,
    reason: "New GS-1 signal and a first-mover opportunity.",
    generatorPrompt: "Create a short administrative or governance case and ask the correct legal/ethical action.",
  },
];

export const simulatorModules: SimulatorModule[] = [
  {
    id: "economy-master",
    label: "Economy Master Module",
    weight: 18,
    strength: "Protects digital economy, deficits, NBFC, GST, indices and CBDC areas.",
    exposedIfMissing: "Economy shifts from strength to avoidable exposure.",
  },
  {
    id: "art-culture-bank",
    label: "Art and Culture Bank",
    weight: 10,
    strength: "Supports iconography, architecture, gharanas, caves and visual recognition.",
    exposedIfMissing: "Culture recall and visual traps become fragile.",
  },
  {
    id: "history-tn-board",
    label: "Ancient + TN Board Layer",
    weight: 10,
    strength: "Adds Sangam, Vedic and deep-source support.",
    exposedIfMissing: "Ancient remains broad but loses deep-source precision.",
  },
  {
    id: "ir-module",
    label: "IR / Multilateral Module",
    weight: 16,
    strength: "Covers the largest structural gap from the 2026 PDF.",
    exposedIfMissing: "ASEAN, BIMSTEC, UN, G20, SCO, QUAD and trade remain exposed.",
  },
  {
    id: "science-domains",
    label: "S&T New Domains",
    weight: 15,
    strength: "Protects AI, blockchain, quantum, semiconductor, defence and space policy.",
    exposedIfMissing: "Applied technology remains the main high-score risk.",
  },
  {
    id: "legal-ethics",
    label: "Legal + Ethics Caselets",
    weight: 12,
    strength: "Prepares BNSS, RPwD and GS-1 governance scenario questions.",
    exposedIfMissing: "New caselet format remains untrained.",
  },
  {
    id: "map-radar",
    label: "International Map Radar",
    weight: 9,
    strength: "Covers places in news, straits, lakes, ports and corridors.",
    exposedIfMissing: "Strategic geography and IR geography remain weak.",
  },
  {
    id: "format-rebuilder",
    label: "Format Rebuilder Practice",
    weight: 10,
    strength: "Converts content into the paper's actual asking style.",
    exposedIfMissing: "Student knows topics but loses marks in statement logic.",
  },
];

export const strategyLaunchSteps: StrategyLaunchStep[] = [
  {
    id: "tag",
    title: "Tag every 2026 question",
    output: "Question gets subject, source, hit stage, gap type and 2027 action.",
    route: "/upsc/prelims-2026-showcase",
  },
  {
    id: "assign",
    title: "Assign every gap to a command center",
    output: "Content, MCQ, current bridge, map, source proof or revision owner is visible.",
    route: "/upsc/prelims-2027-strategy",
  },
  {
    id: "build",
    title: "Build critical gaps first",
    output: "IR and S&T new domains move before low-return expansion.",
    route: "/upsc/content-command",
  },
  {
    id: "convert",
    title: "Convert old banks into 2026 formats",
    output: "Every subject bank follows the target format mix.",
    route: "/upsc/mcq-command",
  },
  {
    id: "simulate",
    title: "Simulate student exposure",
    output: "Completed modules produce a readiness score and exposed-risk list.",
    route: "/upsc/prelims-2027-strategy#simulator",
  },
];

export const strategySprintCalendar: StrategySprintCalendarItem[] = [
  {
    id: "sprint-1-source-foundation",
    window: "Weeks 1-2",
    phase: "Source foundation",
    title: "Build the two missing pillars first",
    focus: "IR / multilateral bodies and S&T new domains receive source matrices, official tags and first capsules before any broad expansion.",
    priorityIds: ["ir-multilateral", "science-new-domains"],
    taskIds: ["ir-source-matrix", "ir-static-current-bridge", "st-domain-capsules", "st-current-source-tags"],
    blueprintIds: ["ir-body-match-pair", "ir-summit-how-many", "st-ai-application-multi", "st-semiconductor-exception"],
    proofGate: "No public claim beyond 'critical build started' until official source rows exist.",
    releaseSignal: "IR and S&T source packs have enough proof to generate first MCQ handoffs.",
    route: "/upsc/prelims-2027-strategy#prelims-2027-evidence-ledger",
  },
  {
    id: "sprint-2-legal-current",
    window: "Weeks 3-4",
    phase: "Legal and current bridge",
    title: "Patch Polity legal-current and Environment framework language",
    focus: "BNSS, RPwD, ethics-governance caselets, LT-LEDS, REDD+, Blue Transformation, NDC and FAO language become tagged content.",
    priorityIds: ["polity-legal-ethics", "environment-current"],
    taskIds: ["polity-act-text-pack", "polity-caselet-bank", "env-framework-pack", "env-species-policy-crosswalk"],
    blueprintIds: ["polity-bnss-caselet", "polity-rpwd-ar", "env-framework-counter", "env-species-policy-exception"],
    proofGate: "Act text and official framework sources must be attached before student release.",
    releaseSignal: "Scenario/caselet and current-environment drills are ready for MCQ Command.",
    route: "/upsc/prelims-2027-strategy#practice-blueprints",
  },
  {
    id: "sprint-3-map-source-depth",
    window: "Weeks 5-6",
    phase: "Map and source depth",
    title: "Add international map radar and TN Board depth",
    focus: "Strategic straits, ports, lakes, corridors, Sangam, Tamilakam, Vedic and source-depth ancient facts become proof-led practice material.",
    priorityIds: ["geography-international", "ancient-tn-board"],
    taskIds: ["geo-map-radar", "geo-atlas-drills", "geo-map-proof-lock", "ancient-tn-source-pack", "ancient-deep-fact-ledger"],
    blueprintIds: ["geo-places-match", "geo-route-multi", "ancient-tn-counter", "ancient-source-match"],
    proofGate: "Atlas/source proof and TN Board tags must be retained before publishing exact examples.",
    releaseSignal: "Map and ancient source-depth sets are generated and tagged by format.",
    route: "/upsc/geography",
  },
  {
    id: "sprint-4-format-rebuild",
    window: "Weeks 7-8",
    phase: "Format conversion",
    title: "Convert old banks into UPSC 2026 formats",
    focus: "All priority areas move into multi-statement, how-many-correct, match-pair, NOT/exception, assertion-reason and caselet formats.",
    priorityIds: ["ir-multilateral", "science-new-domains", "polity-legal-ethics", "environment-current", "geography-international", "ancient-tn-board"],
    taskIds: ["ir-mcq-bank", "st-applied-mcq-bank", "env-current-mcq", "geo-map-mcq-bank", "ancient-multi-statement"],
    blueprintIds: ["ir-body-match-pair", "ir-summit-how-many", "st-ai-application-multi", "st-semiconductor-exception", "polity-bnss-caselet", "polity-rpwd-ar", "env-framework-counter", "env-species-policy-exception", "geo-places-match", "geo-route-multi", "ancient-tn-counter", "ancient-source-match"],
    proofGate: "Question banks can be generated before public claims, but explanation proof must stay attached.",
    releaseSignal: "At least one generated blueprint exists for every high and critical priority.",
    route: "/upsc/mcq-command",
  },
  {
    id: "sprint-5-student-pilot",
    window: "Weeks 9-10",
    phase: "Student pilot",
    title: "Lock batches and collect solved-attempt proof",
    focus: "Generated blueprints move into MCQ Command, then Question Bank practice captures solved attempts for high-risk drills.",
    priorityIds: ["ir-multilateral", "science-new-domains", "polity-legal-ethics", "geography-international"],
    taskIds: ["st-student-release", "polity-simulator-tags", "geo-current-updater", "ancient-revision-route"],
    blueprintIds: ["ir-body-match-pair", "st-ai-application-multi", "polity-bnss-caselet", "geo-places-match"],
    proofGate: "Do not call the engine fully operational until generated sets are locked and students have attempt proof.",
    releaseSignal: "Each critical/high priority has generated, locked and solved evidence.",
    route: "/upsc/question-bank",
  },
  {
    id: "sprint-6-maintenance-publication",
    window: "Weeks 11-12",
    phase: "Maintenance and publication",
    title: "Publish public-safe proof and freeze low-return effort",
    focus: "Economy maintenance patches are proof-locked, Medieval expansion is capped, and the public page uses corrected audit language only.",
    priorityIds: ["economy-maintenance", "medieval-reduction"],
    taskIds: ["eco-treds-patch", "eco-bond-taxonomy", "eco-irdai-pack", "eco-regulator-proof-lock", "medieval-effort-cap", "medieval-maintenance-sheet", "medieval-reallocate-hours", "medieval-revision-only"],
    blueprintIds: ["eco-treds-multi", "eco-bond-exception", "medieval-maintenance-match", "medieval-revision-multi"],
    proofGate: "Only corrected PDF audit numbers and proof-locked language go to the main website.",
    releaseSignal: "Publish gate, copy kit and delivery dashboard agree on what is public-safe.",
    route: "/upsc-prelims-2026-showcase#website-copy-kit",
  },
];

export const strategyPracticeBlueprints: StrategyPracticeBlueprint[] = [
  {
    id: "ir-body-match-pair",
    priorityId: "ir-multilateral",
    formatRuleId: "match-pair",
    title: "IR body and India-link match set",
    instruction: "Match ASEAN, BIMSTEC, SCO, QUAD, G20 and UN bodies with members, secretariat, summit theme and India's role.",
    matchedGap: "Directly repairs the 2026 multilateral-body misses.",
    expectedOutput: "25 match-pair questions with one close institutional distractor per pair.",
    difficulty: "Exam Trap",
    minutes: 45,
    route: "/upsc/mcq-command?subject=internal-security-society&day=1",
  },
  {
    id: "ir-summit-how-many",
    priorityId: "ir-multilateral",
    formatRuleId: "how-many-correct",
    title: "Summit, charter and convention counter",
    instruction: "Build four-statement questions where students count correct statements on bodies, conventions and India positions.",
    matchedGap: "Turns absent IR theory into UPSC's how-many-correct pressure format.",
    expectedOutput: "30 how-many-correct questions with source tags and current bridges.",
    difficulty: "Applied",
    minutes: 50,
    route: "/upsc/question-bank",
  },
  {
    id: "st-ai-application-multi",
    priorityId: "science-new-domains",
    formatRuleId: "multi-statement",
    title: "AI, blockchain and quantum application pack",
    instruction: "Create applied multi-statement questions on AI use cases, blockchain limits, quantum communication and cyber policy.",
    matchedGap: "Targets the new-domain Science and Tech surprise layer.",
    expectedOutput: "35 multi-statement questions with one technical limitation trap in each.",
    difficulty: "Applied",
    minutes: 55,
    route: "/upsc/science-tech",
  },
  {
    id: "st-semiconductor-exception",
    priorityId: "science-new-domains",
    formatRuleId: "not-exception",
    title: "Semiconductor and rare-earth exception drill",
    instruction: "Ask the incorrect statement about chips, fabs, lithography, rare earths, batteries and strategic minerals.",
    matchedGap: "Forces students to separate broad current affairs from exact technical scope.",
    expectedOutput: "25 NOT/exception questions connected to official policy language.",
    difficulty: "Exam Trap",
    minutes: 40,
    route: "/upsc/mcq-command?subject=science-tech&day=1",
  },
  {
    id: "polity-bnss-caselet",
    priorityId: "polity-legal-ethics",
    formatRuleId: "scenario-caselet",
    title: "BNSS procedure caselet pack",
    instruction: "Write short administrative scenarios testing arrest, investigation, rights, victim process and procedural safeguards.",
    matchedGap: "Covers the legal-current and GS-1 caselet weakness from 2026.",
    expectedOutput: "30 scenario questions with act-section proof and explanation.",
    difficulty: "Applied",
    minutes: 60,
    route: "/upsc/polity-governance",
  },
  {
    id: "polity-rpwd-ar",
    priorityId: "polity-legal-ethics",
    formatRuleId: "assertion-reason",
    title: "RPwD rights assertion-reason drill",
    instruction: "Frame assertion-reason questions on disability rights, reasonable accommodation, reservation and accessibility duties.",
    matchedGap: "Builds legal understanding beyond recall of act names.",
    expectedOutput: "20 assertion-reason questions with rights-vs-duty explanation.",
    difficulty: "Exam Trap",
    minutes: 35,
    route: "/upsc/mcq-command?subject=polity-governance&day=1",
  },
  {
    id: "env-framework-counter",
    priorityId: "environment-current",
    formatRuleId: "how-many-correct",
    title: "Climate framework count drill",
    instruction: "Count correct statements on LT-LEDS, REDD+, Blue Transformation, NDCs, CBD and FAO terms.",
    matchedGap: "Bridges strong environment basics with current framework language.",
    expectedOutput: "30 how-many-correct questions with report and convention tags.",
    difficulty: "Applied",
    minutes: 45,
    route: "/upsc/environment",
  },
  {
    id: "env-species-policy-exception",
    priorityId: "environment-current",
    formatRuleId: "not-exception",
    title: "Species-policy exception set",
    instruction: "Ask which species, habitat, protection status or scheme linkage is not correctly matched.",
    matchedGap: "Combines the already strong species layer with policy traps.",
    expectedOutput: "25 NOT/exception questions with map and scheme anchors.",
    difficulty: "Exam Trap",
    minutes: 40,
    route: "/upsc/mcq-command?subject=environment&day=1",
  },
  {
    id: "geo-places-match",
    priorityId: "geography-international",
    formatRuleId: "match-pair",
    title: "Places-in-news match radar",
    instruction: "Match straits, ports, lakes, geoparks, corridors and border regions with country, sea, resource or event.",
    matchedGap: "Repairs weak international map and places-in-news coverage.",
    expectedOutput: "40 match-pair questions using atlas and current-affairs clues.",
    difficulty: "Exam Trap",
    minutes: 55,
    route: "/upsc/geography",
  },
  {
    id: "geo-route-multi",
    priorityId: "geography-international",
    formatRuleId: "multi-statement",
    title: "Strategic route multi-statement pack",
    instruction: "Build statements on sea routes, chokepoints, corridors, mineral belts and climate-linked geography.",
    matchedGap: "Turns map facts into concept-plus-location UPSC questions.",
    expectedOutput: "30 multi-statement questions with one route/order trap.",
    difficulty: "Applied",
    minutes: 45,
    route: "/upsc/mcq-command?subject=geography&day=1",
  },
  {
    id: "ancient-tn-counter",
    priorityId: "ancient-tn-board",
    formatRuleId: "how-many-correct",
    title: "TN Board Ancient source counter",
    instruction: "Count correct statements on Sangam, Tamilakam, Vedic society, texts, archaeology and chronology.",
    matchedGap: "Preserves the 2026 History strength while adding deeper source precision.",
    expectedOutput: "30 how-many-correct questions with source-led explanation.",
    difficulty: "Exam Trap",
    minutes: 50,
    route: "/upsc/history",
  },
  {
    id: "ancient-source-match",
    priorityId: "ancient-tn-board",
    formatRuleId: "match-pair",
    title: "Text, term and archaeology match set",
    instruction: "Match ancient texts, terms, sites, authors and cultural features with close chronological distractors.",
    matchedGap: "Converts deep facts into pair traps instead of plain recall.",
    expectedOutput: "25 match-pair questions proof-locked to source tags.",
    difficulty: "Foundation",
    minutes: 35,
    route: "/upsc/mcq-command?subject=history&day=1",
  },
  {
    id: "eco-treds-multi",
    priorityId: "economy-maintenance",
    formatRuleId: "multi-statement",
    title: "TReDS and MSME finance maintenance set",
    instruction: "Create statements on M1xchange, invoice discounting, buyers, sellers, financiers and RBI framework.",
    matchedGap: "Keeps Economy as a strength while patching the named PDF gaps.",
    expectedOutput: "20 multi-statement maintenance questions with regulator proof.",
    difficulty: "Foundation",
    minutes: 30,
    route: "/upsc/economy",
  },
  {
    id: "eco-bond-exception",
    priorityId: "economy-maintenance",
    formatRuleId: "not-exception",
    title: "Bond taxonomy and insurance exception drill",
    instruction: "Ask incorrect statements on green/social/sustainability bonds, crowdfunding and IRDAI structure.",
    matchedGap: "Targets residual Economy misses without disturbing the core module.",
    expectedOutput: "20 NOT/exception questions with financial-term traps.",
    difficulty: "Exam Trap",
    minutes: 35,
    route: "/upsc/mcq-command?subject=economy&day=1",
  },
  {
    id: "medieval-maintenance-match",
    priorityId: "medieval-reduction",
    formatRuleId: "match-pair",
    title: "Medieval essentials maintenance match",
    instruction: "Match dynasties, art forms, administration terms and Bhakti-Sufi figures with minimum viable coverage.",
    matchedGap: "Keeps Medieval alive without expanding a zero-question 2026 area.",
    expectedOutput: "20 match-pair revision questions for maintenance only.",
    difficulty: "Foundation",
    minutes: 25,
    route: "/upsc/history",
  },
  {
    id: "medieval-revision-multi",
    priorityId: "medieval-reduction",
    formatRuleId: "multi-statement",
    title: "Medieval revision-only statement drill",
    instruction: "Build concise multi-statement questions from high-yield medieval essentials already taught.",
    matchedGap: "Protects student confidence while reallocating build time to IR and S&T.",
    expectedOutput: "15 multi-statement questions released only in revision lane.",
    difficulty: "Foundation",
    minutes: 20,
    route: "/upsc/revision-command",
  },
];

export const strategyExecutionTasks: StrategyExecutionTask[] = [
  {
    id: "ir-source-matrix",
    priorityId: "ir-multilateral",
    phase: "Source",
    title: "Create multilateral body source matrix",
    output: "ASEAN, BIMSTEC, UN, G20, SCO, QUAD, trade bodies and conventions mapped with members, charter, summit, India role.",
    ownerSurface: "Content Command",
    route: "/upsc/content-command?subject=internal-security-society&day=1",
  },
  {
    id: "ir-static-current-bridge",
    priorityId: "ir-multilateral",
    phase: "Capsule",
    title: "Build IR static-current bridge notes",
    output: "Every body gets static concept, current event, likely UPSC trap and India linkage.",
    ownerSurface: "Current Affairs Bridge",
    route: "/upsc/current-affairs",
  },
  {
    id: "ir-mcq-bank",
    priorityId: "ir-multilateral",
    phase: "MCQ",
    title: "Draft 80 IR UPSC-format MCQs",
    output: "Multi-statement, match-pair and how-many-correct questions for bodies, conventions and summits.",
    ownerSurface: "MCQ Command",
    route: "/upsc/mcq-command?subject=internal-security-society&day=1",
  },
  {
    id: "ir-proof-release",
    priorityId: "ir-multilateral",
    phase: "Proof",
    title: "Proof-lock accepted IR claims",
    output: "Exact official source links retained before the IR advantage is shown publicly.",
    ownerSurface: "Evidence Ledger",
    route: "/upsc/prelims-2026-showcase",
  },
  {
    id: "st-domain-capsules",
    priorityId: "science-new-domains",
    phase: "Capsule",
    title: "Create six new-domain S&T capsules",
    output: "AI/LLM, blockchain, quantum, semiconductor, defence tech and space-policy capsules.",
    ownerSurface: "Science Tech Command",
    route: "/upsc/science-tech",
  },
  {
    id: "st-current-source-tags",
    priorityId: "science-new-domains",
    phase: "Source",
    title: "Attach official current-source tags",
    output: "PIB, ISRO, DRDO, MeitY, DST and ministry source links attached to each capsule.",
    ownerSurface: "Source Library",
    route: "/upsc/source-library",
  },
  {
    id: "st-applied-mcq-bank",
    priorityId: "science-new-domains",
    phase: "MCQ",
    title: "Draft 100 applied S&T questions",
    output: "Application, limitation, governance and risk-comparison questions across new domains.",
    ownerSurface: "MCQ Command",
    route: "/upsc/mcq-command?subject=science-tech&day=1",
  },
  {
    id: "st-student-release",
    priorityId: "science-new-domains",
    phase: "Release",
    title: "Release S&T new-domain practice route",
    output: "Practice engine can assign weak domains by student readiness and format type.",
    ownerSurface: "Question Bank",
    route: "/upsc/question-bank",
  },
  {
    id: "polity-act-text-pack",
    priorityId: "polity-legal-ethics",
    phase: "Source",
    title: "Build BNSS and RPwD act-text pack",
    output: "Definitions, powers, procedure, rights and common wrong statements extracted.",
    ownerSurface: "Polity Command",
    route: "/upsc/polity-governance",
  },
  {
    id: "polity-caselet-bank",
    priorityId: "polity-legal-ethics",
    phase: "MCQ",
    title: "Draft 40 ethics-governance caselets",
    output: "District, rights, accountability and discretion caselets in GS-1 style.",
    ownerSurface: "MCQ Command",
    route: "/upsc/mcq-command?subject=polity-governance&day=1",
  },
  {
    id: "polity-simulator-tags",
    priorityId: "polity-legal-ethics",
    phase: "Planner",
    title: "Add legal-ethics simulator tags",
    output: "Readiness simulator marks students exposed when legal current or caselet practice is missing.",
    ownerSurface: "2027 Strategy Command",
    route: "/upsc/prelims-2027-strategy#simulator",
  },
  {
    id: "polity-proof-lock",
    priorityId: "polity-legal-ethics",
    phase: "Proof",
    title: "Proof-lock act text and caselet explanations",
    output: "Each legal-current question keeps source act, section and teacher explanation.",
    ownerSurface: "Evidence Ledger",
    route: "/upsc/prelims-2026-showcase",
  },
  {
    id: "env-framework-pack",
    priorityId: "environment-current",
    phase: "Capsule",
    title: "Build climate-framework pack",
    output: "LT-LEDS, REDD+, Blue Transformation, NDC, FAO and CBD language tagged.",
    ownerSurface: "Environment Command",
    route: "/upsc/environment",
  },
  {
    id: "env-species-policy-crosswalk",
    priorityId: "environment-current",
    phase: "Source",
    title: "Create species-policy crosswalk",
    output: "Species, protected areas, schemes, reports and habitat maps connected.",
    ownerSurface: "Content Command",
    route: "/upsc/content-command?subject=environment&day=1",
  },
  {
    id: "env-current-mcq",
    priorityId: "environment-current",
    phase: "MCQ",
    title: "Draft 50 current-environment questions",
    output: "Policy language, reports and species questions mixed into UPSC statement logic.",
    ownerSurface: "MCQ Command",
    route: "/upsc/mcq-command?subject=environment&day=1",
  },
  {
    id: "env-monthly-bridge",
    priorityId: "environment-current",
    phase: "Release",
    title: "Release monthly environment bridge",
    output: "Monthly current notes shift from raw news to syllabus-linked practice triggers.",
    ownerSurface: "Current Affairs Bridge",
    route: "/upsc/current-affairs",
  },
  {
    id: "geo-map-radar",
    priorityId: "geography-international",
    phase: "Capsule",
    title: "Build international map radar",
    output: "Straits, lakes, ports, geoparks, corridors, borders and strategic routes listed.",
    ownerSurface: "Geography Command",
    route: "/upsc/geography",
  },
  {
    id: "geo-atlas-drills",
    priorityId: "geography-international",
    phase: "Release",
    title: "Add atlas drill route",
    output: "Students practice map recall and clue-based location under timed format.",
    ownerSurface: "Geography Track",
    route: "/upsc/geography/track",
  },
  {
    id: "geo-map-mcq-bank",
    priorityId: "geography-international",
    phase: "MCQ",
    title: "Draft 60 map intelligence MCQs",
    output: "Location, route, resource and physical-geography links in match-pair and direct-map frames.",
    ownerSurface: "MCQ Command",
    route: "/upsc/mcq-command?subject=geography&day=1",
  },
  {
    id: "geo-current-updater",
    priorityId: "geography-international",
    phase: "Planner",
    title: "Schedule monthly places-in-news update",
    output: "Map radar refresh becomes a monthly current-affairs routine.",
    ownerSurface: "Yearly Planner",
    route: "/upsc/yearly-planner",
  },
  {
    id: "geo-map-proof-lock",
    priorityId: "geography-international",
    phase: "Proof",
    title: "Proof-lock international map clues",
    output: "Each strait, lake, port, geopark and corridor keeps atlas/source proof plus the current event clue.",
    ownerSurface: "Evidence Ledger",
    route: "/upsc/geography",
  },
  {
    id: "ancient-tn-source-pack",
    priorityId: "ancient-tn-board",
    phase: "Source",
    title: "Add TN Board source pack",
    output: "Sangam, Tamilakam, Vedic and deep text references captured with source tags.",
    ownerSurface: "History Command",
    route: "/upsc/history",
  },
  {
    id: "ancient-deep-fact-ledger",
    priorityId: "ancient-tn-board",
    phase: "Proof",
    title: "Create deep-source fact ledger",
    output: "Terms, texts, chronology and archaeology facts are proof-locked before public use.",
    ownerSurface: "Evidence Ledger",
    route: "/upsc/prelims-2026-showcase",
  },
  {
    id: "ancient-multi-statement",
    priorityId: "ancient-tn-board",
    phase: "MCQ",
    title: "Convert Ancient facts into statement traps",
    output: "Deep-source facts become multi-statement and how-many-correct practice.",
    ownerSurface: "MCQ Command",
    route: "/upsc/mcq-command?subject=history&day=1",
  },
  {
    id: "ancient-revision-route",
    priorityId: "ancient-tn-board",
    phase: "Release",
    title: "Release Ancient revision route",
    output: "Students revisit source-depth facts using spaced recall and MCQ traps.",
    ownerSurface: "Revision Command",
    route: "/upsc/revision-command",
  },
  {
    id: "eco-treds-patch",
    priorityId: "economy-maintenance",
    phase: "Capsule",
    title: "Patch TReDS and M1xchange",
    output: "Invoice discounting, MSME finance, platform actors and regulator details covered.",
    ownerSurface: "Economy Command",
    route: "/upsc/economy",
  },
  {
    id: "eco-bond-taxonomy",
    priorityId: "economy-maintenance",
    phase: "Capsule",
    title: "Patch bond taxonomy and crowdfunding",
    output: "Green, social, sustainability bonds plus crowdfunding regulation become explicit.",
    ownerSurface: "Economy Command",
    route: "/upsc/economy",
  },
  {
    id: "eco-irdai-pack",
    priorityId: "economy-maintenance",
    phase: "Source",
    title: "Add IRDAI and insurance structure",
    output: "Insurance regulator, categories, schemes and traps are covered together.",
    ownerSurface: "Content Command",
    route: "/upsc/content-command?subject=economy&day=1",
  },
  {
    id: "eco-regulator-proof-lock",
    priorityId: "economy-maintenance",
    phase: "Proof",
    title: "Proof-lock residual Economy patches",
    output: "TReDS, M1xchange, bond taxonomy, crowdfunding and IRDAI rows keep regulator/source proof before public use.",
    ownerSurface: "Evidence Ledger",
    route: "/upsc/economy",
  },
  {
    id: "eco-maintenance-test",
    priorityId: "economy-maintenance",
    phase: "MCQ",
    title: "Create Economy maintenance mini-test",
    output: "Only the PDF's remaining Economy gaps are tested; core module stays unchanged.",
    ownerSurface: "MCQ Command",
    route: "/upsc/mcq-command?subject=economy&day=1",
  },
  {
    id: "medieval-effort-cap",
    priorityId: "medieval-reduction",
    phase: "Planner",
    title: "Cap Medieval effort in yearly planner",
    output: "Medieval receives maintenance time, not expansion time.",
    ownerSurface: "Yearly Planner",
    route: "/upsc/yearly-planner",
  },
  {
    id: "medieval-maintenance-sheet",
    priorityId: "medieval-reduction",
    phase: "Source",
    title: "Create Medieval maintenance sheet",
    output: "Essential chronology, art, administration and Bhakti-Sufi anchors preserved.",
    ownerSurface: "History Command",
    route: "/upsc/history",
  },
  {
    id: "medieval-reallocate-hours",
    priorityId: "medieval-reduction",
    phase: "Planner",
    title: "Reallocate saved hours to critical gaps",
    output: "IR and S&T receive the hours released from Medieval expansion.",
    ownerSurface: "2027 Strategy Command",
    route: "/upsc/prelims-2027-strategy",
  },
  {
    id: "medieval-revision-only",
    priorityId: "medieval-reduction",
    phase: "Release",
    title: "Keep Medieval in revision-only lane",
    output: "Students revise high-yield essentials without crowding out critical 2027 gaps.",
    ownerSurface: "Revision Command",
    route: "/upsc/revision-command",
  },
];
