import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectWatchScene } from "@/lib/upsc/subjectLearning";

export type InternalSecuritySocietyLearningPack = {
  lens: string;
  teacherFocus: string;
  caseAnchors: string[];
  causeChain: string[];
  oralChecklist: string[];
  trapBank: string[];
  keywords: string[];
  mcqAngles: string[];
};

export type InternalSecuritySocietyLabDeckCard = {
  id: string;
  title: string;
  category: string;
  anchor: string;
  detail: string;
  examTrap: string;
  proofHint: string;
};

const packByLab: Record<string, InternalSecuritySocietyLearningPack> = {
  "Security Framework": {
    lens: "Threat-vulnerability-institution-resilience frame",
    teacherFocus:
      "Teach security with threat, vulnerability, actor, institution, law, force, rights balance, community trust, and resilience.",
    caseAnchors: ["MHA-police-CAPF chain", "Intelligence to field response", "Community trust and legitimacy", "Rights-security balance"],
    causeChain: ["Threat", "Vulnerability", "Actor", "Institution", "Law", "Response", "Resilience"],
    oralChecklist: ["Name the threat", "Map vulnerability", "Name institution and law", "Add rights and community trust"],
    trapBank: [
      "Treating internal security as only force response without governance, legitimacy, and prevention.",
      "Mixing police, intelligence, CAPF, armed forces, courts, and community roles.",
      "Ignoring constitutional values and civil liberties while discussing security.",
    ],
    keywords: ["security", "threat", "vulnerability", "institution", "law", "police", "intelligence", "community", "rights", "resilience"],
    mcqAngles: ["threat-vulnerability distinction", "institution-role trap", "rights-security balance"],
  },
  "Border Security Map": {
    lens: "Terrain-technology-force-community border frame",
    teacherFocus:
      "Read border and coastal security through geography, terrain, livelihood, surveillance, force posture, diplomacy, migration, and local trust.",
    caseAnchors: ["Land border terrain map", "Coastal landing-point risk", "Smuggling and trafficking corridor", "Surveillance and community reporting"],
    causeChain: ["Terrain", "Threat route", "Local society", "Force posture", "Technology", "Diplomacy", "Response"],
    oralChecklist: ["Locate the border/coast", "Name threat route", "Add force and technology", "Include local community or diplomacy"],
    trapBank: [
      "Solving every border issue with fencing while ignoring terrain, livelihoods, and diplomacy.",
      "Treating coastal security as only Navy work while missing Coast Guard, police, ports, and fishing communities.",
      "Ignoring migration, smuggling, and local economy linkages.",
    ],
    keywords: ["border", "coastal", "terrain", "surveillance", "migration", "smuggling", "coast", "guard", "force", "community"],
    mcqAngles: ["border-force role trap", "coastal security actor chain", "terrain-technology limitation"],
  },
  "Terrorism Response Grid": {
    lens: "Network-finance-ideology-response frame",
    teacherFocus:
      "Study terrorism, radicalisation, LWE, and insurgency through ideology, grievance, recruitment, financing, technology, intelligence, law, and rehabilitation.",
    caseAnchors: ["Radicalisation prevention loop", "Terror-finance disruption", "LWE development-security matrix", "Surrender and rehabilitation policy"],
    causeChain: ["Ideology or grievance", "Recruitment", "Finance", "Weapon or network", "Intelligence", "Law", "Rehabilitation"],
    oralChecklist: ["Name actor and motive", "Trace recruitment/finance", "Add intelligence and law", "Close with prevention or rehabilitation"],
    trapBank: [
      "Giving only a hard-security answer while ignoring prevention, grievance, and rehabilitation.",
      "Mixing terrorism, insurgency, extremism, radicalisation, and organised crime as identical.",
      "Discussing LWE without terrain, governance deficit, policing, and development together.",
    ],
    keywords: ["terrorism", "radicalisation", "lwe", "insurgency", "finance", "recruitment", "intelligence", "law", "rehabilitation", "grievance"],
    mcqAngles: ["terrorism-insurgency distinction", "finance-network trap", "security-development balance"],
  },
  "Cyber Security Grid": {
    lens: "Data-infrastructure-actor-response cyber frame",
    teacherFocus:
      "Convert cyber, information warfare, organised crime, laundering, and terror finance into actor, method, infrastructure, law, agency, and resilience.",
    caseAnchors: ["Critical infrastructure ransomware", "Disinformation amplification", "Hawala-terror finance chain", "Narcotics-arms-money network"],
    causeChain: ["Actor", "Method", "Target", "Data or money flow", "Institution", "Law", "Resilience"],
    oralChecklist: ["Name actor/method", "Identify target or flow", "Add law/agency", "Explain continuity and resilience"],
    trapBank: [
      "Treating cyber security only as hacking while ignoring data, critical infrastructure, and public trust.",
      "Missing attribution, jurisdiction, evidence, and incident response challenges.",
      "Discussing organised crime without tracing money movement and agency coordination.",
    ],
    keywords: ["cyber", "data", "critical", "infrastructure", "malware", "disinformation", "laundering", "hawala", "agency", "resilience"],
    mcqAngles: ["cyber actor-method-target chain", "attribution limitation", "money-laundering stage trap"],
  },
  "Institution Response Chain": {
    lens: "Capacity-coordination-rights-accountability frame",
    teacherFocus:
      "Read security reforms and infrastructure protection through mandate, coordination, capacity, technology, prosecution, rights, and accountability.",
    caseAnchors: ["Police reform problem-solution table", "Intelligence coordination chain", "Critical infrastructure continuity plan", "Disaster-security overlap"],
    causeChain: ["Mandate", "Capacity", "Coordination", "Investigation", "Prosecution", "Rights", "Accountability"],
    oralChecklist: ["Name institutional gap", "Trace coordination", "Add capacity and rights", "End with accountable reform"],
    trapBank: [
      "Assuming more force automatically improves security without legitimacy, prosecution, and accountability.",
      "Mixing investigation, intelligence, prosecution, regulation, and community outreach.",
      "Ignoring continuity planning for critical infrastructure.",
    ],
    keywords: ["police", "intelligence", "coordination", "capacity", "prosecution", "rights", "accountability", "infrastructure", "continuity", "reform"],
    mcqAngles: ["police-intelligence role trap", "capacity-legitimacy balance", "continuity planning sequence"],
  },
  "Society Structure Lab": {
    lens: "Identity-institution-inequality-change society frame",
    teacherFocus:
      "Teach Indian society through family, caste, tribe, religion, region, class, identity, continuity, conflict, change, and governance response.",
    caseAnchors: ["Caste and social mobility", "Tribal identity and development", "Secularism and social harmony", "Family change and urban life"],
    causeChain: ["Social institution", "Identity", "Continuity", "Inequality", "Change", "Conflict", "Governance response"],
    oralChecklist: ["Name social structure", "Attach example", "Explain change/conflict", "Add constitutional or policy response"],
    trapBank: [
      "Writing society answers as moral commentary without structure, example, and change logic.",
      "Treating diversity, pluralism, secularism, and fraternity as interchangeable.",
      "Ignoring continuity while discussing social change.",
    ],
    keywords: ["society", "family", "caste", "tribe", "religion", "identity", "diversity", "secularism", "change", "governance"],
    mcqAngles: ["social feature-example match", "secularism-pluralism distinction", "continuity-change balance"],
  },
  "Social Justice Board": {
    lens: "Right-barrier-institution-delivery-dignity frame",
    teacherFocus:
      "Read social justice through group, vulnerability, right, barrier, institution, scheme, delivery, representation, dignity, and outcome.",
    caseAnchors: ["Women safety and empowerment chain", "Disability access barrier map", "Affirmative action logic", "Poverty-capability-welfare delivery"],
    causeChain: ["Group", "Barrier", "Right", "Institution", "Scheme", "Delivery", "Outcome"],
    oralChecklist: ["Name group and barrier", "Add right/scheme", "Trace institution and delivery", "Close with dignity/outcome"],
    trapBank: [
      "Listing schemes without barrier, target group, delivery gap, and measurable outcome.",
      "Reducing social justice to welfare spending while ignoring dignity, access, and representation.",
      "Mixing poverty, inequality, exclusion, and capability as identical concepts.",
    ],
    keywords: ["social", "justice", "vulnerable", "women", "children", "poverty", "inequality", "scheme", "access", "dignity"],
    mcqAngles: ["right-scheme-delivery chain", "poverty-inequality distinction", "access-dignity outcome"],
  },
  "Migration Urbanisation Map": {
    lens: "Mobility-city-informality-integration frame",
    teacherFocus:
      "Explain migration, urbanisation, globalisation, and social change through push-pull causes, city systems, informal work, identity, services, and policy.",
    caseAnchors: ["Rural-to-urban migration flow", "Informal labour and social security", "Slum service gap", "Globalisation and family change"],
    causeChain: ["Push factor", "Pull factor", "Mobility", "City system", "Informal work", "Service gap", "Integration"],
    oralChecklist: ["Name push-pull factor", "Trace city/work effect", "Add service/integration issue", "Suggest policy response"],
    trapBank: [
      "Treating migration only as a problem while missing remittances, opportunity, and mobility rights.",
      "Writing urbanisation answers without housing, services, informal labour, and governance capacity.",
      "Calling globalisation westernisation without analysing labour, family, identity, and culture.",
    ],
    keywords: ["migration", "urbanisation", "informal", "slum", "services", "labour", "globalisation", "identity", "integration", "policy"],
    mcqAngles: ["push-pull factor trap", "urban service chain", "globalisation-impact balance"],
  },
  "Security Case Board": {
    lens: "Case-to-strategy security answer frame",
    teacherFocus:
      "Convert security cases into context, actor, threat method, institution response, rights balance, gap, reform, and resilience lesson.",
    caseAnchors: ["Threat actor case grid", "Border incident to reform", "Cyber outage to continuity plan", "LWE district case framework"],
    causeChain: ["Context", "Actor", "Threat", "Institution", "Rights balance", "Gap", "Reform"],
    oralChecklist: ["State case context", "Name actors and threat", "Assess response and rights", "Extract reform lesson"],
    trapBank: [
      "Narrating incidents without extracting institution, rights balance, gap, and reform.",
      "Using one case as a universal model for every security issue.",
      "Ignoring rehabilitation, legitimacy, and long-term resilience.",
    ],
    keywords: ["case", "actor", "threat", "institution", "response", "rights", "gap", "reform", "resilience", "rehabilitation"],
    mcqAngles: ["case-to-framework conversion", "rights-response balance", "reform lesson trap"],
  },
  "Society Current Affairs": {
    lens: "News-to-society answer hook frame",
    teacherFocus:
      "Turn society current affairs into stable notes by connecting group, issue, institution, policy, social impact, constitutional value, and answer hook.",
    caseAnchors: ["Social media identity and misinformation", "Vulnerable group policy update", "Migration news to concept", "Community conflict and governance response"],
    causeChain: ["News", "Group", "Issue", "Institution", "Policy", "Impact", "Answer hook"],
    oralChecklist: ["Name group/issue", "Attach concept", "Add institution/policy", "Predict mains and MCQ angle"],
    trapBank: [
      "Using society news as a headline without concept, group, institution, and impact.",
      "Ignoring misinformation, privacy, identity, and social trust in social media answers.",
      "Missing constitutional values while discussing social conflict.",
    ],
    keywords: ["news", "society", "group", "identity", "media", "misinformation", "policy", "institution", "impact", "governance"],
    mcqAngles: ["news-to-concept conversion", "social-media risk-benefit", "group-policy-impact hook"],
  },
};

