import type { OptionalTopic, TopicStatus } from "./geographyOptionalTypes";
import { geomorphology } from "./geomorphology";
import { climatology } from "./climatology";
import { oceanography } from "./oceanography";
import { biogeography } from "./biogeography";
import { environmentalGeography } from "./environmentalGeography";

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

export const comingSoonTopics: ComingSoonTopic[] = [];

/** Fully-authored topics (Read content ready). */
export const readyTopics: OptionalTopic[] = [
  geomorphology,
  climatology,
  oceanography,
  biogeography,
  environmentalGeography,
];

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
