/**
 * Paper / Section structure for UPSC optional subjects (spec task 5.3, R3).
 *
 * The {@link SubjectShell} renders each optional subject as **Paper I** and
 * **Paper II** (R3.1). Paper I is split into **Section A** and **Section B**
 * chosen via a dropdown (R3.2); the selected section's content is shown
 * visually segregated from the other (R3.3). Paper II has no A/B split.
 *
 * This module is the *navigational* structure only — the minimal top-level
 * topic headings per section. It deliberately does NOT carry deep Read content,
 * PYQs, or practice items: those are served from the backend content model in
 * later tasks (6.x / 7.x / 8.x). Subjects without a bespoke structure fall back
 * to a sensible default (Paper I A/B + Paper II) with no topics, so the UI shows
 * an honest "not yet authored" state rather than inventing content.
 */

/** Stable identifiers for the two papers of an optional subject. */
export type PaperId = "paper-1" | "paper-2";

/** Stable identifiers for the two sections of Paper I. */
export type SectionId = "section-a" | "section-b";

/** A single Paper I section (e.g. Section A "Principles of Physical Geography"). */
export type SubjectSection = {
  id: SectionId;
  /** Short label shown in the dropdown, e.g. "Section A". */
  label: string;
  /** Official section title, e.g. "Principles of Physical Geography". */
  title: string;
  /** Top-level syllabus headings under this section (may be empty). */
  topics: readonly string[];
};

/** Paper I — always split into Section A / Section B. */
export type PaperOneStructure = {
  id: "paper-1";
  label: string;
  sections: readonly [SubjectSection, SubjectSection];
};

/** Paper II — a single content area with no A/B split. */
export type PaperTwoStructure = {
  id: "paper-2";
  label: string;
  /** Official paper title, e.g. "Geography of India". */
  title: string;
  /** Top-level syllabus headings for Paper II (may be empty). */
  topics: readonly string[];
};

/** Full Paper/Section structure for one subject. */
export type SubjectStructure = {
  slug: string;
  paperOne: PaperOneStructure;
  paperTwo: PaperTwoStructure;
};

/**
 * Bespoke structure for Geography (the Phase-1 stabilization subject).
 * Headings follow the official UPSC Geography optional syllabus. Topic content
 * itself is folded in by later Read-layer tasks (6.x).
 */
const GEOGRAPHY_STRUCTURE: SubjectStructure = {
  slug: "geography",
  paperOne: {
    id: "paper-1",
    label: "Paper I",
    sections: [
      {
        id: "section-a",
        label: "Section A",
        title: "Principles of Physical Geography",
        topics: [
          "Geomorphology",
          "Climatology",
          "Oceanography",
          "Biogeography",
          "Environmental Geography",
        ],
      },
      {
        id: "section-b",
        label: "Section B",
        title: "Human Geography",
        topics: [
          "Perspectives in Human Geography",
          "Economic Geography",
          "Population and Settlement Geography",
          "Regional Planning",
          "Models, Theories and Laws in Human Geography",
        ],
      },
    ],
  },
  paperTwo: {
    id: "paper-2",
    label: "Paper II",
    title: "Geography of India",
    topics: [
      "Physical Setting",
      "Resources",
      "Agriculture",
      "Industry",
      "Transport, Communication and Trade",
      "Cultural Setting",
      "Settlements",
      "Regional Development and Planning",
      "Political Aspects",
      "Contemporary Issues",
    ],
  },
};
/**
 * Bespoke structure for Anthropology Optional.
 *
 * The current uploaded/authored content will arrive later, so this is kept as
 * the stable UPSC-facing shell: Paper I split into foundational theory/methods
 * and biological/applied anthropology, plus Paper II as Indian anthropology.
 * The LMS can use these headings as upload slots without exposing raw scraped
 * handout fragments as the main navigation.
 */
const ANTHROPOLOGY_STRUCTURE: SubjectStructure = {
  slug: "anthropology",
  paperOne: {
    id: "paper-1",
    label: "Paper I",
    sections: [
      {
        id: "section-a",
        label: "Section A",
        title: "Foundations, Society, Culture and Methods",
        topics: [
          "Meaning, scope and development of Anthropology",
          "Relationship with other disciplines",
          "Main branches of Anthropology",
          "Culture, society, marriage, family and kinship",
          "Economic organization",
          "Political organization and social control",
          "Religion",
          "Anthropological theories",
          "Culture, language and communication",
          "Research methods in Anthropology",
        ],
      },
      {
        id: "section-b",
        label: "Section B",
        title: "Biological, Archaeological and Applied Anthropology",
        topics: [
          "Human evolution and emergence of man",
          "Primates and phylogenetic status of hominids",
          "Biological basis of life",
          "Principles of prehistoric archaeology",
          "Human genetics and Mendelian genetics in man",
          "Genetic polymorphism, selection and chromosomal aberrations",
          "Race, racism and human variation",
          "Ecological and epidemiological anthropology",
          "Human growth, development and demographic theories",
          "Applications of Anthropology",
        ],
      },
    ],
  },
  paperTwo: {
    id: "paper-2",
    label: "Paper II",
    title: "Indian Anthropology",
    topics: [
      "Evolution of Indian culture and civilization",
      "Palaeo-anthropological evidences and ethno-archaeology in India",
      "Demographic profile of India",
      "Traditional Indian social system",
      "Caste system in India",
      "Sacred complex and Nature-Man-Spirit complex",
      "Impact of religions on Indian society",
      "Emergence, growth and development of Anthropology in India",
      "Indian village, minorities and socio-cultural change",
      "Tribal situation in India",
      "Problems of tribal communities",
      "Developmental projects and tribals",
      "Problems of SC, ST and OBC",
      "Social change and contemporary tribal societies",
      "Ethnicity and political developments",
      "Tribe and nation state",
      "Administration of tribal areas and PVTGs",
      "Role of Anthropology in development",
      "Anthropological contributions to regionalism and communalism",
    ],
  },
};

/** Bespoke structures keyed by subject slug. */
const BESPOKE_STRUCTURES: Readonly<Record<string, SubjectStructure>> = {
  anthropology: ANTHROPOLOGY_STRUCTURE,
  geography: GEOGRAPHY_STRUCTURE,
};

/**
 * Default structure for subjects without a bespoke definition. Carries the
 * Paper I (A/B) + Paper II shape (R3.1, R3.2) but no topics — the section
 * panels then surface an honest "not yet authored" state (design Property 8).
 */
function defaultStructure(slug: string): SubjectStructure {
  return {
    slug,
    paperOne: {
      id: "paper-1",
      label: "Paper I",
      sections: [
        { id: "section-a", label: "Section A", title: "Section A", topics: [] },
        { id: "section-b", label: "Section B", title: "Section B", topics: [] },
      ],
    },
    paperTwo: { id: "paper-2", label: "Paper II", title: "Paper II", topics: [] },
  };
}

/**
 * Resolve the Paper/Section structure for a subject slug. Returns the bespoke
 * structure when one exists, otherwise a sensible default. Always returns a
 * usable structure so the shell can render the Paper I/II navigation.
 */
export function getSubjectStructure(slug: string): SubjectStructure {
  return BESPOKE_STRUCTURES[slug] ?? defaultStructure(slug);
}

/** True when a subject has a hand-authored (bespoke) structure. */
export function hasBespokeStructure(slug: string): boolean {
  return slug in BESPOKE_STRUCTURES;
}
