export type GeographyDay8IndiaReliefStage = {
  id: "frame" | "himalayas" | "plains" | "plateau" | "edges";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay8IndiaReliefStages: GeographyDay8IndiaReliefStage[] = [
  {
    id: "frame",
    label: "Read the relief frame",
    eyebrow: "India map command",
    explanation:
      "Treat India physiography as one connected relief framework. Location, height, slope, and coastline shape the later river, climate, soil, agriculture, resource, and hazard patterns.",
    proof: "Start with the base layer: relief controls the map logic behind many Indian geography questions.",
  },
  {
    id: "himalayas",
    label: "Anchor the Himalayas",
    eyebrow: "Northern mountain system",
    explanation:
      "The young fold mountains form a high northern arc. They influence river origin, monsoon uplift, snow and glacier storage, passes, earthquakes, and landslide exposure.",
    proof: "Trap: the Himalayas are not only a boundary; they also shape drainage, climate, and hazard risk.",
  },
  {
    id: "plains",
    label: "Trace the northern plains",
    eyebrow: "Depositional corridor",
    explanation:
      "The Indus-Ganga-Brahmaputra plains are built by alluvium. Low relief, fertile soils, dense settlement, irrigation potential, shifting channels, and flood risk belong to the same depositional story.",
    proof: "Map chain: sediment deposition creates fertile plains while also preserving flood vulnerability.",
  },
  {
    id: "plateau",
    label: "Read the plateau core",
    eyebrow: "Ancient peninsular block",
    explanation:
      "The plateau is an old, stable block with mineral belts, dissected uplands, escarpments, and a general eastward river slope. Its hard-rock structure differs sharply from the young alluvial plains.",
    proof: "Trap: plateau rivers and resources follow slope and geology; they do not copy Himalayan river behavior.",
  },
  {
    id: "edges",
    label: "Connect desert, coasts, and islands",
    eyebrow: "Edge systems",
    explanation:
      "The Thar desert, western and eastern coastal plains, and island groups complete the relief map. Each edge changes rainfall, ports, deltas, coral or volcanic settings, and disaster exposure.",
    proof: "Recall chain: locate relief zone -> explain process -> connect one use or risk -> reject the mixed-location trap.",
  },
];

export const geographyDay8PortalLesson = {
  title: "India Physiography",
  promise:
    "Read India relief as the base layer behind rivers, monsoon, soils, agriculture, resources, settlement, and disaster risk.",
  sourceSummary:
    "Promoted from the staged India Map Command pack into a compact portal-native relief map visual.",
  scenes: [
    {
      id: "8-briefing",
      kind: "briefing" as const,
      title: "Begin with the India relief frame",
      objective: "Use relief zones as the organizing map layer for Indian geography.",
      narration:
        "India physiography becomes easier when you read location, height, slope, and coastline as one base layer instead of memorizing disconnected regions.",
      checkpoint:
        "Student can state why relief is the foundation for later river, monsoon, soil, agriculture, resource, and hazard questions.",
      durationMinutes: 2,
    },
    {
      id: "8-mechanism",
      kind: "mechanism" as const,
      title: "Contrast young mountains, plains, and plateau",
      objective: "Separate tectonic, depositional, and ancient-block relief logic.",
      narration:
        "The young Himalayas influence drainage, climate, and hazards. Alluvial deposition builds the northern plains. The older peninsular block organizes mineral belts, escarpments, and river slope.",
      checkpoint:
        "Student can contrast the Himalayas, northern plains, and peninsular plateau through one process each.",
      durationMinutes: 3,
    },
    {
      id: "8-map",
      kind: "map" as const,
      title: "Add desert, coasts, and islands",
      objective: "Complete the India relief map with edge systems.",
      narration:
        "Place the Thar desert in the northwest, compare the narrow western and broader eastern coastal plains, and attach island groups to their distinct settings.",
      checkpoint:
        "Student can locate one desert, coast, or island relationship and explain why it matters.",
      durationMinutes: 3,
    },
    {
      id: "8-trap",
      kind: "trap" as const,
      title: "Reject mixed-location statements",
      objective: "Prepare for state, boundary, relief, climate, and river pair-matching traps.",
      narration:
        "UPSC often mixes a correct physiographic idea with the wrong state, boundary, river behavior, or climate consequence. Separate the relief zone from its effect before accepting the pair.",
      checkpoint:
        "Student can identify one near-correct India physiography statement and its hidden location error.",
      durationMinutes: 2,
    },
    {
      id: "8-recap",
      kind: "recap" as const,
      title: "Explain one relief-to-risk chain",
      objective: "Move into AI-teacher discussion with one map-backed explanation.",
      narration:
        "Choose one relief division. State its map location, explain the process behind it, connect one river or climate effect, add one economic use or risk, and reject one UPSC trap.",
      checkpoint:
        "Student is ready to explain one India relief division through map, mechanism, consequence, and trap.",
      durationMinutes: 2,
    },
  ],
};
