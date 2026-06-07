export type GeographyDay5ClimatologyStage = {
  id: "insolation" | "pressure" | "circulation" | "coriolis" | "belts";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay5ClimatologyStages: GeographyDay5ClimatologyStage[] = [
  {
    id: "insolation",
    label: "Read unequal heating",
    eyebrow: "Insolation",
    explanation: "Direct rays concentrate energy near low latitudes while slanting rays spread the same energy across a wider surface toward the poles.",
    proof: "Start with energy imbalance: latitude and sunlight angle create unequal heating.",
  },
  {
    id: "pressure",
    label: "Create pressure contrast",
    eyebrow: "Pressure gradient",
    explanation: "Warmer air expands and rises, creating a low-pressure tendency. Cooler denser air sinks, creating a high-pressure tendency.",
    proof: "Cause chain: unequal heating creates pressure differences; pressure gradient begins air movement.",
  },
  {
    id: "circulation",
    label: "Move air high to low",
    eyebrow: "Circulation",
    explanation: "Air moves from high pressure toward low pressure. Rising and sinking branches redistribute heat and build large circulation cells.",
    proof: "Trap: pressure gradient starts wind, but the final path is shaped by a rotating Earth.",
  },
  {
    id: "coriolis",
    label: "Deflect moving air",
    eyebrow: "Coriolis",
    explanation: "Earth's rotation deflects moving air to the right in the Northern Hemisphere and to the left in the Southern Hemisphere.",
    proof: "UPSC trap: Coriolis changes direction; it does not create the original pressure-gradient force.",
  },
  {
    id: "belts",
    label: "Recall global wind belts",
    eyebrow: "Planetary winds",
    explanation: "Pressure belts and circulation cells organize trade winds, westerlies, and polar easterlies. Their seasonal shift prepares monsoon logic.",
    proof: "Recall chain: unequal heating -> pressure gradient -> circulation -> Coriolis deflection -> planetary wind belts.",
  },
];

export const geographyDay5PortalLesson = {
  title: "Climatology Base",
  promise:
    "Derive global winds from unequal heating, pressure contrast, circulation, Earth's rotation, and pressure-belt organization.",
  sourceSummary:
    "Promoted from the staged Day 5 class pack and Monsoon Simulator preparation contract into a compact portal-native learner visual.",
  scenes: [
    {
      id: "5-briefing",
      kind: "briefing" as const,
      title: "Begin with uneven solar energy",
      objective: "Derive atmospheric motion from unequal heating instead of memorizing wind names.",
      narration:
        "Direct rays concentrate solar energy near low latitudes while slanting rays spread energy across a wider surface toward the poles.",
      checkpoint:
        "Student can explain why the atmosphere begins with an energy imbalance.",
      durationMinutes: 2,
    },
    {
      id: "5-mechanism",
      kind: "mechanism" as const,
      title: "Build pressure and circulation",
      objective: "Connect heating, density, pressure gradient, rising air, and sinking air.",
      narration:
        "Warm air expands and rises while cooler denser air sinks. Pressure differences move air from high pressure toward low pressure and redistribute heat.",
      checkpoint:
        "Student can connect unequal heating with pressure-gradient force and circulation.",
      durationMinutes: 3,
    },
    {
      id: "5-map",
      kind: "map" as const,
      title: "Add rotation and wind belts",
      objective: "Place Coriolis deflection inside the global circulation map.",
      narration:
        "Earth's rotation deflects moving air right in the Northern Hemisphere and left in the Southern Hemisphere. Pressure belts then organize trade winds, westerlies, and polar easterlies.",
      checkpoint:
        "Student can state hemisphere-wise Coriolis direction and name the major wind belts.",
      durationMinutes: 3,
    },
    {
      id: "5-trap",
      kind: "trap" as const,
      title: "Correct the common UPSC reversal",
      objective: "Separate the force that starts motion from the effect that curves motion.",
      narration:
        "Pressure gradient starts wind. Coriolis deflects moving air but does not create the original pressure contrast. Belts also shift seasonally with apparent solar movement.",
      checkpoint:
        "Student can reject a statement that treats Coriolis as the original cause of wind.",
      durationMinutes: 2,
    },
    {
      id: "5-recap",
      kind: "recap" as const,
      title: "Speak the circulation chain",
      objective: "Compress climatology base for AI-teacher discussion.",
      narration:
        "Explain the chain: unequal heating creates pressure contrast, pressure gradient moves air, rotation deflects it, and global belts organize planetary winds before seasonal monsoon shifts.",
      checkpoint:
        "Student is ready to explain the circulation chain and one direction trap.",
      durationMinutes: 2,
    },
  ],
};
