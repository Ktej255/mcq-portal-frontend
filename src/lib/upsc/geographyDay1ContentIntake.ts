export type GeographyDay1SourceStatus =
  | "ready-to-adapt"
  | "supporting"
  | "founder-required";

export type GeographyDay1Source = {
  title: string;
  status: GeographyDay1SourceStatus;
  source: string;
  use: string;
};

export const geographyDay1SourceStatusLabels: Record<GeographyDay1SourceStatus, string> = {
  "ready-to-adapt": "Ready to adapt",
  supporting: "Supporting",
  "founder-required": "Founder required",
};

export const geographyDay1Sources: GeographyDay1Source[] = [
  {
    title: "Geography Foundation architecture",
    status: "ready-to-adapt",
    source: "prelims/Geography/Geography_Foundation_Complete_Outline.docx",
    use: "Use G0 Geographic Thinking Framework for the first learner-facing lesson: spatial relationships, map language, and physical-human connection.",
  },
  {
    title: "UPSC Geography master plan",
    status: "ready-to-adapt",
    source: "prelims/Geography/Geography_GS_Master_Plan.docx",
    use: "Use its PYQ-anchored, trend-mapped, gap-analysed, and trap-aware teaching rules as the standard for every class pack.",
  },
  {
    title: "NCERT Geography as a Discipline",
    status: "ready-to-adapt",
    source: "prelims/Geography/NCERT/11th Class Fundamental of Geography/kegy201.pdf",
    use: "Use its what, where, and why sequence to teach the geographic lens without overwhelming a new learner.",
  },
  {
    title: "India Map Intelligence value addition",
    status: "ready-to-adapt",
    source: "30 day Plan/Value Eddition/D1_India_Map_Intelligence_UPSC2026.pdf",
    use: "Use relationship drills such as river to sea, pass to state, strait to water body, and national park to location after the foundation explanation.",
  },
  {
    title: "NCERT Origin and Evolution of Earth",
    status: "supporting",
    source: "prelims/Geography/NCERT/11th Class Fundamental of Geography/kegy202.pdf",
    use: "Use for the next physical-geography lesson: universe expansion, planet formation, differentiation, atmosphere, hydrosphere, and origin of life.",
  },
  {
    title: "Portal animation blueprint",
    status: "supporting",
    source: "src/lib/upsc/geographyAnimationCatalog.ts",
    use: "Reuse the Universe to Earth storyboard only after the Day 1 learning objective is finalized.",
  },
  {
    title: "Final Day 1 lecture media",
    status: "founder-required",
    source: "Not attached",
    use: "Provide the final recorded lecture or approve a fresh portal-native lesson production.",
  },
  {
    title: "Final Day 1 transcript",
    status: "founder-required",
    source: "Not attached",
    use: "Provide the transcript or approve transcription after the final lecture media is selected.",
  },
  {
    title: "Fresh Day 1 MCQ batch",
    status: "founder-required",
    source: "Not attached",
    use: "Provide at least 25 advanced GEO-D01 questions. Existing banks remain reference-only and must not silently unlock launch practice.",
  },
  {
    title: "Day 1 detailed visual proof",
    status: "founder-required",
    source: "Not attached",
    use: "A portal-native five-choice relationship drill is staged. Approve the final animated map and concept-proof production sequence.",
  },
];

export const geographyDay1Recommendation = {
  currentMismatch:
    "The original staged portal pack combined Earth systems, coordinates, movement, time zones, and map logic in one 75-minute lesson. The founder corpus supports a cleaner first lesson.",
  proposedDay1:
    "Geographic thinking and map relationships: what, where, why; spatial relationships; map language; India relationship drills.",
  proposedDay2:
    "Origin and evolution of Earth: universe expansion, planet formation, differentiation, atmosphere, hydrosphere, and life.",
  proposedDay3:
    "Interior of Earth and plate movement: seismic evidence, layers, mantle behavior, boundary types, and hazard patterns.",
  decision:
    "Day 1 is staged as a source-backed portal-native foundation lesson with a five-choice India map-relationship drill. Day 2 is promoted locally as the source-backed Universe-to-Earth visual lesson. Day 3 is tightened into the Earth-interior-to-plate-movement bridge so the 30-day schedule remains intact. Final recorded media, transcript approval, detailed visual production, and fresh MCQ intake remain open.",
};
