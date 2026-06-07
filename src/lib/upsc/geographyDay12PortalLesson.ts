export type GeographyDay12SoilsVegetationStage = {
  id: "formation" | "soils" | "vegetation" | "pressure" | "conserve";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay12SoilsVegetationStages: GeographyDay12SoilsVegetationStage[] = [
  {
    id: "formation",
    label: "Build soil from factors",
    eyebrow: "Formation framework",
    explanation:
      "Parent material, climate, relief, drainage, organisms, and time work together. Start with formation factors before memorizing soil-color and crop pairs.",
    proof: "Method: formation factors -> soil property -> regional distribution -> crop or forest link -> limitation.",
  },
  {
    id: "soils",
    label: "Map major soil families",
    eyebrow: "India distribution",
    explanation:
      "Alluvial, black, red-yellow, laterite, desert, mountain, and saline soils carry different regional patterns, properties, crop advantages, and limitations.",
    proof: "Trap: one soil name is incomplete without region, property, crop link, and limitation.",
  },
  {
    id: "vegetation",
    label: "Connect vegetation response",
    eyebrow: "Climate and relief",
    explanation:
      "Rainfall, temperature, altitude, soil, and human pressure influence forest distribution. Vegetation is not a separate list; it responds to the physical setting.",
    proof: "Map chain: rainfall + temperature + altitude + soil shape vegetation pattern.",
  },
  {
    id: "pressure",
    label: "Add degradation pressure",
    eyebrow: "Geography-environment bridge",
    explanation:
      "Erosion, salinity, desertification, forest degradation, overuse, and drainage stress connect geography with environment and conservation questions.",
    proof: "UPSC trap: productivity and degradation can coexist in the same region under different management conditions.",
  },
  {
    id: "conserve",
    label: "Match use with conservation",
    eyebrow: "Applied recall",
    explanation:
      "A strong answer links one formation factor, region, soil or vegetation type, crop or species association, limitation, and practical conservation response.",
    proof: "Recall chain: factor -> region -> soil or forest -> use -> limitation -> conservation response.",
  },
];

export const geographyDay12PortalLesson = {
  title: "Soils and Vegetation",
  promise:
    "Connect soil and vegetation distribution with parent material, climate, relief, drainage, crops, degradation, and conservation.",
  sourceSummary:
    "Promoted from the staged India Map Command pack into a compact portal-native geography-to-environment bridge visual.",
  scenes: [
    {
      id: "12-briefing",
      kind: "briefing" as const,
      title: "Begin with soil-formation factors",
      objective: "Build soil types from formation logic instead of memorized color lists.",
      narration:
        "Parent material, climate, relief, drainage, organisms, and time work together. Soil properties emerge from that combined setting.",
      checkpoint:
        "Student can name the main soil-formation factors and connect one factor with one property.",
      durationMinutes: 2,
    },
    {
      id: "12-mechanism",
      kind: "mechanism" as const,
      title: "Map soil families and vegetation response",
      objective: "Connect regional soil distribution with crop and forest patterns.",
      narration:
        "Map major soil families through region, property, crop advantage, and limitation. Then add vegetation as a response to rainfall, temperature, altitude, soil, and human pressure.",
      checkpoint:
        "Student can explain one soil family and one vegetation type through their physical setting.",
      durationMinutes: 3,
    },
    {
      id: "12-map",
      kind: "map" as const,
      title: "Add degradation and conservation",
      objective: "Bridge physical geography with environment questions.",
      narration:
        "Soil erosion, salinity, desertification, forest degradation, overuse, and drainage stress alter regional outcomes. Attach one conservation response to one pressure.",
      checkpoint:
        "Student can connect one regional degradation pressure with a practical conservation response.",
      durationMinutes: 3,
    },
    {
      id: "12-trap",
      kind: "trap" as const,
      title: "Reject cross-matched pairs",
      objective: "Prepare for soil-color, crop, rainfall-zone, forest, and state-example traps.",
      narration:
        "A statement may use a correct soil or forest feature with the wrong crop, state, rainfall zone, or limitation. Check the complete relationship before accepting the pair.",
      checkpoint:
        "Student can reject one near-correct soil-location-crop or vegetation-region pair.",
      durationMinutes: 2,
    },
    {
      id: "12-recap",
      kind: "recap" as const,
      title: "Explain one soil or forest relationship",
      objective: "Move into AI-teacher discussion with one applied geography-environment chain.",
      narration:
        "Choose one soil or vegetation type. State the formation or control factor, region, crop or species link, limitation, conservation issue, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one geography-environment chain and reject one swapped pair.",
      durationMinutes: 2,
    },
  ],
};
