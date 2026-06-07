export type GeographyDay19IndustryLocationStage = {
  id: "classic" | "modern" | "regions" | "clusters" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay19IndustryLocationStages: GeographyDay19IndustryLocationStage[] = [
  {
    id: "classic",
    label: "Begin with classical factors",
    eyebrow: "Input and market",
    explanation:
      "Traditional industrial location weighs raw material, power, water, labor, transport, market, and capital. The dominant cost decides which factor pulls the plant most strongly.",
    proof: "Start with the question: which factor creates the strongest location pull for this industry?",
  },
  {
    id: "modern",
    label: "Add modern factors",
    eyebrow: "Skills and networks",
    explanation:
      "Modern industries also follow skilled labor, innovation, data, logistics, policy support, and global value chains. Weightless inputs can change the location logic.",
    proof: "Trap: every industry is not tied to bulky raw material or coalfield proximity.",
  },
  {
    id: "regions",
    label: "Read old industrial regions",
    eyebrow: "Historical geography",
    explanation:
      "Older industrial regions often reflect coal, iron ore, railways, ports, water, and colonial-market links. Historical infrastructure can preserve a region after its original advantage weakens.",
    proof: "Map chain: resource base -> transport link -> industry -> old industrial region.",
  },
  {
    id: "clusters",
    label: "Explain new clusters",
    eyebrow: "Changing logic",
    explanation:
      "New clusters can form around services, electronics, automobiles, petrochemicals, or IT through skills, suppliers, ports, highways, finance, policy, and agglomeration benefits.",
    proof: "Compare one old region with one new cluster before answering a location question.",
  },
  {
    id: "trap",
    label: "Reject factor mismatches",
    eyebrow: "Applied recall",
    explanation:
      "A near-correct UPSC statement may pair a real industry with the wrong dominant factor, region, input, port link, or cluster advantage. Test the complete location chain.",
    proof: "Recall chain: industry -> dominant factor -> region -> network -> reject the mismatch.",
  },
];

export const geographyDay19PortalLesson = {
  title: "Industry Location",
  promise:
    "Explain industrial location through classical factors, modern factors, old regions, new clusters, map logic, and factor-example discipline.",
  sourceSummary:
    "Promoted from the staged Human and Economic Geography pack into a compact portal-native industry-location visual.",
  scenes: [
    {
      id: "19-briefing",
      kind: "briefing" as const,
      title: "Begin with the dominant factor",
      objective: "Explain why one industrial factor pulls a plant toward a location.",
      narration:
        "Raw material, power, water, labor, transport, market, and capital do not pull equally. Start with the factor that most strongly changes production cost or access.",
      checkpoint:
        "Student can identify the dominant classical factor for one industry.",
      durationMinutes: 2,
    },
    {
      id: "19-mechanism",
      kind: "mechanism" as const,
      title: "Add modern location logic",
      objective: "Compare resource pull with skill, data, logistics, policy, and value-chain pull.",
      narration:
        "Modern industry can follow skilled labor, innovation, data, supplier networks, logistics, policy, and global value chains. The strongest pull depends on the industry.",
      checkpoint:
        "Student can explain why a modern cluster may not follow a coalfield or raw-material base.",
      durationMinutes: 3,
    },
    {
      id: "19-map",
      kind: "map" as const,
      title: "Compare old regions and new clusters",
      objective: "Connect changing factors with changing industrial geography.",
      narration:
        "Old regions often preserve coal, ore, rail, port, or colonial-market geography. New clusters add highways, airports, skills, suppliers, finance, policy, and agglomeration.",
      checkpoint:
        "Student can compare one old industrial region with one newer cluster.",
      durationMinutes: 3,
    },
    {
      id: "19-trap",
      kind: "trap" as const,
      title: "Reject factor-example mismatches",
      objective: "Prepare for near-correct industry, region, and location-factor traps.",
      narration:
        "A statement may use a real industry and a real factor while connecting them incorrectly. Verify the dominant factor, region, network, and changing context together.",
      checkpoint:
        "Student can reject one old-factor and new-cluster mismatch.",
      durationMinutes: 2,
    },
    {
      id: "19-recap",
      kind: "recap" as const,
      title: "Explain one industrial location chain",
      objective: "Move into discussion with one factor-to-region explanation.",
      narration:
        "Choose one industry. State its dominant factor, support factors, region, network, changing context, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one industry-location chain and reject one mismatch.",
      durationMinutes: 2,
    },
  ],
};
