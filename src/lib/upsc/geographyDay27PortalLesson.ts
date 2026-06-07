export type GeographyDay27FullGeographyDrillStage = {
  id: "physical" | "india" | "human" | "bridges" | "repair";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay27FullGeographyDrillStages: GeographyDay27FullGeographyDrillStage[] = [
  {
    id: "physical",
    label: "Recall the physical base",
    eyebrow: "Processes first",
    explanation:
      "Begin with structure, relief, weathering, atmosphere, climate, and oceans. Physical mechanisms create the base layer for India, human, environment, and disaster geography.",
    proof: "Physical base: process -> location -> consequence.",
  },
  {
    id: "india",
    label: "Overlay the India map",
    eyebrow: "Spatial proof",
    explanation:
      "Attach relief, drainage, monsoon, climate, soil, vegetation, resources, agriculture, and regional examples to the physical mechanism.",
    proof: "India map check: locate before accepting a familiar statement.",
  },
  {
    id: "human",
    label: "Connect people and networks",
    eyebrow: "Human outcomes",
    explanation:
      "Trace population, settlement, economic activity, transport, industry, and regional development through resources, services, networks, and governance.",
    proof: "Human chain: people -> activity -> network -> regional outcome.",
  },
  {
    id: "bridges",
    label: "Add environment and disaster",
    eyebrow: "Integrated application",
    explanation:
      "Link habitat, biodiversity, climate exposure, hazard, vulnerability, and capacity to the geographic base. Integrated questions cross chapter boundaries.",
    proof: "Bridge check: one process + one location + one impact.",
  },
  {
    id: "repair",
    label: "Build the weak-area heatmap",
    eyebrow: "Revision becomes precise",
    explanation:
      "Tag each wrong answer by chapter, map zone, concept type, and trap type. Turn the error into a repair card with cause, map cue, and retest.",
    proof: "Recall chain: classify -> connect -> locate -> repair -> retest.",
  },
];

export const geographyDay27PortalLesson = {
  title: "Full Geography Drill",
  promise:
    "Run the complete Geography recap through physical process, India map, human outcomes, environment and disaster bridges, and weak-area repair.",
  sourceSummary:
    "Promoted from the staged Atlas, PYQ Logic, Revision pack into a compact portal-native subject-integration visual.",
  scenes: [
    {
      id: "27-briefing",
      kind: "briefing" as const,
      title: "Start from the physical base",
      objective: "Recall the mechanisms that support the entire subject.",
      narration:
        "Move quickly through structure, relief, external processes, atmosphere, climate, and oceans. Name the process, location logic, and consequence.",
      checkpoint:
        "Student can state one physical-geography chain without isolated memorization.",
      durationMinutes: 2,
    },
    {
      id: "27-mechanism",
      kind: "mechanism" as const,
      title: "Overlay India and human geography",
      objective: "Connect spatial patterns with people, activities, and networks.",
      narration:
        "Attach India relief, drainage, monsoon, soils, resources, and agriculture before tracing population, settlements, sectors, corridors, industry, and development outcomes.",
      checkpoint:
        "Student can connect one India map pattern with one human-geography outcome.",
      durationMinutes: 3,
    },
    {
      id: "27-map",
      kind: "map" as const,
      title: "Bridge environment and disaster",
      objective: "Cross chapter boundaries through one integrated explanation.",
      narration:
        "Add habitat, biodiversity, climate exposure, hazard, vulnerability, and capacity. Integrated questions commonly combine one process, one location, and one impact.",
      checkpoint:
        "Student can explain one environment or disaster link through the geographic base.",
      durationMinutes: 3,
    },
    {
      id: "27-trap",
      kind: "trap" as const,
      title: "Reject the wrong chapter context",
      objective: "Prepare for mixed-drill statement traps.",
      narration:
        "A fact can be correct while the chapter relationship is wrong. Verify process, place, impact, and context before accepting an integrated statement.",
      checkpoint:
        "Student can identify the precise wrong-context mismatch inside one option.",
      durationMinutes: 2,
    },
    {
      id: "27-recap",
      kind: "recap" as const,
      title: "Create one repair card",
      objective: "Move into discussion with one integrated weak-area diagnosis.",
      narration:
        "Choose one weak answer. Tag chapter, map zone, concept type, and trap type. Add cause, map cue, correction, and fresh retest plan.",
      checkpoint:
        "Student is ready to explain one integrated chain and one repair card.",
      durationMinutes: 2,
    },
  ],
};
