export type GeographyDay26MainsGeographyApplicationStage = {
  id: "structure" | "mechanism" | "diagram" | "example" | "trap";
  label: string;
  eyebrow: string;
  explanation: string;
  proof: string;
};

export const geographyDay26MainsGeographyApplicationStages: GeographyDay26MainsGeographyApplicationStage[] = [
  {
    id: "structure",
    label: "Frame the answer",
    eyebrow: "10-marker skeleton",
    explanation:
      "Begin with a definition or context line, then organize the answer through mechanism, spatial proof, example, and a balanced conclusion.",
    proof: "Answer frame: context -> mechanism -> spatial proof -> example -> conclusion.",
  },
  {
    id: "mechanism",
    label: "Explain the causal flow",
    eyebrow: "Reason before listing",
    explanation:
      "A geography answer needs cause, process, and consequence. Use a short causal chain so the examiner can see how one variable changes another.",
    proof: "Mechanism check: show how and why, not only what.",
  },
  {
    id: "diagram",
    label: "Add a useful visual",
    eyebrow: "Map or diagram",
    explanation:
      "Use a locator map, flow diagram, cross-section, or small comparison table only when it clarifies the argument. The visual must earn its space.",
    proof: "Visual check: the map or diagram must explain, not decorate.",
  },
  {
    id: "example",
    label: "Anchor one example",
    eyebrow: "Evidence with location",
    explanation:
      "Add one India or world example with location, cause, impact, and a policy or way-forward cue where relevant. Specific evidence strengthens the explanation.",
    proof: "Example check: place + process + impact + response.",
  },
  {
    id: "trap",
    label: "Reject the fact dump",
    eyebrow: "UPSC answer discipline",
    explanation:
      "A long list of correct facts still produces a weak answer when causal flow, spatial evidence, examples, and conclusion discipline are missing.",
    proof: "Recall chain: frame -> explain -> visualize -> anchor -> conclude.",
  },
];

export const geographyDay26PortalLesson = {
  title: "Mains Geography Application",
  promise:
    "Convert Geography knowledge into a clear 10-marker through context, mechanism, map or diagram, example, and balanced conclusion.",
  sourceSummary:
    "Promoted from the staged Atlas, PYQ Logic, Revision pack into a compact portal-native answer-writing visual.",
  scenes: [
    {
      id: "26-briefing",
      kind: "briefing" as const,
      title: "Build the 10-marker skeleton",
      objective: "Create a reliable answer structure before adding facts.",
      narration:
        "Open with definition or context. Then move through mechanism, map or diagram, example, and a balanced conclusion. Let each part serve the argument.",
      checkpoint:
        "Student can state the five-part answer skeleton without reading the slide.",
      durationMinutes: 2,
    },
    {
      id: "26-mechanism",
      kind: "mechanism" as const,
      title: "Convert content into causal flow",
      objective: "Explain how and why instead of listing fragments.",
      narration:
        "Use cause, process, and consequence. Connect the concept through a short logical chain before inserting supporting facts.",
      checkpoint:
        "Student can turn one topic into a causal explanation.",
      durationMinutes: 3,
    },
    {
      id: "26-map",
      kind: "map" as const,
      title: "Use spatial proof",
      objective: "Choose a visual that clarifies the answer.",
      narration:
        "Add a locator map, flow diagram, cross-section, or compact comparison only when it improves comprehension. Then attach one location-specific example.",
      checkpoint:
        "Student can choose one useful visual and one evidence-rich example.",
      durationMinutes: 3,
    },
    {
      id: "26-trap",
      kind: "trap" as const,
      title: "Avoid the fact dump",
      objective: "Prepare for weak-answer habits.",
      narration:
        "Correct facts do not rescue an answer that lacks causal flow, spatial evidence, example discipline, or conclusion. Identify and remove the loose list.",
      checkpoint:
        "Student can explain why one fact-heavy answer remains weak.",
      durationMinutes: 2,
    },
    {
      id: "26-recap",
      kind: "recap" as const,
      title: "Pitch one complete answer",
      objective: "Move into discussion with one mains-ready outline.",
      narration:
        "Choose one Geography topic. State the intro, causal mechanism, map or diagram, example, balanced conclusion, and one trap that would weaken the answer.",
      checkpoint:
        "Student is ready to explain one complete 10-marker outline.",
      durationMinutes: 2,
    },
  ],
};
