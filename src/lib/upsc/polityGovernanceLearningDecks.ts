import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectWatchScene } from "@/lib/upsc/subjectLearning";

export type PolityGovernanceLearningPack = {
  lens: string;
  teacherFocus: string;
  caseAnchors: string[];
  causeChain: string[];
  oralChecklist: string[];
  trapBank: string[];
  keywords: string[];
  mcqAngles: string[];
};

export type PolityGovernanceLabDeckCard = {
  id: string;
  title: string;
  category: string;
  anchor: string;
  detail: string;
  examTrap: string;
  proofHint: string;
};

const packByLab: Record<string, PolityGovernanceLearningPack> = {
  "Constitution Map": {
    lens: "Constitutional balance frame",
    teacherFocus:
      "Teach Polity through principle, article, institution, limitation, remedy, doctrine, and governance effect.",
    caseAnchors: ["Preamble value chain", "Basic structure doctrine", "Article 1 to 4 Union logic", "Emergency safeguard comparison"],
    causeChain: ["Principle", "Article", "Institution", "Power", "Limitation", "Remedy", "Doctrine"],
    oralChecklist: ["State the principle", "Name the article", "Connect institution", "Add limitation or remedy"],
    trapBank: [
      "Memorizing articles without explaining the constitutional principle and institutional effect.",
      "Treating constitutional power as unlimited without safeguards, review, or federal balance.",
      "Mixing amendment, ordinary law, executive order, and judicial doctrine.",
    ],
    keywords: ["constitution", "article", "preamble", "principle", "doctrine", "amendment", "federal", "emergency", "safeguard", "remedy"],
    mcqAngles: ["article-principle matching", "basic-structure limitation", "emergency safeguard trap"],
  },
  "Rights Justice Lab": {
    lens: "Right-scope-restriction-remedy frame",
    teacherFocus:
      "Make rights answers move through article, scope, state action, restriction, judicial interpretation, remedy, and social impact.",
    caseAnchors: ["Article 12 state definition", "Article 19 reasonable restrictions", "Article 21 expansion", "Article 32 and writ remedies"],
    causeChain: ["Right", "Scope", "State action", "Restriction", "Judicial test", "Remedy", "Impact"],
    oralChecklist: ["Name the right", "Define scope", "State restriction", "Add remedy or case logic"],
    trapBank: [
      "Calling Fundamental Rights absolute without reasonable restrictions and public interest tests.",
      "Mixing Article 32 and Article 226 scope and forum.",
      "Discussing social justice without enforceability, institution, and delivery capacity.",
    ],
    keywords: ["rights", "article", "state", "restriction", "writ", "remedy", "judicial", "review", "dpsp", "justice"],
    mcqAngles: ["absolute-right trap", "Article 32 versus 226", "FR-DPSP enforceability distinction"],
  },
  "Parliament Process Board": {
    lens: "Bill-budget-committee accountability frame",
    teacherFocus:
      "Read Parliament through representation, law-making, financial control, committee scrutiny, privileges, and executive accountability.",
    caseAnchors: ["Ordinary bill path", "Money bill certification", "Department-related standing committee", "Budget and cut motion control"],
    causeChain: ["Issue", "Bill", "House process", "Committee", "Vote", "Accountability", "Law or oversight"],
    oralChecklist: ["Name bill type", "Trace process", "Add committee or budget role", "State accountability value"],
    trapBank: [
      "Mixing ordinary bill, money bill, financial bill, and constitutional amendment routes.",
      "Ignoring committees while discussing parliamentary scrutiny.",
      "Treating privilege as personal privilege instead of institutional freedom for legislative work.",
    ],
    keywords: ["parliament", "bill", "money", "committee", "budget", "privilege", "lok", "rajya", "accountability", "motion"],
    mcqAngles: ["money-bill route trap", "committee scrutiny role", "privilege versus immunity"],
  },
  "Federalism Grid": {
    lens: "Legislative-administrative-fiscal federalism frame",
    teacherFocus:
      "Force federalism answers through constitutional list, administrative control, fiscal transfer, political practice, local bodies, and dispute resolution.",
    caseAnchors: ["Union-State-Concurrent list sorting", "Finance Commission transfer", "GST Council cooperative federalism", "73rd and 74th local bodies"],
    causeChain: ["Subject matter", "List", "Institution", "Fiscal flow", "Coordination", "Dispute", "Federal balance"],
    oralChecklist: ["Identify the axis", "Name list or institution", "Add fiscal/administrative angle", "State cooperative or conflict point"],
    trapBank: [
      "Calling India simply federal or unitary without context.",
      "Mixing Finance Commission, GST Council, Inter-State Council, and NITI Aayog roles.",
      "Discussing decentralization without finance, functions, and functionaries.",
    ],
    keywords: ["federalism", "union", "state", "concurrent", "finance", "gst", "council", "local", "panchayat", "municipality"],
    mcqAngles: ["list-residuary power trap", "Finance Commission versus GST Council", "3F decentralization"],
  },
  "Institution Grid": {
    lens: "Status-power-independence-accountability grid",
    teacherFocus:
      "Solve institution questions by status, appointment, tenure, removal, powers, independence, reports, and accountability route.",
    caseAnchors: ["President and Governor discretion", "CAG report chain", "ECI independence", "UPSC and Finance Commission status"],
    causeChain: ["Status", "Appointment", "Tenure", "Power", "Independence", "Accountability", "Exam trap"],
    oralChecklist: ["Name status", "Explain appointment/removal", "State powers", "Add independence or accountability"],
    trapBank: [
      "Mixing constitutional body, statutory body, regulator, executive office, and tribunal.",
      "Remembering body names without appointment, removal, function, and report route.",
      "Treating Governor discretion as ordinary political choice without constitutional limits.",
    ],
    keywords: ["institution", "constitutional", "statutory", "appointment", "removal", "tenure", "power", "independence", "cag", "eci"],
    mcqAngles: ["constitutional versus statutory body", "appointment-removal trap", "office discretion limit"],
  },
  "Election Democracy Lab": {
    lens: "Election integrity and democratic accountability frame",
    teacherFocus:
      "Read elections through ECI mandate, MCC, technology, parties, finance, anti-defection, representation, and reform.",
    caseAnchors: ["ECI superintendence power", "MCC enforcement limit", "EVM-VVPAT trust chain", "Anti-defection Speaker role"],
    causeChain: ["Representation", "Institution", "Rule", "Technology", "Finance", "Trust", "Reform"],
    oralChecklist: ["Name the election issue", "Connect ECI/rule", "Add technology or finance", "Close with reform"],
    trapBank: [
      "Treating MCC as a statute with the same enforceability as election law.",
      "Discussing EVM or VVPAT only technically without trust, transparency, and process.",
      "Mixing anti-defection disqualification, party discipline, and Speaker decision timelines.",
    ],
    keywords: ["election", "eci", "mcc", "evm", "vvpat", "party", "finance", "anti", "defection", "reform"],
    mcqAngles: ["MCC enforceability trap", "EVM-VVPAT process", "anti-defection exception"],
  },
  "Governance Delivery Board": {
    lens: "Policy-to-citizen delivery frame",
    teacherFocus:
      "Teach governance through problem definition, policy instrument, institution, capacity, technology, transparency, accountability, and outcome.",
    caseAnchors: ["RTI transparency chain", "Social audit accountability", "DBT delivery flow", "Citizen grievance redressal loop"],
    causeChain: ["Problem", "Policy", "Institution", "Implementation", "Transparency", "Accountability", "Outcome"],
    oralChecklist: ["Define the problem", "Name tool/institution", "Trace delivery", "Add accountability and outcome"],
    trapBank: [
      "Treating e-governance as only a portal instead of process redesign and accountability.",
      "Discussing DBT without exclusion, authentication, grievance, and last-mile issues.",
      "Using transparency, accountability, and participation as interchangeable words.",
    ],
    keywords: ["governance", "policy", "implementation", "rti", "audit", "dbt", "grievance", "accountability", "transparency", "delivery"],
    mcqAngles: ["RTI-social-audit distinction", "DBT exclusion trap", "policy-cycle sequence"],
  },
  "Polity Current Affairs": {
    lens: "News-to-article current affairs frame",
    teacherFocus:
      "Convert polity news into stable revision by linking article, institution, issue, judgment, doctrine, precedent, and reform.",
    caseAnchors: ["Judgment to doctrine filter", "Bill to constitutional issue", "Federal dispute map", "Body report to reform hook"],
    causeChain: ["News", "Article", "Institution", "Issue", "Doctrine", "Impact", "Reform"],
    oralChecklist: ["Name article/institution", "State issue", "Add judgment or precedent", "Predict reform and MCQ angle"],
    trapBank: [
      "Reading polity news as a headline without article, institution, issue, and doctrine.",
      "Mixing court observation, ratio, obiter, statute, bill, and constitutional amendment.",
      "Missing federal, rights, accountability, or representation angle in current affairs.",
    ],
    keywords: ["current", "judgment", "bill", "article", "institution", "federal", "rights", "doctrine", "precedent", "reform"],
    mcqAngles: ["news-to-article conversion", "judgment-doctrine trap", "bill versus amendment distinction"],
  },
};

