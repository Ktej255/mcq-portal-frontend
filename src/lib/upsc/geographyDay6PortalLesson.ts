export type GeographyDay6OceanStage = {
  id: "relief" | "properties" | "circulation" | "effects" | "map";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay6OceanStages: GeographyDay6OceanStage[] = [
  {
    id: "relief",
    label: "Read the ocean floor",
    eyebrow: "Relief",
    explanation: "Continental shelf, slope, abyssal plain, ridge, and trench shape the ocean basin before water properties and currents are added.",
    proof: "Start with basin structure: shelf and slope connect the coast to deep-ocean relief.",
  },
  {
    id: "properties",
    label: "Compare water properties",
    eyebrow: "Temperature and salinity",
    explanation: "Latitude, evaporation, precipitation, river inflow, ice, and mixing change temperature and salinity. Together they influence seawater density.",
    proof: "Cause chain: temperature and salinity alter density, but neither variable should be read in isolation.",
  },
  {
    id: "circulation",
    label: "Trace warm and cold currents",
    eyebrow: "Circulation",
    explanation: "Winds, rotation, basin shape, and density differences organize surface and deep-ocean circulation. Warm and cold currents move heat across the map.",
    proof: "Trap: a current name is useful only when its location, direction, and temperature effect are connected.",
  },
  {
    id: "effects",
    label: "Connect coastal effects",
    eyebrow: "Climate and fisheries",
    explanation: "Warm currents often add heat and moisture. Cold currents can support coastal deserts, fog, and nutrient-rich upwelling that improves fisheries.",
    proof: "UPSC trap: salinity alone does not explain fisheries; upwelling and nutrient supply matter.",
  },
  {
    id: "map",
    label: "Recall current-location pairs",
    eyebrow: "Map proof",
    explanation: "Use one pair at a time: Gulf Stream and North Atlantic Drift warm western Europe, while the Peru Current supports upwelling and coastal aridity.",
    proof: "Recall chain: relief -> properties -> circulation -> coastal effects -> current-location map pair.",
  },
];

export const geographyDay6PortalLesson = {
  title: "Ocean System",
  promise:
    "Connect ocean relief, temperature, salinity, circulation, coastal climate, fog, deserts, upwelling, fisheries, and current-location pairs.",
  sourceSummary:
    "Promoted from the staged Day 6 class pack into a compact portal-native learner visual for ocean-current map logic.",
  scenes: [
    {
      id: "6-briefing",
      kind: "briefing" as const,
      title: "Begin with basin relief",
      objective: "Place the ocean floor beneath current and climate logic.",
      narration:
        "Continental shelf, slope, abyssal plain, ridge, and trench shape the ocean basin. Shelf seas also matter for fisheries and coastal activity.",
      checkpoint:
        "Student can trace the coast-to-deep-ocean relief sequence.",
      durationMinutes: 2,
    },
    {
      id: "6-mechanism",
      kind: "mechanism" as const,
      title: "Add water properties and circulation",
      objective: "Connect temperature, salinity, density, winds, rotation, and basin shape.",
      narration:
        "Latitude, evaporation, precipitation, rivers, ice, and mixing change temperature and salinity. Winds, rotation, basin shape, and density differences organize circulation.",
      checkpoint:
        "Student can explain why currents cannot be reduced to one variable.",
      durationMinutes: 3,
    },
    {
      id: "6-map",
      kind: "map" as const,
      title: "Map warm and cold current effects",
      objective: "Attach current type to location-specific climate and fishery outcomes.",
      narration:
        "Warm currents usually add heat and moisture. Cold currents can support coastal deserts, fog, and nutrient-rich upwelling. Use a current-location pair before stating an effect.",
      checkpoint:
        "Student can explain one warm-current pair and one cold-current pair.",
      durationMinutes: 3,
    },
    {
      id: "6-trap",
      kind: "trap" as const,
      title: "Correct the fisheries shortcut",
      objective: "Separate salinity facts from upwelling and nutrient logic.",
      narration:
        "Do not explain productive fisheries through salinity alone. Upwelling brings nutrient-rich deeper water toward the surface and supports biological productivity.",
      checkpoint:
        "Student can reject a statement that treats salinity alone as the cause of fisheries.",
      durationMinutes: 2,
    },
    {
      id: "6-recap",
      kind: "recap" as const,
      title: "Speak the ocean-system chain",
      objective: "Compress the map logic for AI-teacher discussion.",
      narration:
        "Explain the chain: relief shapes the basin, temperature and salinity influence density, circulation redistributes heat, and current-location pairs explain climate, fog, deserts, upwelling, and fisheries.",
      checkpoint:
        "Student is ready to explain one current-location pair and one UPSC trap.",
      durationMinutes: 2,
    },
  ],
};
