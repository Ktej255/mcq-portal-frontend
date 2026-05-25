import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectWatchScene } from "@/lib/upsc/subjectLearning";

export type ScienceTechLearningPack = {
  lens: string;
  teacherFocus: string;
  caseAnchors: string[];
  causeChain: string[];
  oralChecklist: string[];
  trapBank: string[];
  keywords: string[];
  mcqAngles: string[];
};

export type ScienceTechLabDeckCard = {
  id: string;
  title: string;
  category: string;
  anchor: string;
  detail: string;
  examTrap: string;
  proofHint: string;
};

const packByLab: Record<string, ScienceTechLearningPack> = {
  "Science System Board": {
    lens: "Science-to-society governance frame",
    teacherFocus:
      "Teach Science and Tech through principle, tool, institution, application, risk, regulation, and social impact.",
    caseAnchors: ["Scientific method to policy chain", "DST-DBT-CSIR-ICMR mission map", "IPR and standards gate", "Ethics and access trade-off"],
    causeChain: ["Principle", "Technology", "Institution", "Application", "Risk", "Policy", "Outcome"],
    oralChecklist: ["State the principle", "Name the institution", "Show the application", "Add risk, ethics, or access"],
    trapBank: [
      "Memorizing inventions without explaining principle, institution, application, and risk.",
      "Treating innovation as automatically beneficial without regulation, safety, and access questions.",
      "Mixing patents, standards, technology transfer, and public funding logic.",
    ],
    keywords: ["principle", "technology", "institution", "innovation", "policy", "ethics", "application", "risk", "standards", "ipr"],
    mcqAngles: ["principle-application-institution chain", "innovation access trade-off", "IPR versus standards distinction"],
  },
  "Space Mission Control": {
    lens: "Orbit-payload-application mission logic",
    teacherFocus:
      "Make space questions move through orbit, launch vehicle, payload, mission objective, scientific value, public application, and strategy.",
    caseAnchors: ["Remote sensing for disaster and agriculture", "NavIC positioning use case", "Chandrayaan science objective", "Gaganyaan human-spaceflight chain"],
    causeChain: ["Orbit", "Launch vehicle", "Payload", "Mission objective", "Data product", "Application", "Strategy"],
    oralChecklist: ["Identify the orbit", "Explain payload purpose", "Connect mission to application", "Add one strategic value"],
    trapBank: [
      "Remembering mission names without objective, payload, orbit, or use case.",
      "Confusing communication, navigation, earth observation, and scientific missions.",
      "Calling every satellite application remote sensing without checking payload and orbit.",
    ],
    keywords: ["orbit", "payload", "launch", "satellite", "remote", "sensing", "navigation", "isro", "mission", "application"],
    mcqAngles: ["orbit-payload match", "remote sensing versus navigation", "mission objective trap"],
  },
  "Digital AI Lab": {
    lens: "Data-to-decision digital governance frame",
    teacherFocus:
      "Read digital, AI, cyber, IoT, robotics, and cloud through data, model, infrastructure, security, audit, rights, and service delivery.",
    caseAnchors: ["AI lifecycle audit", "Digital public infrastructure service flow", "Cyber incident response chain", "IoT sensor-to-action loop"],
    causeChain: ["Data", "Model or system", "Infrastructure", "Decision", "Security", "Governance", "Impact"],
    oralChecklist: ["Name the data", "Explain the model or system", "Add audit/security", "State one citizen or economy impact"],
    trapBank: [
      "Treating AI as magic instead of data, model, training, validation, deployment, and audit.",
      "Discussing cybersecurity only as hacking while ignoring critical infrastructure and institutional response.",
      "Ignoring privacy, bias, explainability, and accountability in digital governance.",
    ],
    keywords: ["data", "algorithm", "model", "cloud", "edge", "cyber", "privacy", "bias", "audit", "infrastructure"],
    mcqAngles: ["AI lifecycle sequence", "privacy-bias-audit safeguards", "cyber threat-response chain"],
  },
  "Biotech Health Lab": {
    lens: "Molecule-to-public-health biotech frame",
    teacherFocus:
      "Connect biotech and health technology from molecule to tool, platform, diagnosis, surveillance, delivery, ethics, and regulation.",
    caseAnchors: ["PCR and sequencing workflow", "Vaccine platform comparison", "AMR surveillance chain", "Gene editing ethics board"],
    causeChain: ["Molecule", "Tool", "Platform", "Application", "Delivery", "Ethics", "Regulation"],
    oralChecklist: ["Name the biological unit", "Explain the tool", "Attach health/agriculture use", "Add biosafety or equity"],
    trapBank: [
      "Mixing PCR, sequencing, recombinant DNA, and CRISPR as if they do the same job.",
      "Comparing vaccine platforms without mechanism, delivery, and public trust.",
      "Ignoring biosafety, trial ethics, surveillance, and equitable access.",
    ],
    keywords: ["dna", "rna", "gene", "pcr", "sequencing", "crispr", "vaccine", "diagnostic", "amr", "biosafety"],
    mcqAngles: ["tool-function matching", "vaccine platform distinction", "biosafety and ethics trap"],
  },
  "Energy Climate Tech": {
    lens: "Technology-energy-climate transition frame",
    teacherFocus:
      "Force energy and climate technology answers through mechanism, storage, grid, emissions, cost, finance, safety, and deployment limits.",
    caseAnchors: ["Green hydrogen chain", "Battery-storage grid problem", "Carbon capture limitation", "Nuclear safety and application map"],
    causeChain: ["Generation", "Storage", "Transmission", "Use case", "Emission effect", "Cost", "Policy"],
    oralChecklist: ["Explain the mechanism", "Name storage or grid issue", "State emission effect", "Add cost, safety, or finance limit"],
    trapBank: [
      "Calling a technology clean without checking lifecycle, storage, grid, and cost constraints.",
      "Mixing mitigation, adaptation, measurement, and monitoring technologies.",
      "Discussing nuclear only as energy while ignoring medicine, agriculture, safety, and fuel cycle.",
    ],
    keywords: ["solar", "wind", "hydrogen", "battery", "grid", "nuclear", "carbon", "capture", "emissions", "storage"],
    mcqAngles: ["generation-storage-grid sequence", "mitigation versus monitoring", "nuclear fuel-cycle trap"],
  },
  "Defence Security Tech": {
    lens: "Sensor-platform-command security grid",
    teacherFocus:
      "Teach defence technology through domain, sensor, platform, propulsion or guidance, command chain, indigenization, cyber-space link, and ethics.",
    caseAnchors: ["Missile guidance chain", "Drone ISR and counter-drone loop", "Radar-satellite sensor grid", "DRDO-private sector indigenization"],
    causeChain: ["Domain", "Sensor", "Platform", "Weapon or tool", "Command", "Indigenization", "Ethics"],
    oralChecklist: ["Name the domain", "Identify sensor/platform", "Explain use case", "Add security, autonomy, or escalation risk"],
    trapBank: [
      "Memorizing system names without range, guidance, payload, domain, or role.",
      "Ignoring cyber-space integration in modern defence technology.",
      "Treating indigenization as only production while missing testing, procurement, and ecosystem capacity.",
    ],
    keywords: ["missile", "drone", "radar", "satellite", "cyber", "space", "guidance", "payload", "indigenization", "autonomy"],
    mcqAngles: ["sensor-platform-domain match", "autonomy ethics trap", "indigenization ecosystem chain"],
  },
  "Innovation Current Affairs": {
    lens: "News-to-static science conversion frame",
    teacherFocus:
      "Convert science news into stable UPSC value by linking concept, institution, mission, application, risk, regulation, and MCQ trap.",
    caseAnchors: ["Mission news filter", "Startup-to-innovation ecosystem", "Regulation and standards update", "Award or discovery to static concept"],
    causeChain: ["News trigger", "Static concept", "Institution", "Application", "Risk", "Regulation", "Question hook"],
    oralChecklist: ["Name the concept", "Name institution or mission", "Attach application", "Predict prelims and mains angle"],
    trapBank: [
      "Memorizing science news without converting it into static principle and application.",
      "Missing institution, regulator, standard, or mission behind the update.",
      "Writing current affairs without risk, ethics, and governance implications.",
    ],
    keywords: ["news", "mission", "institution", "startup", "standard", "regulation", "application", "risk", "current", "concept"],
    mcqAngles: ["news-to-static conversion", "institution-mission matching", "regulation-risk hook"],
  },
};

