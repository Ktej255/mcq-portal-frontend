export type GeographyDay22AtlasMasteryStage = {
  id: "orient" | "neighbors" | "layers" | "recall" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay22AtlasMasteryStages: GeographyDay22AtlasMasteryStage[] = [
  {
    id: "orient",
    label: "Begin with orientation",
    eyebrow: "Locate before recall",
    explanation:
      "Atlas mastery begins with direction and region. A location becomes useful only when the student can place it north, south, east, west, coastal, inland, mountain, plateau, plain, or border-side.",
    proof: "Start with the map: direction -> region -> location.",
  },
  {
    id: "neighbors",
    label: "Attach neighboring areas",
    eyebrow: "Relational map memory",
    explanation:
      "Every recurring UPSC location should carry nearby regions, states, countries, rivers, ranges, coasts, or seas. Relationship memory is more reliable than an isolated label.",
    proof: "Map chain: location -> neighbor -> physical feature -> regional context.",
  },
  {
    id: "layers",
    label: "Read layered maps",
    eyebrow: "One map, many lenses",
    explanation:
      "Revise India and world maps through layers: relief, rivers, climate, resources, biodiversity, ports, borders, and current-affairs locations. Each layer answers a different kind of question.",
    proof: "Do not memorize a label alone: attach one physical layer and one human or current link.",
  },
  {
    id: "recall",
    label: "Build quick recall",
    eyebrow: "Speed with context",
    explanation:
      "Recall becomes faster when a place is tied to cause and region. Move from location to feature, significance, current relevance, and one likely comparison instead of scanning the whole atlas.",
    proof: "Quick drill: locate -> connect -> explain -> compare.",
  },
  {
    id: "trap",
    label: "Reject nearby-location swaps",
    eyebrow: "Applied recall",
    explanation:
      "A near-correct UPSC statement often uses two nearby regions or real features and swaps their relationship. Verify direction, neighbor, layer, and significance together.",
    proof: "Recall chain: direction -> neighbor -> layer -> link -> reject the regional swap.",
  },
];

export const geographyDay22PortalLesson = {
  title: "Atlas Mastery",
  promise:
    "Convert atlas reading into exam recall through orientation, neighbors, layered maps, quick context, and nearby-location trap discipline.",
  sourceSummary:
    "Promoted from the staged Atlas, PYQ Logic, Revision pack into a compact portal-native map-recall visual.",
  scenes: [
    {
      id: "22-briefing",
      kind: "briefing" as const,
      title: "Begin with orientation",
      objective: "Place a recurring location inside one direction and region.",
      narration:
        "Atlas mastery is not memorizing every label. Begin with direction, region, and one stable location anchor before adding detail.",
      checkpoint:
        "Student can locate one recurring place through direction and region.",
      durationMinutes: 2,
    },
    {
      id: "22-mechanism",
      kind: "mechanism" as const,
      title: "Attach neighbors and layers",
      objective: "Convert an isolated label into relational map memory.",
      narration:
        "Attach neighboring states, countries, rivers, ranges, coasts, or seas. Then add one relief, river, climate, resource, biodiversity, port, border, or current-affairs layer.",
      checkpoint:
        "Student can connect one location with one neighbor, one physical feature, and one layer.",
      durationMinutes: 3,
    },
    {
      id: "22-map",
      kind: "map" as const,
      title: "Build a quick recall drill",
      objective: "Move from map location to significance without scanning the whole atlas.",
      narration:
        "Recall the location, connect its region and feature, explain why it matters, and compare one nearby place that could become a distractor.",
      checkpoint:
        "Student can run the locate-connect-explain-compare drill for one place.",
      durationMinutes: 3,
    },
    {
      id: "22-trap",
      kind: "trap" as const,
      title: "Reject regional swaps",
      objective: "Prepare for nearby-location and feature-pair traps.",
      narration:
        "A statement may use real neighboring places, rivers, ranges, ports, or biodiversity locations while swapping the relationship. Verify the complete map chain.",
      checkpoint:
        "Student can reject one near-correct nearby-location statement.",
      durationMinutes: 2,
    },
    {
      id: "22-recap",
      kind: "recap" as const,
      title: "Explain one atlas location",
      objective: "Move into discussion with one context-rich map explanation.",
      narration:
        "Choose one location. State direction, neighboring area, physical feature, human or current link, one comparison, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one atlas location and reject one regional swap.",
      durationMinutes: 2,
    },
  ],
};