const labDecks: Record<string, Omit<PolityGovernanceLabDeckCard, "id">[]> = {
  "constitution-map": [
    {
      title: "Preamble Value Chain",
      category: "Constitution Basics",
      anchor: "Justice, liberty, equality, fraternity, sovereignty",
      detail:
        "Use Preamble values to explain constitutionalism, rule of law, limited government, welfare orientation, and institutional balance.",
      examTrap: "Preamble is not a loose quote; it frames interpretation and constitutional objectives.",
      proofHint: "Connect one Preamble value to one article and one institution.",
    },
    {
      title: "Basic Structure Safeguard",
      category: "Doctrine",
      anchor: "Amendment power, limitation, judicial review, constitutional identity",
      detail:
        "Trace how amendment power is broad but not unlimited when basic constitutional identity is threatened.",
      examTrap: "Parliament can amend widely, but not destroy basic structure.",
      proofHint: "Write one line separating amendment power and basic-structure limitation.",
    },
  ],
  "rights-justice-lab": [
    {
      title: "Right Restriction Remedy Grid",
      category: "Fundamental Rights",
      anchor: "Article, scope, reasonable restriction, writ, judicial review",
      detail:
        "Map one right through its article, beneficiary, restriction, court test, and remedy route.",
      examTrap: "Fundamental Rights are enforceable, but not always absolute.",
      proofHint: "Use Article 19 or Article 21 to show scope, restriction, and remedy.",
    },
    {
      title: "Writ Use Case Sorter",
      category: "Judicial Remedies",
      anchor: "Habeas corpus, mandamus, certiorari, prohibition, quo warranto",
      detail:
        "Sort writs by who is protected, who is directed, what decision is reviewed, and what office is questioned.",
      examTrap: "Article 32 and Article 226 are not identical in scope and forum.",
      proofHint: "Give one use case for two writs and identify the proper court.",
    },
  ],
  "parliament-process-board": [
    {
      title: "Bill Route Comparator",
      category: "Legislature",
      anchor: "Ordinary bill, money bill, financial bill, amendment bill",
      detail:
        "Compare initiation, Rajya Sabha role, joint sitting, President assent, and special majority requirements.",
      examTrap: "Money bills and financial bills are not the same category.",
      proofHint: "Trace ordinary bill and money bill paths separately.",
    },
    {
      title: "Committee Scrutiny Engine",
      category: "Accountability",
      anchor: "Standing committees, reports, expertise, executive scrutiny",
      detail:
        "Explain why committee work strengthens accountability even when it is less visible than floor debate.",
      examTrap: "Parliamentary scrutiny is not limited to voting on the final bill.",
      proofHint: "Name two ways committees improve legislative quality.",
    },
  ],
  "federalism-grid": [
    {
      title: "Centre-State Relation Matrix",
      category: "Federalism",
      anchor: "Legislative, administrative, fiscal, political, local axes",
      detail:
        "Classify one issue across lists, administrative direction, finance, political negotiation, and local implementation.",
      examTrap: "Indian federalism changes character depending on context and institution.",
      proofHint: "Explain one issue through legislative and fiscal federalism together.",
    },
    {
      title: "Finance Commission GST Council Split",
      category: "Fiscal Federalism",
      anchor: "Tax devolution, grants, GST rates, cooperative decision-making",
      detail:
        "Separate constitutional finance transfers from GST Council tax coordination and political bargaining.",
      examTrap: "Finance Commission and GST Council do different fiscal jobs.",
      proofHint: "Write one role each for Finance Commission and GST Council.",
    },
  ],
  "institution-grid-polity": [
    {
      title: "Body Status Comparator",
      category: "Institutions",
      anchor: "Constitutional, statutory, executive, regulatory status",
      detail:
        "Compare CAG, ECI, UPSC, Finance Commission, NHRC, CIC, CVC, and regulators by source, powers, and independence.",
      examTrap: "A body doing public work is not automatically a constitutional body.",
      proofHint: "Sort four bodies by constitutional or statutory status.",
    },
    {
      title: "Governor Discretion Board",
      category: "Executive",
      anchor: "Aid and advice, discretion, crisis, floor test, federal balance",
      detail:
        "Read Governor questions through constitutional position, convention, political crisis, court guidance, and federal impact.",
      examTrap: "Discretion is not unlimited personal or party preference.",
      proofHint: "Explain one Governor crisis through power, limit, and remedy.",
    },
  ],
  "election-democracy-lab": [
    {
      title: "ECI Integrity Chain",
      category: "Election Governance",
      anchor: "Schedule, MCC, symbols, expenditure, polling, counting",
      detail:
        "Trace how election integrity depends on rule enforcement, logistics, neutrality, transparency, and voter trust.",
      examTrap: "Election management is not only polling day; it starts before notification and continues through counting.",
      proofHint: "Name three stages where ECI safeguards integrity.",
    },
    {
      title: "Anti-Defection Decision Tree",
      category: "Democracy Reform",
      anchor: "Tenth Schedule, whip, merger, Speaker, judicial review",
      detail:
        "Use the decision tree to separate defection, split/merger logic, Speaker role, and review concerns.",
      examTrap: "Anti-defection protects stability but can weaken deliberative independence.",
      proofHint: "Give one benefit and one democratic cost of anti-defection.",
    },
  ],
  "governance-delivery-board": [
    {
      title: "Policy Cycle To Citizen",
      category: "Governance",
      anchor: "Problem, design, implementation, monitoring, evaluation, feedback",
      detail:
        "Follow one scheme from problem diagnosis to delivery, monitoring, grievance, audit, and outcome measurement.",
      examTrap: "A good scheme design can fail through capacity, data, exclusion, and accountability gaps.",
      proofHint: "Trace one policy failure to one administrative fix.",
    },
    {
      title: "Transparency Accountability Tool Split",
      category: "Accountability",
      anchor: "RTI, social audit, citizen charter, grievance redressal",
      detail:
        "Separate information access, community verification, service standards, grievance handling, and sanctioning power.",
      examTrap: "Transparency is not the same as accountability unless action follows information.",
      proofHint: "Explain RTI and social audit as different accountability tools.",
    },
  ],
  "polity-current-affairs": [
    {
      title: "Judgment To Doctrine Converter",
      category: "Current Affairs",
      anchor: "Facts, issue, article, ratio, doctrine, impact",
      detail:
        "Turn a court judgment into a stable note by extracting the constitutional issue, article, principle, and consequence.",
      examTrap: "Every line in a judgment is not the binding ratio.",
      proofHint: "Convert one judgment into article, issue, doctrine, and exam trap.",
    },
    {
      title: "Bill To Constitutional Issue",
      category: "Legislation",
      anchor: "Bill objective, competence, rights impact, federal angle, safeguard",
      detail:
        "Read a bill through legislative competence, rights implications, institutional design, federal impact, and accountability safeguards.",
      examTrap: "A bill is not an amendment unless it changes the Constitution through the amendment procedure.",
      proofHint: "Separate policy objective from constitutional issue in one bill.",
    },
  ],
};

