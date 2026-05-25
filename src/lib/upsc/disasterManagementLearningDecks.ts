import type { SubjectSession, SubjectSprintPlan } from "@/lib/upsc/subjectPlans";
import type { SubjectWatchScene } from "@/lib/upsc/subjectLearning";

export type DisasterManagementLearningPack = {
  lens: string;
  teacherFocus: string;
  caseAnchors: string[];
  causeChain: string[];
  oralChecklist: string[];
  trapBank: string[];
  keywords: string[];
  mcqAngles: string[];
};

export type DisasterManagementLabDeckCard = {
  id: string;
  title: string;
  category: string;
  anchor: string;
  detail: string;
  examTrap: string;
  proofHint: string;
};

const packByLab: Record<string, DisasterManagementLearningPack> = {
  "Risk Matrix": {
    lens: "Risk equation and resilience frame",
    teacherFocus:
      "Teach every Disaster Management topic through hazard, exposure, vulnerability, capacity, preparedness, response, recovery, and resilience.",
    caseAnchors: ["Sendai risk-reduction logic", "District hazard profile", "Urban flood exposure", "Community capacity mapping"],
    causeChain: ["Hazard", "Exposure", "Vulnerability", "Capacity", "Risk", "Preparedness", "Resilience"],
    oralChecklist: ["Name the hazard", "Map exposure", "Explain vulnerability", "Add capacity and mitigation"],
    trapBank: [
      "Treating a hazard as a disaster without checking exposure and vulnerability.",
      "Writing only relief measures while ignoring risk reduction and preparedness.",
      "Using resilience as a slogan without naming capacity, institutions, and local action.",
    ],
    keywords: [
      "hazard",
      "exposure",
      "vulnerability",
      "capacity",
      "risk",
      "resilience",
      "preparedness",
      "mitigation",
      "sendai",
      "community",
    ],
    mcqAngles: ["hazard versus disaster", "risk equation", "capacity-resilience distinction"],
  },
  "Hazard Map": {
    lens: "India hazard mapping and mitigation frame",
    teacherFocus:
      "Make students bind each hazard to location, trigger, vulnerable group, warning possibility, mitigation tool, and governance gap.",
    caseAnchors: ["Himalayan seismic belt", "Brahmaputra floodplain", "Coastal cyclone corridor", "Landslide-prone hill roads"],
    causeChain: ["Location", "Trigger", "Exposure", "Warning", "Mitigation", "Response", "Learning"],
    oralChecklist: ["Locate the hazard", "Name the trigger", "Identify exposed groups", "Choose structural and non-structural measures"],
    trapBank: [
      "Confusing structural mitigation with non-structural preparedness.",
      "Giving the same solution for riverine floods, flash floods, and urban floods.",
      "Ignoring land-use planning while discussing earthquake, flood, or landslide risk.",
    ],
    keywords: ["earthquake", "flood", "cyclone", "landslide", "drought", "zone", "warning", "mitigation", "land", "planning"],
    mcqAngles: ["structural versus non-structural measures", "hazard-zone mapping", "flood type distinction"],
  },
  "Response Chain": {
    lens: "Alert-to-recovery operations chain",
    teacherFocus:
      "Read response as a chain: forecast, warning, evacuation, shelter, relief, health, restoration, recovery, and build-back-better.",
    caseAnchors: ["Cyclone evacuation chain", "Heat action alert chain", "District flood control room", "Shelter and relief logistics"],
    causeChain: ["Forecast", "Warning", "Evacuation", "Shelter", "Relief", "Recovery", "Build back better"],
    oralChecklist: ["Start before impact", "Name the responsible actor", "Protect vulnerable groups", "Close with recovery reform"],
    trapBank: [
      "Starting disaster management only after the event has already occurred.",
      "Treating relief distribution as the complete response chain.",
      "Ignoring communication failure and last-mile alerting.",
    ],
    keywords: ["forecast", "warning", "evacuation", "shelter", "relief", "recovery", "response", "health", "last", "mile"],
    mcqAngles: ["preparedness versus response", "early warning chain", "build-back-better sequence"],
  },
  "Institution Grid": {
    lens: "Disaster governance and command grid",
    teacherFocus:
      "Force institution answers through legal mandate, planning level, coordination role, finance, response force, and district execution.",
    caseAnchors: ["DM Act command structure", "NDMA-SDMA-DDMA chain", "Incident Response System", "NDRF and district coordination"],
    causeChain: ["Legal mandate", "Plan", "Authority", "Coordination", "Finance", "Field response", "Accountability"],
    oralChecklist: ["Name the institution", "State the level", "Explain the role", "Avoid mixing policy and field execution"],
    trapBank: [
      "Mixing NDMA, SDMA, DDMA, NDRF, and district administration roles.",
      "Discussing institutions without naming planning, coordination, finance, or execution.",
      "Assuming central response replaces local preparedness.",
    ],
    keywords: ["ndma", "sdma", "ddma", "ndrf", "district", "incident", "response", "plan", "authority", "finance"],
    mcqAngles: ["NDMA-SDMA-DDMA role trap", "Incident Response System", "disaster fund hierarchy"],
  },
  "Technology Dashboard": {
    lens: "Technology-to-last-mile preparedness dashboard",
    teacherFocus:
      "Technology must be explained through data, forecast, risk map, decision support, communication, field action, and feedback.",
    caseAnchors: ["GIS shelter map", "Remote sensing flood layer", "Cell broadcast warning", "Drone-supported damage assessment"],
    causeChain: ["Data", "Model", "Risk map", "Alert", "Administration", "Community action", "Feedback"],
    oralChecklist: ["Name the technology", "Explain the decision it supports", "Add last-mile communication", "State one limitation"],
    trapBank: [
      "Assuming technology works without local institutions and public trust.",
      "Listing tools without explaining the decision they improve.",
      "Ignoring false alarms, exclusion, network failure, and language barriers.",
    ],
    keywords: ["gis", "remote", "sensing", "satellite", "warning", "drone", "communication", "data", "last", "mile"],
    mcqAngles: ["technology-use limitation", "early-warning last mile", "GIS-risk layer logic"],
  },
  "Case Study Board": {
    lens: "Case-study-to-answer framework",
    teacherFocus:
      "Convert each disaster case into context, risk factor, institution, community action, outcome, limitation, and reform lesson.",
    caseAnchors: ["Odisha cyclone preparedness", "Kerala flood lessons", "Himalayan disaster planning", "Industrial incident accountability"],
    causeChain: ["Context", "Risk factor", "Institution", "Community action", "Outcome", "Gap", "Reform"],
    oralChecklist: ["State the case", "Extract the lesson", "Connect institution and community", "End with a reform line"],
    trapBank: [
      "Narrating events without extracting governance and resilience lessons.",
      "Using one case as a universal model for every hazard.",
      "Missing ethical, vulnerable-group, and build-back-better dimensions.",
    ],
    keywords: ["case", "lesson", "institution", "community", "outcome", "gap", "reform", "resilience", "ethics", "recovery"],
    mcqAngles: ["case-to-concept conversion", "lesson versus event", "build-back-better application"],
  },
  "Fire and Industrial Risk": {
    lens: "Technical disaster prevention and accountability lab",
    teacherFocus:
      "Read industrial, chemical, nuclear, biological, and fire risk through prevention, safety regulation, emergency plan, health response, liability, and public communication.",
    caseAnchors: ["On-site and off-site emergency plan", "Hazardous material storage", "Forest fire line planning", "Hospital surge readiness"],
    causeChain: ["Hazard source", "Regulation", "Emergency plan", "Detection", "Response", "Health protection", "Accountability"],
    oralChecklist: ["Name the source", "Explain prevention", "Trace emergency response", "Add liability or public communication"],
    trapBank: [
      "Treating industrial disasters as only response issues instead of prevention and regulation failures.",
      "Ignoring on-site and off-site planning distinctions.",
      "Discussing biological or chemical incidents without health-system preparedness.",
    ],
    keywords: ["industrial", "chemical", "nuclear", "biological", "fire", "emergency", "liability", "health", "safety", "regulation"],
    mcqAngles: ["on-site versus off-site plan", "technical disaster prevention", "health-system response"],
  },
};

