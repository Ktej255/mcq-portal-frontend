export type GeographyDay25EnvironmentGeographyBridgeStage = {
  id: "biome" | "biodiversity" | "exposure" | "conservation" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay25EnvironmentGeographyBridgeStages: GeographyDay25EnvironmentGeographyBridgeStage[] = [
  {
    id: "biome",
    label: "Read the biome controls",
    eyebrow: "Climate builds the base",
    explanation:
      "Biomes emerge through temperature, rainfall, seasonality, latitude, altitude, and soil. Start with the geographic controls before naming vegetation or species.",
    proof: "Biome check: climate pattern first, ecological label second.",
  },
  {
    id: "biodiversity",
    label: "Trace biodiversity patterns",
    eyebrow: "Habitat and gradients",
    explanation:
      "Biodiversity depends on habitat, corridors, endemism, climate gradients, and human pressure. Species questions become easier when the habitat logic is mapped first.",
    proof: "Ask why a species range is plausible in that habitat.",
  },
  {
    id: "exposure",
    label: "Locate climate exposure",
    eyebrow: "Risk is spatial",
    explanation:
      "Coasts, mountains, drylands, forests, islands, and urban zones experience different climate-change pressures. Name the exposed region and the mechanism.",
    proof: "Exposure check: which geography makes the region sensitive?",
  },
  {
    id: "conservation",
    label: "Map conservation regions",
    eyebrow: "Place before policy",
    explanation:
      "Read a conservation region through habitat, species, state, river basin, mountain range, or coast before attaching a protected-area or policy label.",
    proof: "Map cue: region -> habitat -> species -> conservation response.",
  },
  {
    id: "trap",
    label: "Reject the cross-match",
    eyebrow: "UPSC statement discipline",
    explanation:
      "A statement can contain real species, habitats, protected areas, states, and climate zones while pairing them incorrectly. Verify each relationship.",
    proof: "Recall chain: biome -> habitat -> exposure -> region -> verify.",
  },
];

export const geographyDay25PortalLesson = {
  title: "Environment Geography Bridge",
  promise:
    "Connect geography with environment through biome controls, habitat logic, biodiversity patterns, climate exposure, conservation regions, and cross-match discipline.",
  sourceSummary:
    "Promoted from the staged Atlas, PYQ Logic, Revision pack into a compact portal-native biome-to-conservation visual.",
  scenes: [
    {
      id: "25-briefing",
      kind: "briefing" as const,
      title: "Begin with biome controls",
      objective: "Use climate and location as the base layer for environment questions.",
      narration:
        "Temperature, rainfall, seasonality, latitude, altitude, and soil shape biomes. Begin with those controls before naming vegetation, species, or protected areas.",
      checkpoint:
        "Student can explain one biome through its climate and location controls.",
      durationMinutes: 2,
    },
    {
      id: "25-mechanism",
      kind: "mechanism" as const,
      title: "Trace habitat and biodiversity",
      objective: "Connect species patterns with plausible ecological geography.",
      narration:
        "Use habitat, corridors, endemism, climate gradients, and human pressure to explain biodiversity distribution before accepting a species-location pair.",
      checkpoint:
        "Student can explain why one species or biodiversity pattern belongs in a region.",
      durationMinutes: 3,
    },
    {
      id: "25-map",
      kind: "map" as const,
      title: "Locate exposure and conservation",
      objective: "Read climate risk and conservation response spatially.",
      narration:
        "Compare coasts, mountains, drylands, forests, islands, and urban zones through exposure. Then attach habitat, species, state, basin, range, or coast to one conservation region.",
      checkpoint:
        "Student can locate one climate-sensitive region and one conservation map cue.",
      durationMinutes: 3,
    },
    {
      id: "25-trap",
      kind: "trap" as const,
      title: "Reject the cross-matched option",
      objective: "Prepare for near-correct environment-geography statements.",
      narration:
        "Verify species, habitat, protected area, state, and climate zone independently. Reject the statement when one relationship is cross-matched.",
      checkpoint:
        "Student can identify the precise mismatch inside one tempting environment option.",
      durationMinutes: 2,
    },
    {
      id: "25-recap",
      kind: "recap" as const,
      title: "Explain one environment-geography link",
      objective: "Move into discussion with one complete map-linked explanation.",
      narration:
        "Choose one biome, habitat, species, climate-risk region, or conservation area. State the geographic control, map cue, ecological link, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one environment question through geography.",
      durationMinutes: 2,
    },
  ],
};
