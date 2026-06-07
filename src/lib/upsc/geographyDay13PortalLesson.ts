export type GeographyDay13ResourcesAgricultureStage = {
  id: "locate" | "resources" | "crops" | "water" | "cluster";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay13ResourcesAgricultureStages: GeographyDay13ResourcesAgricultureStage[] = [
  {
    id: "locate",
    label: "Begin with location logic",
    eyebrow: "Map framework",
    explanation:
      "Resources and crops do not appear randomly. Start with geology, relief, soil, water, climate, transport, market access, and policy before memorizing belts.",
    proof: "Method: location factor -> regional belt -> economic use -> constraint -> sustainability issue.",
  },
  {
    id: "resources",
    label: "Trace resource belts",
    eyebrow: "Minerals and energy",
    explanation:
      "Mineral belts follow geology. Energy geography adds extraction site, transport route, demand center, environmental cost, and the limits of one-state shortcuts.",
    proof: "Trap: a mineral-state pair is incomplete without geology, belt continuity, and economic use.",
  },
  {
    id: "crops",
    label: "Build crop suitability",
    eyebrow: "Agro-climatic logic",
    explanation:
      "Crop belts emerge from soil, rainfall, temperature, growing season, irrigation, market access, and technology. Suitability is a chain, not a single-factor fact.",
    proof: "Map chain: soil + rain + temperature + water + market shape the crop belt.",
  },
  {
    id: "water",
    label: "Add irrigation pressure",
    eyebrow: "Productivity and stress",
    explanation:
      "Irrigation and groundwater can increase output while also creating depletion, salinity, waterlogging, energy stress, and regional inequality.",
    proof: "UPSC trap: higher irrigation can raise productivity and still produce long-term water stress.",
  },
  {
    id: "cluster",
    label: "Explain one cluster",
    eyebrow: "Applied recall",
    explanation:
      "A strong answer links one crop, mineral, or energy resource with its location factor, region, economic use, pressure, and one near-correct UPSC trap.",
    proof: "Recall chain: factor -> belt -> use -> pressure -> response -> swapped-pair trap.",
  },
];

export const geographyDay13PortalLesson = {
  title: "Resources and Agriculture",
  promise:
    "Explain resource and crop belts through geology, relief, water, climate, transport, market access, policy, and sustainability pressure.",
  sourceSummary:
    "Promoted from the staged India Map Command pack into a compact portal-native resource-and-crop location visual.",
  scenes: [
    {
      id: "13-briefing",
      kind: "briefing" as const,
      title: "Begin with location factors",
      objective: "Explain why resources and crops cluster before naming belts.",
      narration:
        "Start with geology, relief, soil, water, climate, transport, market access, and policy. These variables create resource and agricultural patterns.",
      checkpoint:
        "Student can name the main location factors behind one resource or crop belt.",
      durationMinutes: 2,
    },
    {
      id: "13-mechanism",
      kind: "mechanism" as const,
      title: "Trace resource and crop belts",
      objective: "Connect geology-led resources with agro-climatic crop suitability.",
      narration:
        "Mineral belts follow geology, while crop belts respond to soil, rainfall, temperature, water, market access, and technology. Keep each chain complete.",
      checkpoint:
        "Student can explain one mineral or energy belt and one crop belt through location logic.",
      durationMinutes: 3,
    },
    {
      id: "13-map",
      kind: "map" as const,
      title: "Add water and sustainability pressure",
      objective: "Connect productivity gains with long-term regional constraints.",
      narration:
        "Irrigation and groundwater can raise output while creating depletion, salinity, waterlogging, energy stress, and unequal access. Attach one pressure to one region.",
      checkpoint:
        "Student can connect one productivity gain with one sustainability pressure.",
      durationMinutes: 3,
    },
    {
      id: "13-trap",
      kind: "trap" as const,
      title: "Reject swapped belts",
      objective: "Prepare for crop-region, mineral-state, energy-zone, and irrigation-impact traps.",
      narration:
        "A statement may use a correct crop, mineral, state, or irrigation effect inside the wrong belt. Check the full location chain before accepting the pair.",
      checkpoint:
        "Student can reject one near-correct resource-region or crop-condition pair.",
      durationMinutes: 2,
    },
    {
      id: "13-recap",
      kind: "recap" as const,
      title: "Explain one regional cluster",
      objective: "Move into AI-teacher discussion with one resource-or-crop chain.",
      narration:
        "Choose one crop, mineral, or energy resource. State the location factor, region, economic use, sustainability pressure, practical response, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one regional cluster and reject one swapped pair.",
      durationMinutes: 2,
    },
  ],
};
