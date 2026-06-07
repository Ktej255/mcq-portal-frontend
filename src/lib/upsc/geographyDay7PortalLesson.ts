export type GeographyDay7ConsolidationStage = {
  id: "location" | "tectonics" | "surface" | "circulation" | "synthesis";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay7ConsolidationStages: GeographyDay7ConsolidationStage[] = [
  {
    id: "location",
    label: "Anchor the map",
    eyebrow: "Location language",
    explanation: "Coordinates, relative location, scale, and map relationships tell you where a process occurs before you explain why it occurs.",
    proof: "Start with place: every physical-geography answer needs a location or map relationship.",
  },
  {
    id: "tectonics",
    label: "Add the internal driver",
    eyebrow: "Earth system",
    explanation: "Earth's layered interior and plate movement create relief, ridges, trenches, mountains, volcanoes, earthquakes, and major hazard zones.",
    proof: "Cause chain: internal heat and plate movement create the relief framework.",
  },
  {
    id: "surface",
    label: "Reshape relief",
    eyebrow: "Geomorphic processes",
    explanation: "Weathering, erosion, transport, deposition, and mass wasting modify tectonic relief after it reaches the surface.",
    proof: "Trap: tectonics creates relief; weathering and erosion reshape it.",
  },
  {
    id: "circulation",
    label: "Move heat and moisture",
    eyebrow: "Climate and ocean",
    explanation: "Unequal heating, pressure belts, winds, and ocean currents redistribute heat and moisture and explain regional climate effects.",
    proof: "Map chain: pressure belts and currents connect physical mechanisms with regional outcomes.",
  },
  {
    id: "synthesis",
    label: "Answer as one system",
    eyebrow: "UPSC integration",
    explanation: "A strong UPSC explanation links place, internal driver, surface process, climate or ocean effect, and one near-correct statement trap.",
    proof: "Recall chain: locate -> explain the driver -> trace the process -> map the effect -> reject the trap.",
  },
];

export const geographyDay7PortalLesson = {
  title: "Physical Geography Consolidation",
  promise:
    "Connect location, Earth structure, tectonics, landforms, climatology, and oceanography into one UPSC-ready physical-geography framework.",
  sourceSummary:
    "Promoted from the staged Week 1 consolidation pack into a compact portal-native integration visual.",
  scenes: [
    {
      id: "7-briefing",
      kind: "briefing" as const,
      title: "Begin with map language",
      objective: "Use location and scale as the entry point for integrated physical geography.",
      narration:
        "Coordinates and relative location tell you where a pattern sits. Scale and map relationships keep later physical explanations spatially precise.",
      checkpoint:
        "Student can attach one physical-geography process to a location or map relationship.",
      durationMinutes: 2,
    },
    {
      id: "7-mechanism",
      kind: "mechanism" as const,
      title: "Connect internal driver and surface change",
      objective: "Link tectonic relief creation with geomorphic modification.",
      narration:
        "Earth's layered interior and plate movement create relief. Weathering, erosion, transport, deposition, and mass wasting reshape that relief after exposure.",
      checkpoint:
        "Student can separate relief creation from relief modification.",
      durationMinutes: 3,
    },
    {
      id: "7-map",
      kind: "map" as const,
      title: "Add atmospheric and ocean circulation",
      objective: "Connect map patterns with moving heat and moisture.",
      narration:
        "Unequal heating creates pressure gradients and winds. Ocean currents redistribute heat and connect relief and circulation with regional rainfall, fog, deserts, and fisheries.",
      checkpoint:
        "Student can add one climate or ocean effect to a physical map explanation.",
      durationMinutes: 3,
    },
    {
      id: "7-trap",
      kind: "trap" as const,
      title: "Reject isolated memorization",
      objective: "Prepare for mixed UPSC statements that join multiple systems.",
      narration:
        "Integrated questions often combine two systems. Reject statements that reverse cause and effect, mix location pairs, or treat one variable as the complete explanation.",
      checkpoint:
        "Student can identify one near-correct mixed-system statement and its hidden exception.",
      durationMinutes: 2,
    },
    {
      id: "7-recap",
      kind: "recap" as const,
      title: "Speak one integrated chain",
      objective: "Generate the first weak-topic list through AI-teacher discussion.",
      narration:
        "Explain one chain: locate the pattern, name the internal or external driver, trace the process, map the climate or ocean effect, and reject one UPSC trap.",
      checkpoint:
        "Student is ready to explain one integrated chain and identify the first weak topic.",
      durationMinutes: 2,
    },
  ],
};