const labDecks: Record<string, Omit<ScienceTechLabDeckCard, "id">[]> = {
  "science-system-board": [
    {
      title: "Principle To Policy Chain",
      category: "Science Governance",
      anchor: "Principle, evidence, institution, funding, regulation, outcome",
      detail:
        "Use one technology to show how scientific evidence moves into mission design, policy support, adoption, and public impact.",
      examTrap: "A technology fact is weak unless the principle, institution, application, and risk are connected.",
      proofHint: "Write one chain from scientific principle to policy outcome.",
    },
    {
      title: "Innovation Access Gate",
      category: "Ethics and IPR",
      anchor: "IPR, standards, safety, affordability, public access",
      detail:
        "Compare innovation protection with affordability, public funding, standards, safety, and technology transfer.",
      examTrap: "Innovation protection and public access are not enemies; UPSC tests their balance.",
      proofHint: "Give one benefit and one access risk of protecting innovation.",
    },
  ],
  "space-mission-control": [
    {
      title: "Orbit Payload Matcher",
      category: "Space Basics",
      anchor: "Orbit, payload, mission objective, data product",
      detail:
        "Match orbit and payload to communication, navigation, earth observation, and scientific mission needs.",
      examTrap: "Mission name alone does not reveal orbit, payload, or application.",
      proofHint: "Connect one orbit to one payload and one public application.",
    },
    {
      title: "Remote Sensing Use Case",
      category: "Application",
      anchor: "Sensor, image, map layer, agriculture, disaster, weather",
      detail:
        "Use remote sensing as a data-to-decision chain for crops, floods, forests, coasts, or urban planning.",
      examTrap: "Remote sensing and navigation are different satellite application families.",
      proofHint: "Explain how satellite data becomes one governance decision.",
    },
  ],
  "digital-ai-lab": [
    {
      title: "AI Lifecycle Audit",
      category: "AI Governance",
      anchor: "Data, training, validation, deployment, bias, audit",
      detail:
        "Trace AI from data collection to model training, testing, deployment, monitoring, and accountability.",
      examTrap: "AI risks cannot be solved after deployment alone; data quality and validation matter earlier.",
      proofHint: "Name two safeguards before deployment and one after deployment.",
    },
    {
      title: "Cyber Incident Chain",
      category: "Cybersecurity",
      anchor: "Threat, vulnerability, critical infrastructure, CERT-In, recovery",
      detail:
        "Convert a cyber incident into threat, affected system, institutional response, legal/privacy issue, and resilience lesson.",
      examTrap: "Cybersecurity is not only technical defence; it includes rights, continuity, and institutional readiness.",
      proofHint: "Trace one ransomware incident from detection to recovery.",
    },
  ],
  "biotech-health-lab": [
    {
      title: "PCR Sequencing CRISPR Sorter",
      category: "Biotech Tools",
      anchor: "Amplify, read, edit, express",
      detail:
        "Separate what PCR, sequencing, recombinant DNA, and CRISPR do before attaching applications.",
      examTrap: "UPSC can test tool-function mismatch more than definition memory.",
      proofHint: "Give one use case each for PCR, sequencing, and CRISPR.",
    },
    {
      title: "Vaccine Platform Comparator",
      category: "Public Health",
      anchor: "Platform, immune response, delivery, cold chain, public trust",
      detail:
        "Compare vaccine platforms through mechanism, manufacturing, delivery, safety monitoring, and equity.",
      examTrap: "Technology success depends on surveillance, delivery systems, and public trust.",
      proofHint: "Compare two vaccine platforms using mechanism and delivery constraint.",
    },
  ],
  "energy-climate-tech": [
    {
      title: "Hydrogen Value Chain",
      category: "Energy Transition",
      anchor: "Production, storage, transport, end use, cost, safety",
      detail:
        "Read green hydrogen through electrolyser, renewable power, storage, transport, industrial use, and safety.",
      examTrap: "Hydrogen is not automatically green; source of energy and lifecycle matter.",
      proofHint: "Write one green hydrogen chain from generation to end use.",
    },
    {
      title: "Battery Grid Constraint",
      category: "Storage",
      anchor: "Intermittency, storage, smart grid, minerals, recycling",
      detail:
        "Connect renewable energy with intermittency, storage needs, mineral supply, grid flexibility, and recycling.",
      examTrap: "Renewable generation is not enough without storage, transmission, and demand response.",
      proofHint: "Name one technical and one policy constraint in storage expansion.",
    },
  ],
  "defence-security-tech": [
    {
      title: "Missile Guidance Grid",
      category: "Strategic Technology",
      anchor: "Range, propulsion, guidance, payload, mission role",
      detail:
        "Read missile systems through range, propulsion, guidance, payload, launch platform, and strategic role.",
      examTrap: "Range, guidance, propulsion, and payload are separate dimensions.",
      proofHint: "Build one missile fact into domain, range, guidance, and role.",
    },
    {
      title: "Drone ISR Counter-Drone Loop",
      category: "Autonomy",
      anchor: "Surveillance, autonomy, communication, countermeasure, ethics",
      detail:
        "Connect drones with ISR, strike, logistics, swarm risks, counter-drone tools, and accountability.",
      examTrap: "Autonomy raises command, accountability, escalation, and civilian-risk questions.",
      proofHint: "Give one use case and one ethical or security risk.",
    },
  ],
  "innovation-current-affairs": [
    {
      title: "News To Static Converter",
      category: "Current Affairs",
      anchor: "Concept, institution, application, risk, MCQ trap",
      detail:
        "Convert any science news item into a stable note by naming the concept, institution, application, limitation, and statement trap.",
      examTrap: "News without static concept and institution becomes poor revision material.",
      proofHint: "Turn one mission or regulation update into concept, actor, application, and trap.",
    },
    {
      title: "Regulation Risk Board",
      category: "Governance",
      anchor: "Standards, safety, privacy, ethics, market adoption",
      detail:
        "Use regulation as a decision board that balances innovation, safety, access, rights, and industrial competitiveness.",
      examTrap: "Regulation is not only restriction; it can create trust and adoption.",
      proofHint: "Name one technology where standards improve adoption.",
    },
  ],
};

