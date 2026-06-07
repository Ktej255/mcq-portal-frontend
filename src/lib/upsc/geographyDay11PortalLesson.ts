export type GeographyDay11ClimateRegionsStage = {
  id: "controls" | "rainfall" | "shadow" | "winter" | "regions";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay11ClimateRegionsStages: GeographyDay11ClimateRegionsStage[] = [
  {
    id: "controls",
    label: "Read the climate controls",
    eyebrow: "Regional framework",
    explanation:
      "Latitude, altitude, relief, distance from sea, pressure systems, and winds work together. Start with controls before memorizing rainfall totals or temperature values.",
    proof: "Method: locate the region -> identify controls -> explain rainfall and temperature -> reject the mismatch.",
  },
  {
    id: "rainfall",
    label: "Trace rainfall corridors",
    eyebrow: "Monsoon branches",
    explanation:
      "Moisture branches meet relief barriers and lose rain unevenly. Windward slopes, the northeast pathway, and the Himalayan barrier create strong regional contrasts.",
    proof: "Map chain: moisture path + relief barrier + uplift explain rainfall concentration.",
  },
  {
    id: "shadow",
    label: "Explain nearby contrasts",
    eyebrow: "Rain-shadow logic",
    explanation:
      "A mountain barrier can produce a wet windward side and a drier leeward side within a short distance. Nearby places can therefore carry sharply different climate signatures.",
    proof: "Trap: proximity alone does not guarantee similar rainfall when relief changes the wind path.",
  },
  {
    id: "winter",
    label: "Add winter disturbance",
    eyebrow: "Seasonal exception",
    explanation:
      "Western disturbances bring winter precipitation to northwest India and snow to Himalayan regions. They belong to a different seasonal pathway from the southwest monsoon.",
    proof: "UPSC trap: western disturbances are not the source of India's southwest monsoon rainfall.",
  },
  {
    id: "regions",
    label: "Compare climate regions",
    eyebrow: "Temperature and rainfall",
    explanation:
      "Coastal, interior, desert, plateau, mountain, and rain-shadow regions differ because their controls differ. Compare one map location, rainfall season, temperature range, and hidden exception.",
    proof: "Recall chain: control factors -> rainfall season -> temperature range -> map example -> regional trap.",
  },
];

export const geographyDay11PortalLesson = {
  title: "Climate Regions of India",
  promise:
    "Explain why nearby Indian regions can receive sharply different rainfall and temperature patterns through relief, winds, altitude, latitude, distance from sea, and disturbances.",
  sourceSummary:
    "Promoted from the staged India Map Command climate pack into a compact portal-native regional-comparison visual.",
  scenes: [
    {
      id: "11-briefing",
      kind: "briefing" as const,
      title: "Begin with regional climate controls",
      objective: "Organize Indian climate through interacting controls instead of isolated facts.",
      narration:
        "Latitude, altitude, relief, distance from sea, pressure systems, and winds work together. Start with the control framework before memorizing regional totals.",
      checkpoint:
        "Student can name the main controls that create regional climate variation in India.",
      durationMinutes: 2,
    },
    {
      id: "11-mechanism",
      kind: "mechanism" as const,
      title: "Trace moisture and relief",
      objective: "Connect monsoon pathways with windward rain and leeward rain shadow.",
      narration:
        "Moisture-bearing winds meet relief barriers. Orographic uplift concentrates rain on windward slopes while descending air leaves leeward regions drier.",
      checkpoint:
        "Student can explain why nearby windward and leeward places may receive very different rainfall.",
      durationMinutes: 3,
    },
    {
      id: "11-map",
      kind: "map" as const,
      title: "Add winter precipitation and temperature range",
      objective: "Compare seasonal pathways and maritime versus continental effects.",
      narration:
        "Western disturbances bring winter precipitation to northwest India and Himalayan snow. Coastal influence moderates temperature range, while interior, desert, plateau, and mountain settings differ.",
      checkpoint:
        "Student can connect one winter precipitation region and one temperature-range contrast with its controlling factor.",
      durationMinutes: 3,
    },
    {
      id: "11-trap",
      kind: "trap" as const,
      title: "Reject regional mismatches",
      objective: "Prepare for rainfall amount, season, wind-source, and location traps.",
      narration:
        "A climate statement can use a correct mechanism with the wrong region or season. Separate rainfall source, relief relationship, temperature control, and map example before accepting a pair.",
      checkpoint:
        "Student can reject one near-correct climate-region statement and identify the mismatch.",
      durationMinutes: 2,
    },
    {
      id: "11-recap",
      kind: "recap" as const,
      title: "Explain one climate region",
      objective: "Move into AI-teacher discussion with one map-backed regional comparison.",
      narration:
        "Choose one Indian climate region. Name its controls, rainfall season, temperature pattern, one map example, and one trap involving a disturbance, rain shadow, or maritime effect.",
      checkpoint:
        "Student is ready to explain one region and compare it with a nearby contrasting region.",
      durationMinutes: 2,
    },
  ],
};