function fallbackPack(session: SubjectSession): PolityGovernanceLearningPack {
  return {
    lens: session.lab,
    teacherFocus: `Teach ${session.title} through article, institution, principle, limitation, remedy, and governance impact.`,
    caseAnchors: [session.chapter, session.lab, "Constitutional example", "Governance current-affairs hook"],
    causeChain: ["Principle", "Article", "Institution", "Power", "Limit", "Remedy", "Trap"],
    oralChecklist: ["Name article or principle", "Connect institution", "Explain limit", "Predict one trap"],
    trapBank: ["Moving to MCQs without connecting article, principle, institution, and remedy."],
    keywords: [session.title, session.chapter, session.lab, "article", "institution", "governance", "remedy"]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
    mcqAngles: ["article-institution trap", "power-limit distinction", "remedy-procedure match"],
  };
}

export function getPolityGovernanceLearningPack(session: SubjectSession): PolityGovernanceLearningPack {
  return packByLab[session.lab] ?? fallbackPack(session);
}

export function buildPolityGovernanceWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const pack = getPolityGovernanceLearningPack(session);

  return [
    {
      id: `${session.day}-polity-briefing`,
      kind: "briefing",
      title: "Constitution briefing",
      objective: pack.lens,
      narration: `${pack.teacherFocus} Today's anchor is ${session.anchor}.`,
      checkpoint: `Student can state why ${session.title} is a constitutional logic topic, not article memory only.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-polity-chain`,
      kind: "mechanism",
      title: "Article-to-governance chain",
      objective: "Build the constitutional relationship before memorizing facts.",
      narration: `Use this chain: ${pack.causeChain.join(" -> ")}. Explain each link through ${session.title}.`,
      checkpoint: "Student can speak principle, article, institution, limitation, and remedy.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-polity-case`,
      kind: "application",
      title: "Case or institution anchor",
      objective: "Attach the topic to an institution, judgment, article, body, bill, or governance tool.",
      narration: `Choose one anchor: ${pack.caseAnchors.join(", ")}. The example must prove the constitutional or governance logic.`,
      checkpoint: "Student can connect one case to article, institution, remedy, or accountability.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-polity-trap`,
      kind: "trap",
      title: "UPSC polity trap",
      objective: "Predict article, institution, enforceability, and procedure traps.",
      narration: `Common trap: ${pack.trapBank[0] ?? "Memorizing without constitutional logic."}`,
      checkpoint: "Student can create one almost-correct statement and identify the missing qualifier or procedure.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-polity-handoff`,
      kind: "handoff",
      title: "AI teacher handoff",
      objective: "Prepare the oral explanation.",
      narration: `In Talk room, cover: ${pack.oralChecklist.join(", ")}.`,
      checkpoint: "Student is ready to explain the topic through article, institution, principle, case, and trap.",
      durationMinutes: 2,
    },
  ];
}