function fallbackPack(session: SubjectSession): ScienceTechLearningPack {
  return {
    lens: session.lab,
    teacherFocus: `Teach ${session.title} through principle, application, institution, risk, and governance.`,
    caseAnchors: [session.chapter, session.lab, "India mission example", "Technology governance example"],
    causeChain: ["Principle", "Tool", "Application", "Institution", "Risk", "Policy", "Trap"],
    oralChecklist: ["Explain the principle", "Attach application", "Name institution", "Add risk or ethics"],
    trapBank: ["Moving to MCQs without connecting principle, application, institution, and risk."],
    keywords: [session.title, session.chapter, session.lab, "science", "technology", "application", "risk", "institution"]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
    mcqAngles: ["principle-application distinction", "institution role trap", "risk-governance balance"],
  };
}

export function getScienceTechLearningPack(session: SubjectSession): ScienceTechLearningPack {
  return packByLab[session.lab] ?? fallbackPack(session);
}

export function buildScienceTechWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const pack = getScienceTechLearningPack(session);

  return [
    {
      id: `${session.day}-science-tech-briefing`,
      kind: "briefing",
      title: "Science frame",
      objective: pack.lens,
      narration: `${pack.teacherFocus} Today's anchor is ${session.anchor}.`,
      checkpoint: `Student can state why ${session.title} is an applied Science and Tech topic, not a fact list.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-science-tech-chain`,
      kind: "mechanism",
      title: "Principle-to-impact chain",
      objective: "Build the scientific relationship before memorizing names.",
      narration: `Use this chain: ${pack.causeChain.join(" -> ")}. Explain each link through ${session.title}.`,
      checkpoint: "Student can speak principle, application, institution, risk, and policy link.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-science-tech-case`,
      kind: "application",
      title: "Mission or application anchor",
      objective: "Attach the topic to a mission, institution, public use, sector, or current-affairs hook.",
      narration: `Choose one anchor: ${pack.caseAnchors.join(", ")}. The example must prove the technology-use logic.`,
      checkpoint: "Student can connect one case to application, institution, risk, or regulation.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-science-tech-trap`,
      kind: "trap",
      title: "UPSC technology trap",
      objective: "Predict tool-function, mission-application, and ethics traps.",
      narration: `Common trap: ${pack.trapBank[0] ?? "Memorizing without application."}`,
      checkpoint: "Student can create one almost-correct statement and identify the hidden technical or governance exception.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-science-tech-handoff`,
      kind: "handoff",
      title: "AI teacher handoff",
      objective: "Prepare the oral explanation.",
      narration: `In Talk room, cover: ${pack.oralChecklist.join(", ")}.`,
      checkpoint: "Student is ready to explain the topic through concept, application, institution, risk, and MCQ angle.",
      durationMinutes: 2,
    },
  ];
}