const labDecks: Record<string, Omit<DisasterManagementLabDeckCard, "id">[]> = {
  "risk-matrix": [
    {
      title: "Risk Equation Board",
      category: "Risk Reduction",
      anchor: "Hazard x exposure x vulnerability, moderated by capacity",
      detail:
        "Use one district example to show why the same hazard produces different losses when exposure, vulnerability, and capacity change.",
      examTrap: "A hazard becomes a disaster only when vulnerable people, assets, or systems are exposed.",
      proofHint: "Write one line separating hazard, exposure, vulnerability, and capacity.",
    },
    {
      title: "Sendai Priority Ladder",
      category: "Framework",
      anchor: "Understand risk, strengthen governance, invest, enhance preparedness",
      detail:
        "Convert Sendai into a practical answer flow: know the risk, assign responsibility, invest before impact, and recover better.",
      examTrap: "Sendai is not only post-disaster response; it is a risk-reduction framework.",
      proofHint: "Attach one Sendai priority to one Indian disaster example.",
    },
  ],
  "hazard-map": [
    {
      title: "Urban Flood Exposure Map",
      category: "Flood Risk",
      anchor: "Rainfall, drainage, encroachment, low-lying settlements",
      detail:
        "Trace how intense rainfall becomes urban flooding when drainage capacity, land use, and vulnerable settlement exposure are weak.",
      examTrap: "Urban flood answers fail when they mention only rainfall and ignore planning failure.",
      proofHint: "Give one structural and one non-structural urban flood measure.",
    },
    {
      title: "Himalayan Multi-Hazard Grid",
      category: "Mountain Risk",
      anchor: "Earthquake, landslide, glacial risk, road cutting, fragile ecology",
      detail:
        "Read Himalayan disasters as compounded hazards where geology, infrastructure, climate extremes, and governance intersect.",
      examTrap: "Engineering works alone cannot solve fragile landscape risk.",
      proofHint: "Connect terrain, land use, warning, and community preparedness.",
    },
  ],
  "response-chain": [
    {
      title: "Cyclone Warning To Shelter",
      category: "Coastal Response",
      anchor: "Forecast, warning, evacuation, shelters, relief, livelihood recovery",
      detail:
        "Trace the operational chain from forecast to local warning, transport, shelters, health support, and recovery of livelihoods.",
      examTrap: "Mortality reduction does not automatically mean asset and livelihood resilience.",
      proofHint: "Name one reason evacuation succeeds and one reason recovery remains hard.",
    },
    {
      title: "Heat Action Plan Chain",
      category: "Slow-Onset Risk",
      anchor: "Alert threshold, public messaging, work hours, water, health facilities",
      detail:
        "Turn heatwaves into a local administration response chain, not just a climate fact.",
      examTrap: "Heatwave risk is invisible until vulnerable groups and occupational exposure are mapped.",
      proofHint: "List three actors in a heat action plan.",
    },
  ],
  "institution-grid": [
    {
      title: "NDMA-SDMA-DDMA Role Map",
      category: "Governance",
      anchor: "National policy, state planning, district execution",
      detail:
        "Separate apex policy, state coordination, district field planning, response forces, and local bodies in one chain.",
      examTrap: "NDRF is a response force; it is not the same as NDMA policy authority.",
      proofHint: "Write one role each for NDMA, SDMA, DDMA, and NDRF.",
    },
    {
      title: "Incident Response System",
      category: "Command",
      anchor: "Command, operations, planning, logistics, finance",
      detail:
        "Use incident response logic to assign roles during a complex emergency instead of writing vague coordination language.",
      examTrap: "Coordination is not a word to repeat; it needs command, information, logistics, and accountability.",
      proofHint: "Convert one flood response into four command functions.",
    },
  ],
  "technology-dashboard": [
    {
      title: "GIS Shelter Route Layer",
      category: "Decision Support",
      anchor: "Risk map, shelter, road, vulnerable group, evacuation route",
      detail:
        "Use GIS to connect hazard zones, exposed households, shelters, roads, and field teams before impact.",
      examTrap: "A map is useful only when it changes a field decision.",
      proofHint: "Name the layers required for one evacuation map.",
    },
    {
      title: "Remote Sensing Damage Scan",
      category: "Assessment",
      anchor: "Satellite image, inundation layer, crop damage, relief targeting",
      detail:
        "Use remote sensing as a post-event assessment tool that supports compensation, relief, and recovery prioritization.",
      examTrap: "Damage data without ground validation can mislead relief targeting.",
      proofHint: "Explain why satellite data and local verification both matter.",
    },
  ],
  "case-study-board": [
    {
      title: "Odisha Cyclone Preparedness",
      category: "Case Lesson",
      anchor: "Warning, shelters, evacuation, community drills, mortality reduction",
      detail:
        "Use the case to show how preparedness, institutions, local communication, and shelters reduce life loss.",
      examTrap: "Do not convert a successful mortality story into a claim that all disaster losses are solved.",
      proofHint: "Extract one success, one remaining gap, and one reform.",
    },
    {
      title: "Kerala Flood Governance Lesson",
      category: "Case Lesson",
      anchor: "Extreme rainfall, dams, land use, local response, recovery",
      detail:
        "Convert the flood into a governance answer about basin planning, land use, warning, reservoir coordination, and recovery.",
      examTrap: "A flood case is not only rainfall; planning, exposure, and coordination decide outcomes.",
      proofHint: "Write a risk-reduction lesson from the case.",
    },
  ],
  "fire-and-industrial-risk": [
    {
      title: "Chemical Emergency Plan",
      category: "Industrial Risk",
      anchor: "Hazard source, on-site plan, off-site plan, hospital readiness",
      detail:
        "Trace prevention, monitoring, worker safety, district emergency planning, medical triage, and public information.",
      examTrap: "On-site factory control and off-site district response are different planning layers.",
      proofHint: "Separate prevention, emergency response, and compensation.",
    },
    {
      title: "Forest Fire Risk Chain",
      category: "Ecological Disaster",
      anchor: "Fuel load, heat, human activity, detection, fire lines, community response",
      detail:
        "Connect forest fire risk to climate, forest management, local livelihoods, biodiversity, and response readiness.",
      examTrap: "Fire risk answers should include prevention and ecological recovery, not only firefighting.",
      proofHint: "Name one prevention, one detection, and one recovery measure.",
    },
  ],
};