export function getPolityGovernanceLabDeck(labSlug: string, session: SubjectSession): PolityGovernanceLabDeckCard[] {
  const deck = labDecks[labSlug];
  const fallback = [
    {
      title: `${session.title} Constitutional Builder`,
      category: session.chapter,
      anchor: session.anchor,
      detail:
        "Attach article, principle, institution, limitation, remedy, governance effect, and one UPSC trap.",
      examTrap: "Avoid moving to MCQs without one constitutional mechanism and one remedy or accountability hook.",
      proofHint: "Convert the topic into article, actor, power, limit, remedy, and trap.",
    },
  ];

  return (deck ?? fallback).map((card, index) => ({
    ...card,
    id: `${session.day}-${labSlug || "polity"}-${index + 1}`,
  }));
}

export function getPolityGovernanceMcqTemplateHints(plan: SubjectSprintPlan, session: SubjectSession) {
  const pack = getPolityGovernanceLearningPack(session);
  return {
    trapSeed: pack.trapBank[0] ?? `confusing article, institution, power, limitation, and remedy inside ${session.title}`,
    explanationSeed: `Use ${pack.causeChain.join(" -> ")} and name the article, institution, limitation, or remedy.`,
    caseTag: pack.caseAnchors[0] ?? session.lab,
    source: "FRESH_POLITY_GOVERNANCE_AUTHORING",
    questionSeed: `Consider the following statements about ${session.title}: build a fresh UPSC trap around ${pack.mcqAngles[0] ?? pack.trapBank[0]}.`,
    planTitle: plan.title,
  };
}