const labDecks: Record<string, Omit<InternalSecuritySocietyLabDeckCard, "id">[]> = {
  "security-framework": [
    {
      title: "Threat Matrix",
      category: "Security Architecture",
      anchor: "Threat, vulnerability, institution, law, force, community trust",
      detail:
        "Use one issue to connect threat type, exposed vulnerability, institution role, legal tool, force response, and legitimacy.",
      examTrap: "Force response alone does not complete an internal security answer.",
      proofHint: "Write one chain from threat to institution, law, rights, and resilience.",
    },
    {
      title: "Security Society Bridge",
      category: "Integrated GS",
      anchor: "Constitutional values, state capacity, community trust, rights balance",
      detail:
        "Explain why security and society must be handled together when identity, grievance, trust, and legitimacy affect outcomes.",
      examTrap: "Security without rights and society context becomes one-dimensional.",
      proofHint: "Give one example where community trust changes security effectiveness.",
    },
  ],
  "border-security-map": [
    {
      title: "Coastal Security Actor Chain",
      category: "Coastal Risk",
      anchor: "Coast Guard, Navy, police, ports, fishers, intelligence",
      detail:
        "Trace coastal threat prevention from community reporting to maritime surveillance, port security, and response coordination.",
      examTrap: "Coastal security is multi-agency, not only naval patrol.",
      proofHint: "Name three actors in one coastal security chain.",
    },
    {
      title: "Terrain Technology Limit",
      category: "Border Management",
      anchor: "Terrain, fencing, surveillance, local livelihood, diplomacy",
      detail:
        "Use a border sector to show where terrain and society limit purely technical security solutions.",
      examTrap: "Fencing cannot solve every border issue.",
      proofHint: "Connect terrain, technology, force, and local community in one line.",
    },
  ],
  "terrorism-response-grid": [
    {
      title: "Radicalisation Prevention Loop",
      category: "Terrorism",
      anchor: "Ideology, recruitment, online space, community, deradicalisation",
      detail:
        "Trace radicalisation from narrative and recruitment to prevention, community response, law, and rehabilitation.",
      examTrap: "Counter-terrorism needs prevention and deradicalisation, not only arrest.",
      proofHint: "Give one hard-security and one social-prevention measure.",
    },
    {
      title: "LWE Security Development Grid",
      category: "Extremism",
      anchor: "Terrain, grievance, governance deficit, policing, development, rehabilitation",
      detail:
        "Read LWE through terrain, deprivation, coercion, weak governance, area domination, welfare delivery, and surrender policy.",
      examTrap: "LWE is not solved by development or force alone.",
      proofHint: "Compare one security measure and one development measure.",
    },
  ],
  "cyber-security-grid": [
    {
      title: "Critical Infrastructure Incident",
      category: "Cyber Security",
      anchor: "Threat actor, malware, critical infrastructure, continuity, CERT response",
      detail:
        "Trace a cyber incident through attack vector, affected system, institutional response, continuity plan, and public trust.",
      examTrap: "Cyber harm can be national security harm even without visible physical violence.",
      proofHint: "Trace one ransomware incident from detection to recovery.",
    },
    {
      title: "Illicit Finance Trail",
      category: "Security Economy",
      anchor: "Placement, layering, integration, hawala, terror finance, agency coordination",
      detail:
        "Convert organised crime into money trail, network, predicate offence, agency role, and security consequence.",
      examTrap: "Weapon movement and money movement are both security signals.",
      proofHint: "Name two stages or channels in a money-laundering/terror-finance chain.",
    },
  ],
  "institution-response-chain": [
    {
      title: "Police Reform Chain",
      category: "Institutional Reform",
      anchor: "Capacity, autonomy, accountability, investigation, prosecution, rights",
      detail:
        "Connect police reform with professional capacity, political neutrality, investigation quality, prosecution, and public trust.",
      examTrap: "Capacity without accountability can reduce legitimacy.",
      proofHint: "Give one reform for capacity and one for accountability.",
    },
    {
      title: "Critical Infrastructure Continuity",
      category: "Resilience",
      anchor: "Risk audit, redundancy, response protocol, continuity, recovery",
      detail:
        "Map how power, telecom, banking, transport, or health systems should continue during cyber, disaster, or security stress.",
      examTrap: "Protection is incomplete without continuity and recovery planning.",
      proofHint: "Write one continuity chain for a critical infrastructure sector.",
    },
  ],
  "society-structure-lab": [
    {
      title: "Structure Change Map",
      category: "Indian Society",
      anchor: "Family, caste, tribe, religion, region, class, identity",
      detail:
        "Use one social feature to show continuity, change, conflict, and governance response with examples.",
      examTrap: "Indian society answers need examples, not only definitions.",
      proofHint: "Connect one social institution to one current example and one policy response.",
    },
    {
      title: "Diversity Cohesion Board",
      category: "Social Cohesion",
      anchor: "Diversity, secularism, pluralism, fraternity, constitutional morality",
      detail:
        "Compare diversity and cohesion through legal protection, civic trust, social harmony, and everyday institutions.",
      examTrap: "Secularism, pluralism, tolerance, and fraternity are related but not identical.",
      proofHint: "Separate secularism and pluralism in one example.",
    },
  ],
  "social-justice-board": [
    {
      title: "Group Barrier Institution Table",
      category: "Vulnerable Sections",
      anchor: "Right, barrier, scheme, institution, access, dignity",
      detail:
        "Map one vulnerable group through barrier, constitutional/legal right, scheme, delivery institution, and outcome.",
      examTrap: "Scheme lists do not prove social justice unless delivery and dignity are shown.",
      proofHint: "Use one group and name barrier, institution, and outcome.",
    },
    {
      title: "Capability Inclusion Frame",
      category: "Poverty and Inequality",
      anchor: "Poverty, inequality, capability, access, mobility, dignity",
      detail:
        "Explain social justice as capability expansion and access, not only income transfer.",
      examTrap: "Growth can reduce poverty but still leave inequality and exclusion.",
      proofHint: "Give one indicator beyond income.",
    },
  ],
  "migration-urbanisation-map": [
    {
      title: "Push Pull City Chain",
      category: "Migration",
      anchor: "Push factor, pull factor, mobility, informal work, services, integration",
      detail:
        "Trace a migration flow from origin stress to city opportunity, informal labour, service burden, and policy response.",
      examTrap: "Migration creates opportunity and vulnerability together.",
      proofHint: "Name one push, one pull, and one city governance response.",
    },
    {
      title: "Globalisation Social Change Grid",
      category: "Social Change",
      anchor: "Culture, consumerism, family, labour, diaspora, identity",
      detail:
        "Show how globalisation reshapes older structures without simply replacing them.",
      examTrap: "Globalisation is not the same as westernisation.",
      proofHint: "Give one positive and one negative social impact.",
    },
  ],
  "security-case-board": [
    {
      title: "Case To Strategy Grid",
      category: "Integrated Security",
      anchor: "Context, actor, threat, response, rights balance, gap, reform",
      detail:
        "Convert one security case into a reusable mains framework with actors, institutions, rights, gap, and reform.",
      examTrap: "Narrating a case without extracting strategy is weak.",
      proofHint: "Extract one institutional lesson and one rights-balance issue.",
    },
    {
      title: "Rehabilitation Reform Hook",
      category: "Resilience",
      anchor: "Surrender, counselling, livelihood, reintegration, monitoring",
      detail:
        "Use rehabilitation as a bridge between security response, society, development, and long-term peace.",
      examTrap: "Security strategy without rehabilitation can recycle the grievance.",
      proofHint: "Name one rehabilitation element and one monitoring need.",
    },
  ],
  "society-current-affairs": [
    {
      title: "Social Media Identity Risk",
      category: "Society Current Affairs",
      anchor: "Identity, mobilisation, misinformation, privacy, civic participation",
      detail:
        "Convert social media news into identity, social trust, governance, rights, and misinformation angles.",
      examTrap: "Social media is neither only democratic tool nor only social risk.",
      proofHint: "Give one democratic benefit and one governance risk.",
    },
    {
      title: "News To Society Example",
      category: "Answer Hook",
      anchor: "Group, issue, institution, policy, social impact, answer line",
      detail:
        "Turn a current-affairs item into a stable society example with affected group, concept, institution, and impact.",
      examTrap: "News without concept and group mapping does not become society material.",
      proofHint: "Convert one news item into group, issue, institution, and answer hook.",
    },
  ],
};

