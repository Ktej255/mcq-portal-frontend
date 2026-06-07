export type GeographyDay9DrainageStage = {
  id: "frame" | "himalayan" | "peninsular" | "outlets" | "traps";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay9DrainageStages: GeographyDay9DrainageStage[] = [
  {
    id: "frame",
    label: "Build the drainage frame",
    eyebrow: "India map command",
    explanation:
      "Read every river through source, relief, slope, basin, tributaries, state path, and outlet. This turns river lists into one repeatable map method.",
    proof: "Start with the method: source -> slope -> basin -> tributary -> outlet -> consequence.",
  },
  {
    id: "himalayan",
    label: "Trace Himalayan rivers",
    eyebrow: "Young northern systems",
    explanation:
      "Indus, Ganga, and Brahmaputra systems are largely snow-rain fed, perennial, sediment-rich, and linked with broad plains, shifting channels, erosion, floods, and deposition.",
    proof: "Map chain: young relief and high sediment load help explain plains, floods, and changing channels.",
  },
  {
    id: "peninsular",
    label: "Compare plateau rivers",
    eyebrow: "Older peninsular systems",
    explanation:
      "Many peninsular rivers depend more strongly on rainfall and plateau slope. East-flowing systems commonly build deltas, while important west-flowing systems use rift-valley routes and estuaries.",
    proof: "Trap: do not apply one east-flowing-delta rule mechanically to every peninsular river.",
  },
  {
    id: "outlets",
    label: "Connect outlets and effects",
    eyebrow: "River consequence map",
    explanation:
      "Drainage behavior shapes irrigation, groundwater recharge, erosion, flood risk, delta agriculture, estuaries, wetlands, and settlement. Outlet logic converts a map line into a real geography answer.",
    proof: "Answer chain: river behavior -> outlet pattern -> one use or risk -> one regional example.",
  },
  {
    id: "traps",
    label: "Reject tributary traps",
    eyebrow: "UPSC statement logic",
    explanation:
      "Pair-matching questions often swap source states, left-bank and right-bank tributaries, east-flowing and west-flowing rivers, deltas, estuaries, or outlets. Trace direction before judging the pair.",
    proof: "Recall chain: locate source -> face downstream -> place tributary -> trace outlet -> reject the swapped pair.",
  },
];

export const geographyDay9PortalLesson = {
  title: "Indian Drainage",
  promise:
    "Explain Indian river behavior through origin, slope, basin, tributaries, state path, outlet, and one UPSC map trap.",
  sourceSummary:
    "Promoted from the staged India Map Command drainage pack into a compact portal-native river-system visual.",
  scenes: [
    {
      id: "9-briefing",
      kind: "briefing" as const,
      title: "Begin with the drainage method",
      objective: "Use one repeatable map sequence instead of memorizing river lists.",
      narration:
        "Trace every river through source, relief, slope, basin, tributaries, state path, outlet, and consequence. The same frame works for Himalayan and peninsular systems.",
      checkpoint:
        "Student can state the source-to-outlet sequence for reading an Indian river system.",
      durationMinutes: 2,
    },
    {
      id: "9-mechanism",
      kind: "mechanism" as const,
      title: "Contrast Himalayan and peninsular behavior",
      objective: "Separate snow-rain-fed young systems from older plateau-controlled systems.",
      narration:
        "Himalayan systems are largely perennial and sediment-rich. Many peninsular systems depend more strongly on rainfall and plateau slope, so their seasonal behavior and outlets differ.",
      checkpoint:
        "Student can explain why Himalayan and peninsular rivers do not behave identically.",
      durationMinutes: 3,
    },
    {
      id: "9-map",
      kind: "map" as const,
      title: "Attach basin, tributary, and outlet",
      objective: "Convert river names into spatial relationships.",
      narration:
        "Add one basin, one tributary, the states crossed, and the outlet. Connect the map with a delta, estuary, floodplain, irrigation, or erosion consequence.",
      checkpoint:
        "Student can trace one Indian river system through a basin relationship and its outlet.",
      durationMinutes: 3,
    },
    {
      id: "9-trap",
      kind: "trap" as const,
      title: "Reject swapped pairs",
      objective: "Prepare for tributary, source-state, direction, delta, and estuary traps.",
      narration:
        "When a tributary pair appears, face downstream before deciding left or right bank. When an outlet pair appears, trace flow direction before deciding delta or estuary.",
      checkpoint:
        "Student can reject one near-correct river or tributary pair by tracing direction.",
      durationMinutes: 2,
    },
    {
      id: "9-recap",
      kind: "recap" as const,
      title: "Explain one river end to end",
      objective: "Move into AI-teacher discussion with one map-backed river explanation.",
      narration:
        "Choose one river system. State its source, slope, basin, tributary relationship, state path, outlet, one use or risk, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one river system from source to outlet and reject one swapped pair.",
      durationMinutes: 2,
    },
  ],
};
