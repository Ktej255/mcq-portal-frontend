export type GeographyDay20RegionalDevelopmentStage = {
  id: "disparity" | "planning" | "urban" | "governance" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay20RegionalDevelopmentStages: GeographyDay20RegionalDevelopmentStage[] = [
  {
    id: "disparity",
    label: "Begin with spatial inequality",
    eyebrow: "Uneven geography",
    explanation:
      "Regional development differs because resource base, location, connectivity, human capital, and institutions differ. Development is a spatial pattern, not one national average.",
    proof: "Begin with the map: where is the gap, which indicator shows it, and what creates it?",
  },
  {
    id: "planning",
    label: "Choose the planning region",
    eyebrow: "Match the unit",
    explanation:
      "Planning regions can be functional, administrative, resource-based, river-basin based, or problem-region based. The correct unit depends on the issue being solved.",
    proof: "Trap: a useful administrative boundary is not always the best planning boundary.",
  },
  {
    id: "urban",
    label: "Read growth and urban stress",
    eyebrow: "Growth pole pressure",
    explanation:
      "Urbanization can create jobs, services, and innovation while also intensifying housing, transport, waste, water, pollution, and peri-urban pressure.",
    proof: "Balance the answer: growth pole -> opportunity -> pressure -> sustainability response.",
  },
  {
    id: "governance",
    label: "Connect geography and governance",
    eyebrow: "Response logic",
    explanation:
      "Backwardness and growth poles must be read through both geography and governance. Infrastructure, institutions, policy capacity, participation, and ecological limits shape the outcome.",
    proof: "A policy response must fit the location factor, indicator, planning unit, and sustainability risk.",
  },
  {
    id: "trap",
    label: "Reject solution mismatches",
    eyebrow: "Applied recall",
    explanation:
      "A near-correct UPSC statement may confuse cause, indicator, planning unit, growth-pole effect, or policy solution. Verify each link before accepting the claim.",
    proof: "Recall chain: gap -> cause -> indicator -> region -> response -> reject the mismatch.",
  },
];

export const geographyDay20PortalLesson = {
  title: "Regional Development",
  promise:
    "Explain regional inequality through spatial gaps, planning regions, urban pressure, governance response, sustainability, and solution discipline.",
  sourceSummary:
    "Promoted from the staged Human and Economic Geography pack into a compact portal-native geography-governance visual.",
  scenes: [
    {
      id: "20-briefing",
      kind: "briefing" as const,
      title: "Begin with the regional gap",
      objective: "Explain development as an uneven spatial pattern.",
      narration:
        "Resource base, location, connectivity, human capital, and institutions differ across regions. Start by naming the gap and the indicator that reveals it.",
      checkpoint:
        "Student can connect one regional disparity with one indicator and one geographic cause.",
      durationMinutes: 2,
    },
    {
      id: "20-mechanism",
      kind: "mechanism" as const,
      title: "Match the planning unit",
      objective: "Choose the region type that fits the development problem.",
      narration:
        "A planning region may be functional, administrative, resource-based, river-basin based, or problem-region based. Choose the boundary that fits the issue.",
      checkpoint:
        "Student can match one development issue with one suitable planning region.",
      durationMinutes: 3,
    },
    {
      id: "20-map",
      kind: "map" as const,
      title: "Balance growth and pressure",
      objective: "Connect urbanization and growth poles with regional opportunity and stress.",
      narration:
        "Growth centers can create jobs, services, and innovation while also intensifying housing, transport, waste, water, pollution, and peri-urban pressure.",
      checkpoint:
        "Student can state one growth-pole gain and one sustainability pressure.",
      durationMinutes: 3,
    },
    {
      id: "20-trap",
      kind: "trap" as const,
      title: "Reject cause-solution mismatches",
      objective: "Prepare for disparity, indicator, region, and policy traps.",
      narration:
        "A policy is not correct merely because it sounds useful. Verify the spatial cause, indicator, planning unit, governance capacity, and ecological limit together.",
      checkpoint:
        "Student can reject one near-correct regional-development solution.",
      durationMinutes: 2,
    },
    {
      id: "20-recap",
      kind: "recap" as const,
      title: "Explain one regional development chain",
      objective: "Move into discussion with one gap-to-response explanation.",
      narration:
        "Choose one region or urban issue. State the gap, cause, indicator, planning unit, response, sustainability risk, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one regional development chain and reject one mismatch.",
      durationMinutes: 2,
    },
  ],
};