function fallbackPack(session: SubjectSession): InternalSecuritySocietyLearningPack {
  return {
    lens: session.lab,
    teacherFocus: `Teach ${session.title} through cause, actor, institution, rights, society impact, and reform.`,
    caseAnchors: [session.chapter, session.lab, "India case example", "Current affairs hook"],
    causeChain: ["Cause", "Actor", "Vulnerability", "Institution", "Impact", "Rights balance", "Reform"],
    oralChecklist: ["Name cause", "Name actor/institution", "Attach case", "Add rights or society impact"],
    trapBank: ["Moving to MCQs without linking security, society, institution, and reform."],
    keywords: [session.title, session.chapter, session.lab, "security", "society", "institution", "rights", "reform"]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
    mcqAngles: ["cause-actor-response chain", "institution role trap", "rights-impact balance"],
  };
}

export function getInternalSecuritySocietyLearningPack(session: SubjectSession): InternalSecuritySocietyLearningPack {
  return packByLab[session.lab] ?? fallbackPack(session);
}

export function buildInternalSecuritySocietyWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const pack = getInternalSecuritySocietyLearningPack(session);

  return [
    {
      id: `${session.day}-security-society-briefing`,
      kind: "briefing",
      title: "Security-society briefing",
      objective: pack.lens,
      narration: `${pack.teacherFocus} Today's anchor is ${session.anchor}.`,
      checkpoint: `Student can state why ${session.title} needs both security logic and society/governance context.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-security-society-chain`,
      kind: "mechanism",
      title: "Cause-to-reform chain",
      objective: "Build the integrated explanation before memorizing examples.",
      narration: `Use this chain: ${pack.causeChain.join(" -> ")}. Explain each link through ${session.title}.`,
      checkpoint: "Student can speak cause, actor, institution, rights/society impact, and reform.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-security-society-case`,
      kind: "application",
      title: "Case or group anchor",
      objective: "Attach the topic to an institution, case, social group, threat route, or policy response.",
      narration: `Choose one anchor: ${pack.caseAnchors.join(", ")}. The example must prove the security-society logic.`,
      checkpoint: "Student can connect one case to actor, institution, affected group, rights, or reform.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-security-society-trap`,
      kind: "trap",
      title: "UPSC integrated trap",
      objective: "Predict one-dimensional security answers, vague society examples, and role-confusion traps.",
      narration: `Common trap: ${pack.trapBank[0] ?? "Ignoring the security-society connection."}`,
      checkpoint: "Student can create one almost-correct statement and identify the missing actor, institution, or social impact.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-security-society-handoff`,
      kind: "handoff",
      title: "AI teacher handoff",
      objective: "Prepare the oral explanation.",
      narration: `In Talk room, cover: ${pack.oralChecklist.join(", ")}.`,
      checkpoint: "Student is ready to explain the topic through cause, actor, institution, impact, and reform.",
      durationMinutes: 2,
    },
  ];
}

