export type GeographyDay4GeomorphicStage = {
  id: "exposure" | "weathering" | "erosion" | "deposition" | "slope";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay4GeomorphicStages: GeographyDay4GeomorphicStage[] = [
  {
    id: "exposure",
    label: "Expose the rock",
    eyebrow: "Relief meets climate",
    explanation: "Uplifted rock enters the external-process system when sunlight, rainfall, temperature change, organisms, and gravity begin acting on it.",
    proof: "Start with exposed relief: exogenic processes reshape land after uplift creates it.",
  },
  {
    id: "weathering",
    label: "Break rock in place",
    eyebrow: "Weathering",
    explanation: "Physical, chemical, and biological weathering weaken rock where it stands. Climate and organisms change which process dominates.",
    proof: "Trap: weathering is breakdown in place; it does not require removal.",
  },
  {
    id: "erosion",
    label: "Remove and transport",
    eyebrow: "Erosion",
    explanation: "Water, wind, ice, and waves remove loosened material and transport it. The moving agent matters for the resulting landform.",
    proof: "Cause chain: weathering supplies material; erosion removes and transports it.",
  },
  {
    id: "deposition",
    label: "Deposit when energy falls",
    eyebrow: "Rebuilding relief",
    explanation: "When a transporting agent loses energy, sediment settles and creates depositional landforms such as fans, floodplains, or beaches.",
    proof: "Trap: deposition is not breakdown; it is settling after transport loses energy.",
  },
  {
    id: "slope",
    label: "Read slope failure",
    eyebrow: "Mass wasting",
    explanation: "Gravity moves material downslope. Water saturation, slope angle, earthquake shaking, or undercutting can trigger landslides and other mass movements.",
    proof: "Recall chain: exposure -> weathering -> erosion and transport -> deposition; gravity can move slopes suddenly.",
  },
];

export const geographyDay4PortalLesson = {
  title: "Geomorphic Processes",
  promise:
    "Explain how exposed rock becomes weathered material, transported sediment, depositional landforms, and slope-failure risk.",
  sourceSummary:
    "Adapted from the portal's weathering-erosion-mass-wasting animation blueprint and the compact 30-day Geography foundation.",
  scenes: [
    {
      id: "4-briefing",
      kind: "briefing" as const,
      title: "Expose relief to external forces",
      objective: "Place geomorphic processes after uplift and before landforms.",
      narration:
        "Internal forces create relief. Once rock is exposed, sunlight, rainfall, temperature change, organisms, and gravity begin reshaping the surface.",
      checkpoint:
        "Student can distinguish relief creation from later denudation.",
      durationMinutes: 2,
    },
    {
      id: "4-mechanism",
      kind: "mechanism" as const,
      title: "Separate weathering from erosion",
      objective: "Build the core process distinction before examples.",
      narration:
        "Weathering breaks rock in place through physical, chemical, or biological action. Erosion begins when an agent removes and transports loosened material.",
      checkpoint:
        "Student can explain weathering in place and erosion as removal plus transport.",
      durationMinutes: 3,
    },
    {
      id: "4-map",
      kind: "map" as const,
      title: "Follow sediment to deposition",
      objective: "Connect agent energy with depositional landforms.",
      narration:
        "Water, wind, ice, and waves move sediment. When energy falls, material settles and builds a fan, floodplain, beach, or another depositional form.",
      checkpoint:
        "Student can connect one agent with erosion, transport, and deposition.",
      durationMinutes: 3,
    },
    {
      id: "4-trap",
      kind: "trap" as const,
      title: "Add gravity and slope risk",
      objective: "Connect denudation with landslide logic.",
      narration:
        "Mass wasting is downslope movement under gravity. Water saturation, steep slope, shaking, or undercutting can trigger sudden movement.",
      checkpoint:
        "Student can separate gravity-driven mass wasting from erosion by a transporting agent.",
      durationMinutes: 2,
    },
    {
      id: "4-recap",
      kind: "recap" as const,
      title: "Speak the process chain",
      objective: "Compress the sequence for AI-teacher discussion.",
      narration:
        "Explain the chain: uplift exposes rock, weathering breaks it in place, erosion removes and transports it, deposition settles it, and gravity can fail slopes suddenly.",
      checkpoint:
        "Student is ready to explain the denudation sequence and one UPSC vocabulary trap.",
      durationMinutes: 2,
    },
  ],
};
