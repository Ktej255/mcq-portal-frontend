export type GeographyDay14IndiaMapDrillStage = {
  id: "relief" | "drainage" | "climate" | "production" | "repair";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay14IndiaMapDrillStages: GeographyDay14IndiaMapDrillStage[] = [
  {
    id: "relief",
    label: "Lay down relief",
    eyebrow: "Blank-map base",
    explanation:
      "Begin every India map drill with the Himalayas, plains, plateau, desert, coasts, and islands. Relief is the base layer behind drainage, rainfall, soils, resources, settlement, and risk.",
    proof: "Start with relief: it is the map layer that explains the later layers.",
  },
  {
    id: "drainage",
    label: "Trace river systems",
    eyebrow: "Water pathways",
    explanation:
      "Add Himalayan and peninsular drainage through source, slope, basin, direction, tributaries, and outlet. Rivers make the relief layer operational.",
    proof: "Map chain: relief -> slope -> river path -> basin -> outlet -> use or risk.",
  },
  {
    id: "climate",
    label: "Add climate regions",
    eyebrow: "Rainfall and season",
    explanation:
      "Overlay monsoon branches, windward uplift, rain shadow, western disturbances, coastal moderation, interior range, and climate-region contrasts.",
    proof: "Trap: the same rainfall mechanism cannot be copied into every region or season.",
  },
  {
    id: "production",
    label: "Connect productive belts",
    eyebrow: "Soils, resources, crops",
    explanation:
      "Layer soil families, vegetation response, mineral belts, energy zones, crop suitability, irrigation gains, and sustainability pressure onto the physical base.",
    proof: "Integrated recall: physical base -> productive use -> constraint -> environment link.",
  },
  {
    id: "repair",
    label: "Repair weak locations",
    eyebrow: "Mixed-map command",
    explanation:
      "Close by tagging the weakest five locations. Each repair card needs a map cue, cause, linked layer, and one almost-correct statement trap.",
    proof: "Recall chain: locate -> layer -> cause -> linked effect -> reject the mixed-region trap.",
  },
];

export const geographyDay14PortalLesson = {
  title: "India Map Drill",
  promise:
    "Convert two weeks of Indian geography into layered blank-map recall, integrated cause chains, weak-location repair, and mixed MCQ readiness.",
  sourceSummary:
    "Promoted from the staged Week 2 India Map Command consolidation pack into a compact portal-native layered map drill.",
  scenes: [
    {
      id: "14-briefing",
      kind: "briefing" as const,
      title: "Begin with relief",
      objective: "Build the India blank-map base before adding facts.",
      narration:
        "Mark the Himalayas, plains, plateau, desert, coasts, and islands first. Relief explains the later drainage, climate, soil, resource, crop, and risk layers.",
      checkpoint:
        "Student can state why relief is the first blank-map layer.",
      durationMinutes: 2,
    },
    {
      id: "14-mechanism",
      kind: "mechanism" as const,
      title: "Layer drainage and climate",
      objective: "Connect slope and river systems with rainfall and regional climate.",
      narration:
        "Trace drainage through source, slope, basin, direction, and outlet. Then overlay monsoon branches, uplift, rain shadow, western disturbances, and coastal or interior contrasts.",
      checkpoint:
        "Student can explain one relief-river-climate relationship.",
      durationMinutes: 3,
    },
    {
      id: "14-map",
      kind: "map" as const,
      title: "Add productive geography",
      objective: "Attach soils, vegetation, resources, agriculture, and sustainability pressure.",
      narration:
        "Add soil and vegetation patterns, mineral and energy belts, crop suitability, irrigation gains, and one pressure such as depletion, salinity, erosion, or degradation.",
      checkpoint:
        "Student can build one physical-base-to-productive-use chain.",
      durationMinutes: 3,
    },
    {
      id: "14-trap",
      kind: "trap" as const,
      title: "Reject mixed-region traps",
      objective: "Prepare for false statements made from individually correct facts.",
      narration:
        "UPSC can combine a correct river, rainfall feature, soil, crop, mineral, or state example from different regions into one false statement. Verify the complete map chain.",
      checkpoint:
        "Student can reject one statement that mixes correct facts from different regions.",
      durationMinutes: 2,
    },
    {
      id: "14-recap",
      kind: "recap" as const,
      title: "Generate five repair cards",
      objective: "Move into discussion with an honest weak-location list.",
      narration:
        "Choose the weakest five locations. For each one, state the map cue, cause, linked layer, and one near-correct trap before entering mixed MCQs.",
      checkpoint:
        "Student is ready to explain one integrated India map chain and name the first weak location.",
      durationMinutes: 2,
    },
  ],
};