export function getInternalSecuritySocietyLabDeck(
  labSlug: string,
  session: SubjectSession
): InternalSecuritySocietyLabDeckCard[] {
  const deck = labDecks[labSlug];
  const fallback = [
    {
      title: `${session.title} Integrated Builder`,
      category: session.chapter,
      anchor: session.anchor,
      detail:
        "Attach cause, actor, institution, social impact, rights balance, reform, and one UPSC trap.",
      examTrap: "Avoid moving to MCQs without one institution, one affected group or threat actor, and one reform hook.",
      proofHint: "Convert the topic into cause, actor, institution, impact, rights balance, and trap.",
    },
  ];

  return (deck ?? fallback).map((card, index) => ({
    ...card,
    id: `${session.day}-${labSlug || "security-society"}-${index + 1}`,
  }));
}

export function getInternalSecuritySocietyMcqTemplateHints(plan: SubjectSprintPlan, session: SubjectSession) {
  const pack = getInternalSecuritySocietyLearningPack(session);
  return {
    trapSeed: pack.trapBank[0] ?? `confusing actor, institution, security response, society impact, and reform inside ${session.title}`,
    explanationSeed: `Use ${pack.causeChain.join(" -> ")} and name the actor, institution, affected group, or reform limit.`,
    caseTag: pack.caseAnchors[0] ?? session.lab,
    source: "FRESH_INTERNAL_SECURITY_SOCIETY_AUTHORING",
    questionSeed: `Consider the following statements about ${session.title}: build a fresh UPSC trap around ${pack.mcqAngles[0] ?? pack.trapBank[0]}.`,
    planTitle: plan.title,
  };
}
