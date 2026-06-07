export type GeographyDay17EconomicActivitiesStage = {
  id: "primary" | "secondary" | "tertiary" | "knowledge" | "shift";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay17EconomicActivitiesStages: GeographyDay17EconomicActivitiesStage[] = [
  {
    id: "primary",
    label: "Begin with extraction",
    eyebrow: "Primary activity",
    explanation:
      "Primary activities extract or use natural resources through agriculture, fishing, forestry, mining, and related work. Location follows the resource base.",
    proof: "Start with input: primary activity depends directly on land, water, forest, or mineral base.",
  },
  {
    id: "secondary",
    label: "Add transformation",
    eyebrow: "Secondary activity",
    explanation:
      "Secondary activities transform raw material into goods. Industry adds energy, labor, capital, transport, technology, market, and policy to the location decision.",
    proof: "Chain: resource input -> processing -> infrastructure -> market-facing output.",
  },
  {
    id: "tertiary",
    label: "Connect services",
    eyebrow: "Tertiary activity",
    explanation:
      "Tertiary activities provide services such as transport, trade, finance, health, education, and communication. They support and reorganize the other sectors.",
    proof: "Trap: a service link may support production without becoming secondary activity itself.",
  },
  {
    id: "knowledge",
    label: "Add knowledge and decisions",
    eyebrow: "Quaternary and quinary",
    explanation:
      "Quaternary work organizes knowledge, research, data, and innovation. Quinary work emphasizes high-order decisions, leadership, and advanced public or private services.",
    proof: "Location still matters through skills, networks, data, institutions, and policy.",
  },
  {
    id: "shift",
    label: "Explain structural change",
    eyebrow: "Development transition",
    explanation:
      "As productivity, urbanization, education, infrastructure, technology, and markets change, the employment and output mix shifts while sector linkages remain interdependent.",
    proof: "Recall chain: input -> transformation -> service -> knowledge -> structural shift -> reject overlap trap.",
  },
];

export const geographyDay17PortalLesson = {
  title: "Economic Activities",
  promise:
    "Explain primary, secondary, tertiary, quaternary, and quinary activities through inputs, location factors, linkages, technology, markets, and structural change.",
  sourceSummary:
    "Promoted from the staged Human and Economic Geography pack into a compact portal-native sector-transition visual.",
  scenes: [
    {
      id: "17-briefing",
      kind: "briefing" as const,
      title: "Begin with sector classification",
      objective: "Separate extraction, transformation, services, knowledge, and high-order decisions.",
      narration:
        "Primary activities use natural resources, secondary activities transform material, tertiary activities provide services, and quaternary or quinary activities organize knowledge and decisions.",
      checkpoint:
        "Student can classify one example in each major sector group.",
      durationMinutes: 2,
    },
    {
      id: "17-mechanism",
      kind: "mechanism" as const,
      title: "Connect the sectors",
      objective: "Explain how an activity chain moves from resource input to market-facing value.",
      narration:
        "Connect resource extraction with processing, transport, trade, finance, information, and decision systems. Real economies rely on linked sectors rather than isolated boxes.",
      checkpoint:
        "Student can trace one product or service through at least three linked sectors.",
      durationMinutes: 3,
    },
    {
      id: "17-map",
      kind: "map" as const,
      title: "Explain location and structural shift",
      objective: "Connect sector geography with changing development conditions.",
      narration:
        "Location still matters through resources, energy, labor, routes, markets, skills, networks, data, and policy. Productivity, urbanization, education, infrastructure, and technology change the sector mix over time.",
      checkpoint:
        "Student can explain why one sector grows or relocates as development conditions change.",
      durationMinutes: 3,
    },
    {
      id: "17-trap",
      kind: "trap" as const,
      title: "Reject overlap traps",
      objective: "Prepare for mixed extraction, processing, service, and knowledge examples.",
      narration:
        "One economic chain can contain several sectors. Classify the specific activity being described instead of labeling the entire chain with one category.",
      checkpoint:
        "Student can reject one near-correct sector classification statement.",
      durationMinutes: 2,
    },
    {
      id: "17-recap",
      kind: "recap" as const,
      title: "Explain one economic chain",
      objective: "Move into discussion with one sector-transition explanation.",
      narration:
        "Choose one activity. State the sector, input, location factor, technology or market link, development shift, and one overlap trap.",
      checkpoint:
        "Student is ready to explain one sector chain and reject one classification overlap.",
      durationMinutes: 2,
    },
  ],
};
