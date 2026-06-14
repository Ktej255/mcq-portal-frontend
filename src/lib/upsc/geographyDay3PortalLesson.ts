export type GeographyDay3PlateStage = {
  id: "evidence" | "layers" | "convection" | "boundaries" | "hazards";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay3PlateStages: GeographyDay3PlateStage[] = [
  {
    id: "evidence",
    label: "Read seismic evidence",
    eyebrow: "Waves reveal layers",
    explanation: "P-waves bend as material changes. S-waves stop at the liquid outer core. Earth layers are inferred from evidence, not direct observation.",
    proof: "Trap: S-waves cannot pass through liquids; P-waves can pass through solids and liquids.",
  },
  {
    id: "layers",
    label: "Separate the layers",
    eyebrow: "Structure to behavior",
    explanation: "Crust, mantle, outer core, and inner core describe internal structure. Rigid lithosphere moves over the weaker plastic asthenosphere.",
    proof: "Trap: the mantle is not a fully liquid ocean of magma.",
  },
  {
    id: "convection",
    label: "Follow internal heat",
    eyebrow: "Driver of movement",
    explanation: "Internal heat and mantle behavior create convection-style movement. This gives the plate system a physical driver.",
    proof: "Cause chain: internal heat -> mantle movement -> lithospheric plate movement.",
  },
  {
    id: "boundaries",
    label: "Compare boundaries",
    eyebrow: "Three motions",
    explanation: "Divergent boundaries move apart, convergent boundaries collide or subduct, and transform boundaries slide past each other.",
    proof: "Map cue: ridge, trench or mountain, and earthquake fault reveal different boundary settings.",
  },
  {
    id: "hazards",
    label: "Predict the pattern",
    eyebrow: "Landforms and hazards",
    explanation: "Earthquakes, volcanoes, ridges, trenches, and mountains cluster because plate-boundary processes are spatially organized.",
    proof: "Recall chain: seismic evidence -> layers -> mantle behavior -> boundaries -> landforms and hazards.",
  },
];

export const geographyDay3PortalLesson = {
  title: "Interior of Earth and Plate Movement",
  promise:
    "Move from seismic evidence to layers, mantle behavior, plate boundaries, and the map pattern of landforms and hazards.",
  sourceSummary:
    "Adapted from the portal's Earth-interior-to-plate-movement animation blueprint and the compact 20-day Geography bridge.",
  scenes: [
    {
      id: "3-briefing",
      kind: "briefing" as const,
      title: "Infer layers from waves",
      objective: "Start with evidence before naming Earth layers.",
      narration:
        "Earth interior is not directly visible. Use seismic behavior: P-waves bend as material changes, while S-waves stop at the liquid outer core.",
      checkpoint:
        "Student can explain why seismic waves are evidence for a layered Earth.",
      durationMinutes: 2,
    },
    {
      id: "3-mechanism",
      kind: "mechanism" as const,
      title: "Connect layers with movement",
      objective: "Separate structural layers from the moving plate system.",
      narration:
        "Distinguish crust, mantle, outer core, and inner core. Then place rigid lithospheric plates over the weaker plastic asthenosphere and connect internal heat with mantle movement.",
      checkpoint:
        "Student can explain why the mantle is not a fully liquid magma ocean.",
      durationMinutes: 3,
    },
    {
      id: "3-map",
      kind: "map" as const,
      title: "Compare the three boundaries",
      objective: "Turn movement direction into map-visible outcomes.",
      narration:
        "At divergent boundaries plates move apart and new crust forms. At convergent boundaries plates collide or subduct. At transform boundaries plates slide past each other and release stress.",
      checkpoint:
        "Student can compare divergent, convergent, and transform motion with one landform or hazard cue each.",
      durationMinutes: 3,
    },
    {
      id: "3-trap",
      kind: "trap" as const,
      title: "Control the plate traps",
      objective: "Correct common textbook oversimplifications.",
      narration:
        "Do not say every boundary creates volcanoes. Do not say plates float on a liquid mantle. Match the boundary setting with the correct landform and hazard pattern.",
      checkpoint:
        "Student can state one almost-correct plate statement and its exception.",
      durationMinutes: 2,
    },
    {
      id: "3-recap",
      kind: "recap" as const,
      title: "Speak the five-step chain",
      objective: "Compress the visual into an oral explanation for the AI teacher.",
      narration:
        "Explain the chain: seismic evidence, layered Earth, mantle behavior, plate movement, then clustered landforms and hazards. End with one boundary-specific trap.",
      checkpoint:
        "Student is ready to explain the evidence-to-hazard chain in their own words.",
      durationMinutes: 2,
    },
  ],
};
