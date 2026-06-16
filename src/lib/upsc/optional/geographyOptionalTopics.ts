import type { OptionalTopic, TopicStatus } from "./geographyOptionalTypes";
import { geomorphology } from "./geomorphology";
import { climatology } from "./climatology";
import { oceanography } from "./oceanography";
import { biogeography } from "./biogeography";

/**
 * Registry of Geography Optional topics.
 *
 * Build order (Paper I, Section A — Physical Geography) follows the founder
 * priority: Geomorphology first, then Climatology, and so on. Topics not yet
 * authored are listed as "coming-soon" so the catalog shows the full roadmap.
 */

type ComingSoonTopic = {
  slug: string;
  title: string;
  paper: string;
  section: string;
  order: number;
  status: TopicStatus;
  summary: string;
  readMinutes: number;
};

export const comingSoonTopics: ComingSoonTopic[] = [
  {
    slug: "environmental-geography",
    title: "Environmental Geography",
    paper: "Paper I",
    section: "Section A — Physical Geography",
    order: 5,
    status: "coming-soon",
    summary:
      "Ecosystem principles, environmental degradation & management, hazards and sustainable development.",
    readMinutes: 26,
  },
];

/** Fully-authored topics (Read content ready). */
export const readyTopics: OptionalTopic[] = [geomorphology, climatology, oceanography, biogeography];

export type TopicCard = {
  slug: string;
  title: string;
  paper: string;
  section: string;
  order: number;
  status: TopicStatus;
  summary: string;
  readMinutes: number;
};

/** All topics (ready + coming soon) ordered for the catalog. */
export const allTopicCards: TopicCard[] = [
  ...readyTopics.map((t) => ({
    slug: t.slug,
    title: t.title,
    paper: t.paper,
    section: t.section,
    order: t.order,
    status: t.status,
    summary: t.summary,
    readMinutes: t.readMinutes,
  })),
  ...comingSoonTopics,
].sort((a, b) => a.order - b.order);

export function getReadyTopic(slug: string): OptionalTopic | undefined {
  return readyTopics.find((t) => t.slug === slug);
}

export const geographyOptionalMeta = {
  title: "Geography (Optional)",
  papers: ["Paper I", "Paper II"],
  builtTopics: readyTopics.length,
  totalTopics: allTopicCards.length,
};
