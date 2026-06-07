export type GeographyDay16SettlementsStage = {
  id: "site" | "rural" | "urban" | "morphology" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay16SettlementsStages: GeographyDay16SettlementsStage[] = [
  {
    id: "site",
    label: "Separate site and situation",
    eyebrow: "Settlement location",
    explanation:
      "Site is the exact ground occupied by a settlement. Situation is its wider relationship with rivers, routes, markets, resources, relief, and nearby regions.",
    proof: "Start cleanly: site is the place itself; situation is the wider spatial relationship.",
  },
  {
    id: "rural",
    label: "Explain rural patterns",
    eyebrow: "Village geography",
    explanation:
      "Relief, water, landholding, safety, agriculture, and community structure influence compact, dispersed, linear, and other rural settlement patterns.",
    proof: "Map chain: physical base + land use + water + safety shape rural form.",
  },
  {
    id: "urban",
    label: "Build urban hierarchy",
    eyebrow: "Function and connectivity",
    explanation:
      "Urban hierarchy moves from small towns to metropolitan regions through services, markets, administration, industry, transport, and connectivity.",
    proof: "Hierarchy check: size alone is incomplete without function, service reach, and connectivity.",
  },
  {
    id: "morphology",
    label: "Read settlement morphology",
    eyebrow: "Visible form",
    explanation:
      "Compact, linear, dispersed, radial, grid, and planned forms describe visible layout. Function explains what the settlement does, not only how it looks.",
    proof: "Trap: morphology describes shape; function describes role; hierarchy describes relative level.",
  },
  {
    id: "trap",
    label: "Reject cross-matched terms",
    eyebrow: "Applied recall",
    explanation:
      "A strong answer links one settlement with site, situation, morphology, function, hierarchy, Indian example, growth pressure, and one near-correct classification trap.",
    proof: "Recall chain: site -> situation -> morphology -> function -> hierarchy -> reject the swap.",
  },
];

export const geographyDay16PortalLesson = {
  title: "Settlements",
  promise:
    "Classify rural and urban settlements through site, situation, morphology, function, hierarchy, connectivity, and growth pressure.",
  sourceSummary:
    "Promoted from the staged Human and Economic Geography pack into a compact portal-native settlement-pattern visual.",
  scenes: [
    {
      id: "16-briefing",
      kind: "briefing" as const,
      title: "Separate site and situation",
      objective: "Use precise location language before classifying settlement form.",
      narration:
        "Site is the exact ground occupied by a settlement. Situation is its wider relation with routes, rivers, markets, resources, relief, and nearby regions.",
      checkpoint:
        "Student can distinguish one settlement site from its situation.",
      durationMinutes: 2,
    },
    {
      id: "16-mechanism",
      kind: "mechanism" as const,
      title: "Explain rural and urban patterns",
      objective: "Connect settlement form with geography, land use, services, and connectivity.",
      narration:
        "Rural patterns respond to relief, water, agriculture, landholding, and safety. Urban hierarchy grows through services, markets, administration, industry, and transport.",
      checkpoint:
        "Student can explain one rural pattern and one urban hierarchy relationship.",
      durationMinutes: 3,
    },
    {
      id: "16-map",
      kind: "map" as const,
      title: "Read morphology and function",
      objective: "Separate visible layout from settlement role and scale.",
      narration:
        "Compact, linear, dispersed, radial, grid, and planned layouts describe morphology. Function describes role, while hierarchy describes relative level and service reach.",
      checkpoint:
        "Student can classify one settlement by morphology, function, and hierarchy.",
      durationMinutes: 3,
    },
    {
      id: "16-trap",
      kind: "trap" as const,
      title: "Reject classification swaps",
      objective: "Prepare for site-situation, morphology-function, and hierarchy-scale traps.",
      narration:
        "A statement may correctly describe a settlement feature but attach it to the wrong classification term. Check what the term is actually measuring.",
      checkpoint:
        "Student can reject one near-correct settlement classification statement.",
      durationMinutes: 2,
    },
    {
      id: "16-recap",
      kind: "recap" as const,
      title: "Explain one settlement",
      objective: "Move into discussion with one complete settlement chain.",
      narration:
        "Choose one settlement example. State its site, situation, morphology, function, hierarchy, growth pressure, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one settlement and reject one classification swap.",
      durationMinutes: 2,
    },
  ],
};