export function getScienceTechLabDeck(labSlug: string, session: SubjectSession): ScienceTechLabDeckCard[] {
  const deck = labDecks[labSlug];
  const fallback = [
    {
      title: `${session.title} Application Builder`,
      category: session.chapter,
      anchor: session.anchor,
      detail:
        "Attach principle, tool, institution, application, risk, regulation, and one UPSC statement trap.",
      examTrap: "Avoid moving to MCQs without one technical mechanism and one governance implication.",
      proofHint: "Convert the topic into principle, application, actor, risk, and MCQ trap.",
    },
  ];

  return (deck ?? fallback).map((card, index) => ({
    ...card,
    id: `${session.day}-${labSlug || "science-tech"}-${index + 1}`,
  }));
}

export function getScienceTechMcqTemplateHints(plan: SubjectSprintPlan, session: SubjectSession) {
  const pack = getScienceTechLearningPack(session);
  return {
    trapSeed: pack.trapBank[0] ?? `confusing principle, application, institution, and risk inside ${session.title}`,
    explanationSeed: `Use ${pack.causeChain.join(" -> ")} and name the technical limitation or governance safeguard.`,
    caseTag: pack.caseAnchors[0] ?? session.lab,
    source: "FRESH_SCIENCE_TECH_AUTHORING",
    questionSeed: `Consider the following statements about ${session.title}: build a fresh UPSC trap around ${pack.mcqAngles[0] ?? pack.trapBank[0]}.`,
    planTitle: plan.title,
  };
}
