export type GeographyDay21HumanGeographyConsolidationStage = {
  id: "people" | "settlements" | "economy" | "networks" | "repair";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay21HumanGeographyConsolidationStages: GeographyDay21HumanGeographyConsolidationStage[] = [
  {
    id: "people",
    label: "Begin with people and place",
    eyebrow: "Population pattern",
    explanation:
      "Population distribution reflects relief, water, climate, safety, jobs, services, and historical movement. Begin the integrated answer with where people concentrate and why.",
    proof: "Start with the map: people -> physical base -> opportunity or constraint.",
  },
  {
    id: "settlements",
    label: "Connect settlements",
    eyebrow: "Site and function",
    explanation:
      "Settlements translate population patterns into rural forms, towns, cities, service centers, and urban hierarchies. Site, situation, function, and connectivity work together.",
    proof: "Trap: settlement pattern, settlement function, and urban hierarchy are related but not interchangeable.",
  },
  {
    id: "economy",
    label: "Trace the activity chain",
    eyebrow: "Sector transition",
    explanation:
      "Resources, agriculture, industry, services, knowledge work, and trade form overlapping activity chains. Structural change alters jobs, settlement, and regional opportunity.",
    proof: "Explain one chain: input -> activity -> job pattern -> settlement effect.",
  },
  {
    id: "networks",
    label: "Add networks and regions",
    eyebrow: "Integrated geography",
    explanation:
      "Transport, ports, corridors, industrial clusters, markets, policy, and governance reshape regional development. Physical location and human decision logic must remain connected.",
    proof: "Map chain: network -> industry or service -> regional gain -> pressure or disparity.",
  },
  {
    id: "repair",
    label: "Generate repair cards",
    eyebrow: "Weak-link recall",
    explanation:
      "An integrated answer is only as strong as its weakest link. Record the missing indicator, example, map link, or mismatch trap before moving into mixed MCQs.",
    proof: "Recall chain: people -> settlement -> economy -> network -> region -> repair the weak link.",
  },
];

export const geographyDay21PortalLesson = {
  title: "Human Geography Consolidation",
  promise:
    "Integrate population, settlements, economic activity, connectivity, industry, regional development, and weak-link repair in one map-cause framework.",
  sourceSummary:
    "Promoted from the staged Human and Economic Geography pack into a compact portal-native Week 3 consolidation visual.",
  scenes: [
    {
      id: "21-briefing",
      kind: "briefing" as const,
      title: "Begin with people and place",
      objective: "Connect population distribution with opportunity and constraint.",
      narration:
        "People concentrate through relief, water, climate, safety, jobs, services, and historical movement. Begin with the map before naming the settlement outcome.",
      checkpoint:
        "Student can connect one population pattern with one physical base and one human factor.",
      durationMinutes: 2,
    },
    {
      id: "21-mechanism",
      kind: "mechanism" as const,
      title: "Connect settlement and activity",
      objective: "Trace how jobs and services reshape settlement patterns.",
      narration:
        "Rural forms, towns, cities, service centers, and urban hierarchies interact with agriculture, industry, services, knowledge work, and trade.",
      checkpoint:
        "Student can explain one activity chain and its settlement effect.",
      durationMinutes: 3,
    },
    {
      id: "21-map",
      kind: "map" as const,
      title: "Add networks, industry, and region",
      objective: "Integrate transport, cluster, policy, and regional-development logic.",
      narration:
        "Corridors, ports, markets, industrial clusters, policy, and governance alter access, specialization, growth, pressure, and disparity.",
      checkpoint:
        "Student can trace one network-to-region chain with one gain and one pressure.",
      durationMinutes: 3,
    },
    {
      id: "21-trap",
      kind: "trap" as const,
      title: "Reject integrated mismatches",
      objective: "Prepare for mixed-sector, location, indicator, and policy traps.",
      narration:
        "A statement can combine correct population, settlement, sector, corridor, industry, and policy facts in the wrong relationship. Verify the full chain.",
      checkpoint:
        "Student can reject one near-correct mixed human-geography statement.",
      durationMinutes: 2,
    },
    {
      id: "21-recap",
      kind: "recap" as const,
      title: "Repair the weakest link",
      objective: "Move into discussion with one integrated explanation and one repair card.",
      narration:
        "Choose one chain. State people, settlement, economic activity, network or industry, regional outcome, pressure, weak link, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one integrated chain and name one weak-link repair.",
      durationMinutes: 2,
    },
  ],
};