function fallbackPack(session: SubjectSession): DisasterManagementLearningPack {
  return {
    lens: session.lab,
    teacherFocus: `Teach ${session.title} through risk, preparedness, institution, response, recovery, and resilience.`,
    caseAnchors: [session.chapter, session.lab, "India disaster case", "District response example"],
    causeChain: ["Hazard", "Exposure", "Vulnerability", "Capacity", "Response", "Recovery", "Trap"],
    oralChecklist: ["Define the risk", "Name the institution", "Add one case", "Predict one trap"],
    trapBank: ["Moving to MCQs without proving the risk-reduction logic."],
    keywords: [session.title, session.chapter, session.lab, "risk", "preparedness", "response", "resilience"]
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
    mcqAngles: ["risk-response distinction", "institution-role trap", "preparedness-recovery sequence"],
  };
}

export function getDisasterManagementLearningPack(session: SubjectSession): DisasterManagementLearningPack {
  return packByLab[session.lab] ?? fallbackPack(session);
}

export function buildDisasterManagementWatchScenes(session: SubjectSession): SubjectWatchScene[] {
  const pack = getDisasterManagementLearningPack(session);

  return [
    {
      id: `${session.day}-disaster-briefing`,
      kind: "briefing",
      title: "Risk briefing",
      objective: pack.lens,
      narration: `${pack.teacherFocus} Today's anchor is ${session.anchor}.`,
      checkpoint: `Student can explain why ${session.title} belongs to risk reduction, not only relief.`,
      durationMinutes: 2,
    },
    {
      id: `${session.day}-disaster-chain`,
      kind: "mechanism",
      title: "Risk-reduction chain",
      objective: "Build the complete disaster sequence before memorizing facts.",
      narration: `Use this chain: ${pack.causeChain.join(" -> ")}. Explain each link through ${session.title}.`,
      checkpoint: "Student can speak the chain with risk, preparedness, response, and recovery.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-disaster-case`,
      kind: "application",
      title: "Case or institution anchor",
      objective: "Attach the concept to a case, institution, hazard map, or district action.",
      narration: `Choose one anchor: ${pack.caseAnchors.join(", ")}. The example must prove the risk-management logic.`,
      checkpoint: "Student can connect one case to institution, community, warning, or mitigation.",
      durationMinutes: 3,
    },
    {
      id: `${session.day}-disaster-trap`,
      kind: "trap",
      title: "UPSC disaster trap",
      objective: "Predict relief-only, role-confusion, and hazard-disaster traps.",
      narration: `Common trap: ${pack.trapBank[0] ?? "Treating response as the whole subject."}`,
      checkpoint: "Student can create one almost-correct statement and identify the missing risk-reduction layer.",
      durationMinutes: 2,
    },
    {
      id: `${session.day}-disaster-handoff`,
      kind: "handoff",
      title: "AI teacher handoff",
      objective: "Prepare the oral explanation.",
      narration: `In Talk room, cover: ${pack.oralChecklist.join(", ")}.`,
      checkpoint: "Student is ready to explain the topic through hazard, people, institution, action, and trap.",
      durationMinutes: 2,
    },
  ];
}

