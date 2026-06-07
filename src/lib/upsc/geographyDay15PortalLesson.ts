export type GeographyDay15PopulationStage = {
  id: "concepts" | "controls" | "migration" | "transition" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay15PopulationStages: GeographyDay15PopulationStage[] = [
  {
    id: "concepts",
    label: "Separate the indicators",
    eyebrow: "Population basics",
    explanation:
      "Population density is a ratio, while distribution is a spatial pattern. Growth rate, fertility, age structure, and migration answer different questions.",
    proof: "Start cleanly: density, distribution, growth, fertility, and migration are related but not interchangeable.",
  },
  {
    id: "controls",
    label: "Explain concentration",
    eyebrow: "Physical and economic pull",
    explanation:
      "Relief, climate, soil, water, transport, jobs, safety, and services explain why people cluster in some regions and avoid others.",
    proof: "Map chain: physical base + access + livelihood + safety shape population distribution.",
  },
  {
    id: "migration",
    label: "Trace migration",
    eyebrow: "Push and pull",
    explanation:
      "Migration can be seasonal, forced, voluntary, rural-urban, inter-state, or international. Always identify origin pressure, destination pull, and the resulting change.",
    proof: "Migration logic: origin push -> route -> destination pull -> demographic and settlement effect.",
  },
  {
    id: "transition",
    label: "Read demographic transition",
    eyebrow: "Population change",
    explanation:
      "Demographic transition connects birth rate, death rate, natural increase, age structure, health, education, urbanization, and development stage.",
    proof: "Trap: falling fertility does not mean migration, age structure, or total population stop mattering.",
  },
  {
    id: "trap",
    label: "Reject indicator swaps",
    eyebrow: "Applied recall",
    explanation:
      "A strong answer explains one population pattern through physical factor, economic factor, migration factor, demographic indicator, map example, and one swapped-indicator trap.",
    proof: "Recall chain: indicator -> factor -> map pattern -> migration or transition -> reject the swap.",
  },
];

export const geographyDay15PortalLesson = {
  title: "Population Geography",
  promise:
    "Explain population patterns through density, distribution, physical base, economy, services, migration, demographic transition, and indicator discipline.",
  sourceSummary:
    "Promoted from the staged Human and Economic Geography pack into a compact portal-native population-pattern visual.",
  scenes: [
    {
      id: "15-briefing",
      kind: "briefing" as const,
      title: "Separate population indicators",
      objective: "Distinguish density, distribution, growth, fertility, and migration before using data.",
      narration:
        "Density is a ratio and distribution is a spatial pattern. Growth rate, fertility, age structure, and migration add different dimensions of population change.",
      checkpoint:
        "Student can distinguish density from distribution and name one additional indicator.",
      durationMinutes: 2,
    },
    {
      id: "15-mechanism",
      kind: "mechanism" as const,
      title: "Explain concentration",
      objective: "Connect population patterns with physical and economic factors.",
      narration:
        "Relief, climate, soil, water, transport, jobs, safety, and services explain why population clusters or remains sparse across regions.",
      checkpoint:
        "Student can explain one dense or sparse region through physical and economic factors.",
      durationMinutes: 3,
    },
    {
      id: "15-map",
      kind: "map" as const,
      title: "Add migration and transition",
      objective: "Connect spatial movement with demographic change.",
      narration:
        "Trace one migration chain from origin push to destination pull. Then connect birth rate, death rate, natural increase, and age structure with demographic transition.",
      checkpoint:
        "Student can explain one migration chain and one demographic-transition relationship.",
      durationMinutes: 3,
    },
    {
      id: "15-trap",
      kind: "trap" as const,
      title: "Reject swapped indicators",
      objective: "Prepare for density, growth, fertility, migration, and distribution traps.",
      narration:
        "A statement may use a correct population term in the wrong relationship. Check whether it describes a ratio, map pattern, rate of change, birth behavior, or movement.",
      checkpoint:
        "Student can reject one near-correct swapped-indicator statement.",
      durationMinutes: 2,
    },
    {
      id: "15-recap",
      kind: "recap" as const,
      title: "Explain one population pattern",
      objective: "Move into discussion with one human-geography chain.",
      narration:
        "Choose one population pattern. State the indicator, physical factor, economic factor, migration or transition link, map example, and one UPSC trap.",
      checkpoint:
        "Student is ready to explain one population pattern and reject one indicator swap.",
      durationMinutes: 2,
    },
  ],
};
