export type GeographyDay10MonsoonStage = {
  id: "heating" | "itcz" | "branches" | "rhythm" | "variability";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay10MonsoonStages: GeographyDay10MonsoonStage[] = [
  {
    id: "heating",
    label: "Create thermal contrast",
    eyebrow: "Land-sea pressure",
    explanation:
      "Summer heating strengthens low pressure over the subcontinent while the surrounding ocean is relatively cooler. This pressure contrast prepares moisture-bearing inflow.",
    proof: "Start with the driver: stronger land heating helps organize a seasonal pressure contrast.",
  },
  {
    id: "itcz",
    label: "Shift the rain belt",
    eyebrow: "ITCZ movement",
    explanation:
      "The rain belt shifts northward with seasonal heating. Cross-equatorial flow bends under rotation and feeds the southwest monsoon circulation.",
    proof: "Map chain: seasonal heating -> ITCZ shift -> cross-equatorial flow -> southwest monsoon.",
  },
  {
    id: "branches",
    label: "Split the moisture branches",
    eyebrow: "Regional rainfall map",
    explanation:
      "Arabian Sea and Bay of Bengal branches meet different relief barriers. Orographic uplift, rain shadows, and regional pathways explain strongly uneven rainfall.",
    proof: "Trap: monsoon arrival does not mean uniform rainfall across India.",
  },
  {
    id: "rhythm",
    label: "Read onset, break, and retreat",
    eyebrow: "Moving sequence",
    explanation:
      "The monsoon is not one static event. Onset, active spells, breaks, and retreat shift the location and intensity of rainfall through the season.",
    proof: "Recall sequence: onset -> active phase -> break -> retreat.",
  },
  {
    id: "variability",
    label: "Add variability signals",
    eyebrow: "Uncertainty layer",
    explanation:
      "Jet streams, western disturbances, ENSO, IOD, sea-surface conditions, relief, and local factors modify the seasonal pattern. No single signal explains every year.",
    proof: "UPSC trap: one variability factor can influence rainfall without becoming a complete one-factor explanation.",
  },
];

export const geographyDay10PortalLesson = {
  title: "Indian Monsoon",
  promise:
    "Explain monsoon as a moving pressure-wind-rainfall system with regional contrasts, seasonal phases, and uncertainty.",
  sourceSummary:
    "Promoted from the staged India Map Command pack and Monsoon Simulator route into a compact portal-native sequence visual.",
  scenes: [
    {
      id: "10-briefing",
      kind: "briefing" as const,
      title: "Begin with seasonal pressure contrast",
      objective: "Build the monsoon from land-sea heating instead of memorizing rainfall dates.",
      narration:
        "Stronger summer heating over the subcontinent helps organize lower pressure relative to the surrounding ocean. This contrast prepares moisture-bearing inflow.",
      checkpoint:
        "Student can state why seasonal land-sea thermal contrast matters for monsoon circulation.",
      durationMinutes: 2,
    },
    {
      id: "10-mechanism",
      kind: "mechanism" as const,
      title: "Shift the ITCZ and bend the flow",
      objective: "Connect the seasonal rain-belt shift with southwest monsoon circulation.",
      narration:
        "The ITCZ shifts northward. Cross-equatorial flow bends under rotation and carries moisture toward India as part of the southwest monsoon system.",
      checkpoint:
        "Student can connect the ITCZ shift, cross-equatorial flow, and southwest monsoon direction.",
      durationMinutes: 3,
    },
    {
      id: "10-map",
      kind: "map" as const,
      title: "Split branches and explain rainfall contrasts",
      objective: "Use relief and branch paths to map uneven rainfall.",
      narration:
        "Arabian Sea and Bay of Bengal branches meet different relief barriers. Orographic uplift, rain shadows, and regional pathways produce uneven rainfall.",
      checkpoint:
        "Student can explain one branch and one regional rainfall contrast through relief.",
      durationMinutes: 3,
    },
    {
      id: "10-trap",
      kind: "trap" as const,
      title: "Reject static and one-factor explanations",
      objective: "Prepare for phase, direction, region, and variability traps.",
      narration:
        "Read onset, active spells, breaks, and retreat as a moving sequence. Treat ENSO, IOD, jet streams, and local factors as influences, not complete one-factor explanations.",
      checkpoint:
        "Student can reject one direction, rainfall-region, or single-factor monsoon statement.",
      durationMinutes: 2,
    },
    {
      id: "10-recap",
      kind: "recap" as const,
      title: "Explain the monsoon in five steps",
      objective: "Move into AI-teacher discussion with one regional contrast and one uncertainty signal.",
      narration:
        "Explain thermal contrast, ITCZ movement, southwest flow, one branch and rainfall contrast, active-break-retreat rhythm, and one variability factor with its limitation.",
      checkpoint:
        "Student is ready to explain monsoon as a moving system and reject one oversimplified statement.",
      durationMinutes: 2,
    },
  ],
};