export function getDisasterManagementLabDeck(labSlug: string, session: SubjectSession): DisasterManagementLabDeckCard[] {
  const deck = labDecks[labSlug];
  const fallback = [
    {
      title: `${session.title} Risk Builder`,
      category: session.chapter,
      anchor: session.anchor,
      detail:
        "Attach hazard, exposure, vulnerability, capacity, institution, response chain, recovery lesson, and MCQ trap.",
      examTrap: "Avoid moving to MCQs without one risk-reduction proof and one institutional role.",
      proofHint: "Convert the topic into risk factor, actor, action, case, and statement trap.",
    },
  ];

  return (deck ?? fallback).map((card, index) => ({
    ...card,
    id: `${session.day}-${labSlug || "disaster"}-${index + 1}`,
  }));
}

export function getDisasterManagementMcqTemplateHints(plan: SubjectSprintPlan, session: SubjectSession) {
  const pack = getDisasterManagementLearningPack(session);
  return {
    trapSeed: pack.trapBank[0] ?? `confusing hazard, risk, response, and resilience inside ${session.title}`,
    explanationSeed: `Use ${pack.causeChain.join(" -> ")} and name the institution or case limitation.`,
    caseTag: pack.caseAnchors[0] ?? session.lab,
    source: "FRESH_DISASTER_MANAGEMENT_AUTHORING",
    questionSeed: `Consider the following statements about ${session.title}: build a fresh UPSC trap around ${pack.mcqAngles[0] ?? pack.trapBank[0]}.`,
    planTitle: plan.title,
  };
}
