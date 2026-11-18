/**
 * Shared data resolver for Optional Subjects (Read layer, Syllabus analysis, PYQs, Practice).
 *
 * Builds tree/content/PYQ shapes from the built-in UPSC structures and the
 * frontend's authored Geography topic modules.
 *
 * NOT WIRED INTO LEARNER SURFACES (founder decision, 2026-10-31). The Next.js
 * route mirrors that used to serve this data were deleted in favour of the
 * FastAPI backend, and ReadView / SyllabusView / PyqExplorer / PracticeBoard no
 * longer fall back to it when a request fails — a failed load is reported as a
 * failure. Nothing in `src/app` or `src/components` imports this module today;
 * it is retained only as the source of the offline topic modules until the
 * dead-code cleanup decision. Do not reintroduce it as a client fallback: rows
 * assembled in the browser cannot claim REVIEWED status, real syllabus node ids,
 * or a previous-year question, and a learner surface must not present them as
 * published content.
 */

import { getSubjectStructure } from "./optionalSubjectStructure";
import { readyTopics } from "./optional/geographyOptionalTopics";
import type { OptionalTopic, ContentBlock } from "./optional/geographyOptionalTypes";
import type {
  SyllabusTreeOut,
  SyllabusPaperOut,
  SyllabusSectionOut,
  SyllabusNodeOut,
  NodeContentOut,
  ContentUnitOut,
  SyllabusAnalysisOut,
  SyllabusSegmentAnalysisOut,
  PyqListOut,
  PyqByTopicOut,
  PyqOut,
  PyqQuery,
  PracticeBoardOut,
  PracticePaperOut,
  PaperLabel,
  SectionLabel,
} from "@/services/api/optionalService";

// Map ready topics by normalized title and slug
const readyTopicByTitle = new Map<string, OptionalTopic>();
const readyTopicBySlug = new Map<string, OptionalTopic>();

for (const t of readyTopics) {
  readyTopicByTitle.set(t.title.trim().toLowerCase(), t);
  readyTopicBySlug.set(t.slug.trim().toLowerCase(), t);
}

function findReadyTopic(titleOrSlug: string): OptionalTopic | undefined {
  const norm = titleOrSlug.trim().toLowerCase();
  return readyTopicByTitle.get(norm) ?? readyTopicBySlug.get(norm);
}

interface FlattenedNodeMeta {
  nodeId: number;
  title: string;
  paperLabel: PaperLabel;
  paperName: string;
  sectionLabel: SectionLabel | null;
  sectionName: string;
  displayOrder: number;
  readyTopic?: OptionalTopic;
}

/**
 * Builds a deterministic list of all topic nodes for a subject.
 */
function getSubjectTopicNodes(slug: string): FlattenedNodeMeta[] {
  const structure = getSubjectStructure(slug);
  const result: FlattenedNodeMeta[] = [];
  let currentId = 1;

  // Paper I — Section A
  const secA = structure.paperOne.sections[0];
  if (secA) {
    for (let i = 0; i < secA.topics.length; i++) {
      const title = secA.topics[i];
      const ready = slug === "geography" ? findReadyTopic(title) : undefined;
      result.push({
        nodeId: currentId++,
        title,
        paperLabel: "PAPER_I",
        paperName: "Paper I",
        sectionLabel: "SECTION_A",
        sectionName: secA.title,
        displayOrder: i,
        readyTopic: ready,
      });
    }
  }

  // Paper I — Section B
  const secB = structure.paperOne.sections[1];
  if (secB) {
    for (let i = 0; i < secB.topics.length; i++) {
      const title = secB.topics[i];
      const ready = slug === "geography" ? findReadyTopic(title) : undefined;
      result.push({
        nodeId: currentId++,
        title,
        paperLabel: "PAPER_I",
        paperName: "Paper I",
        sectionLabel: "SECTION_B",
        sectionName: secB.title,
        displayOrder: i,
        readyTopic: ready,
      });
    }
  }

  // Paper II
  const p2 = structure.paperTwo;
  if (p2) {
    for (let i = 0; i < p2.topics.length; i++) {
      const title = p2.topics[i];
      const ready = slug === "geography" ? findReadyTopic(title) : undefined;
      result.push({
        nodeId: currentId++,
        title,
        paperLabel: "PAPER_II",
        paperName: "Paper II",
        sectionLabel: null,
        sectionName: p2.title,
        displayOrder: i,
        readyTopic: ready,
      });
    }
  }

  return result;
}

/**
 * Resolve full SyllabusTreeOut for any subject slug.
 */
export function resolveSyllabusTree(slug: string): SyllabusTreeOut {
  const structure = getSubjectStructure(slug);
  const flattened = getSubjectTopicNodes(slug);

  const secA = structure.paperOne.sections[0];
  const secB = structure.paperOne.sections[1];
  const p2 = structure.paperTwo;

  const buildNodes = (filter: (m: FlattenedNodeMeta) => boolean): SyllabusNodeOut[] => {
    return flattened.filter(filter).map((m) => {
      const isAuthored = Boolean(m.readyTopic);
      const children: SyllabusNodeOut[] = m.readyTopic?.subtopics?.map((st, sIdx) => ({
        node_id: m.nodeId * 1000 + (sIdx + 1),
        title: st.title,
        node_type: "SUBTOPIC",
        review_status: "UNREVIEWED",
        authored: true,
        weight: 1,
        display_order: sIdx,
        official_phrasing: st.syllabusTag,
        children: [],
      })) ?? [];

      return {
        node_id: m.nodeId,
        title: m.title,
        node_type: "TOPIC",
        review_status: isAuthored ? "UNREVIEWED" : "DRAFT",
        authored: isAuthored,
        weight: 1,
        display_order: m.displayOrder,
        official_phrasing: m.readyTopic?.syllabus.official.join("; ") ?? null,
        children,
      };
    });
  };

  const paperOneSections: SyllabusSectionOut[] = [];
  if (secA) {
    paperOneSections.push({
      section_id: 1,
      label: "SECTION_A",
      name: secA.title,
      display_order: 0,
      nodes: buildNodes((m) => m.paperLabel === "PAPER_I" && m.sectionLabel === "SECTION_A"),
    });
  }
  if (secB) {
    paperOneSections.push({
      section_id: 2,
      label: "SECTION_B",
      name: secB.title,
      display_order: 1,
      nodes: buildNodes((m) => m.paperLabel === "PAPER_I" && m.sectionLabel === "SECTION_B"),
    });
  }

  const papers: SyllabusPaperOut[] = [
    {
      paper_id: 1,
      label: "PAPER_I",
      name: "Paper I",
      display_order: 0,
      sections: paperOneSections,
    },
  ];

  if (p2) {
    papers.push({
      paper_id: 2,
      label: "PAPER_II",
      name: "Paper II",
      display_order: 1,
      sections: [
        {
          section_id: 3,
          label: null,
          name: p2.title,
          display_order: 0,
          nodes: buildNodes((m) => m.paperLabel === "PAPER_II"),
        },
      ],
    });
  }

  const subjectName =
    slug === "geography"
      ? "Geography (Optional)"
      : slug === "anthropology"
      ? "Anthropology (Optional)"
      : slug === "sociology"
      ? "Sociology (Optional)"
      : `${slug.charAt(0).toUpperCase() + slug.slice(1)} (Optional)`;

  return {
    slug,
    name: subjectName,
    papers,
  };
}

/**
 * Resolve NodeContentOut for a specific topic nodeId (or matching title/slug).
 */
export function resolveTopicContent(
  slug: string,
  nodeId: number,
  topicTitle?: string,
): NodeContentOut {
  const flattened = getSubjectTopicNodes(slug);
  let meta = flattened.find((m) => m.nodeId === nodeId);

  if (!meta && topicTitle) {
    meta = flattened.find(
      (m) => m.title.trim().toLowerCase() === topicTitle.trim().toLowerCase(),
    );
  }

  if (!meta) {
    // Check if title directly matches a ready topic
    const ready = topicTitle ? findReadyTopic(topicTitle) : undefined;
    if (ready) {
      return buildAuthoredNodeContent(nodeId, ready);
    }

    // Honest empty unauthored node
    return {
      node_id: nodeId,
      title: topicTitle ?? `Topic ${nodeId}`,
      node_type: "TOPIC",
      review_status: "DRAFT",
      official_phrasing: null,
      authored: false,
      content: null,
      children: [],
    };
  }

  if (meta.readyTopic) {
    return buildAuthoredNodeContent(meta.nodeId, meta.readyTopic);
  }

  // Honesty gate: topic is in syllabus but has not been authored yet
  return {
    node_id: meta.nodeId,
    title: meta.title,
    node_type: "TOPIC",
    review_status: "DRAFT",
    official_phrasing: null,
    authored: false,
    content: null,
    children: [],
  };
}

function buildAuthoredNodeContent(nodeId: number, topic: OptionalTopic): NodeContentOut {
  const children: NodeContentOut[] = (topic.subtopics ?? []).map((st, i) => {
    const subNodeId = nodeId * 1000 + (i + 1);
    const diagrams = (st.blocks ?? [])
      .filter((b): b is Extract<ContentBlock, { type: "diagram" }> => b.type === "diagram")
      .map((d, dIdx) => ({
        diagram_id: String(d.id),
        title: d.caption,
        caption: d.caption,
        display_order: dIdx,
      }));

    const unit: ContentUnitOut = {
      id: subNodeId,
      title: st.title,
      blocks: {
        kind: "subtopic",
        subtopicId: st.id,
        hook: st.hook,
        syllabusTag: st.syllabusTag,
        blocks: st.blocks,
      },
      exam_keywords: st.examKeywords ?? [],
      answer_language: st.answerLanguage ?? [],
      hidden_topics: null,
      review_status: "UNREVIEWED",
      display_order: i,
      diagrams,
    };

    return {
      node_id: subNodeId,
      title: st.title,
      node_type: "SUBTOPIC",
      review_status: "UNREVIEWED",
      official_phrasing: st.syllabusTag,
      authored: true,
      content: unit,
      children: [],
    };
  });

  const overviewUnit: ContentUnitOut = {
    id: nodeId,
    title: topic.title,
    blocks: {
      kind: "topic-overview",
      slug: topic.slug,
      paper: topic.paper,
      section: topic.section,
      order: topic.order,
      status: topic.status,
      summary: topic.summary,
      readMinutes: topic.readMinutes,
      syllabus: topic.syllabus,
    },
    exam_keywords: null,
    answer_language: null,
    hidden_topics: topic.syllabus?.hiddenTopics ?? [],
    review_status: "UNREVIEWED",
    display_order: 0,
    diagrams: [],
  };

  return {
    node_id: nodeId,
    title: topic.title,
    node_type: "TOPIC",
    review_status: "UNREVIEWED",
    official_phrasing: topic.syllabus?.official?.join("; ") ?? null,
    authored: true,
    content: overviewUnit,
    children,
  };
}

/**
 * Resolve SyllabusAnalysisOut for the subject's Syllabus View.
 */
export function resolveSyllabusAnalysis(slug: string): SyllabusAnalysisOut {
  const flattened = getSubjectTopicNodes(slug);
  const segments: SyllabusSegmentAnalysisOut[] = [];

  for (const m of flattened) {
    if (m.readyTopic) {
      segments.push({
        node_id: m.nodeId,
        title: m.readyTopic.title,
        node_type: "TOPIC",
        paper_label: m.paperLabel,
        paper_name: m.paperName,
        section_label: m.sectionLabel,
        section_name: m.sectionName,
        official: m.readyTopic.syllabus?.official ?? [],
        trend_says: m.readyTopic.syllabus?.trendSays ?? [],
        hidden_topics: m.readyTopic.syllabus?.hiddenTopics ?? [],
      });
    }
  }

  return {
    slug,
    name: slug === "geography" ? "Geography (Optional)" : `${slug} (Optional)`,
    segment_count: segments.length,
    segments,
  };
}

/**
 * Resolve PYQs for the subject.
 */
export function resolvePyqs(slug: string, query: PyqQuery = {}): PyqListOut {
  const flattened = getSubjectTopicNodes(slug);
  const pyqs: PyqOut[] = [];
  const yearsSet = new Set<number>();
  let nextPyqId = 1;

  for (const m of flattened) {
    if (!m.readyTopic) continue;

    // From topic-level PYQ bank
    if (m.readyTopic.pyqBank) {
      for (const entry of m.readyTopic.pyqBank) {
        const yearNum = entry.year ? parseInt(entry.year, 10) : NaN;
        // Two honesty rules for this offline fallback data. A prompt with no year
        // is left out rather than given an invented one, because a dated
        // previous-year question is the claim the learner relies on. And nothing
        // assembled in the frontend may claim REVIEWED: review is a backend
        // decision over stored rows, so this is study-note practice material.
        if (isNaN(yearNum)) continue;
        yearsSet.add(yearNum);

        pyqs.push({
          id: nextPyqId++,
          year: yearNum,
          paper_label: m.paperLabel,
          section_label: m.sectionLabel,
          question_text: entry.q,
          marks: entry.marks ?? 15,
          beyond_syllabus: false,
          topic_node_id: m.nodeId,
          review_status: "UNREVIEWED",
        });
      }
    }

    // From subtopic PYQs
    if (m.readyTopic.subtopics) {
      for (const st of m.readyTopic.subtopics) {
        if (!st.pyq) continue;
        for (const p of st.pyq) {
          const yearNum = p.year ? parseInt(p.year, 10) : NaN;
          // Same rule as the topic-level bank above: no invented year, and no
          // frontend-built row may claim REVIEWED.
          if (isNaN(yearNum)) continue;
          yearsSet.add(yearNum);

          pyqs.push({
            id: nextPyqId++,
            year: yearNum,
            paper_label: m.paperLabel,
            section_label: m.sectionLabel,
            question_text: p.q,
            marks: 15,
            beyond_syllabus: false,
            topic_node_id: m.nodeId,
            review_status: "UNREVIEWED",
          });
        }
      }
    }
  }

  // Apply filters
  let filtered = pyqs;
  if (query.year != null) filtered = filtered.filter((p) => p.year === query.year);
  if (query.paper) filtered = filtered.filter((p) => p.paper_label === query.paper);
  if (query.section) filtered = filtered.filter((p) => p.section_label === query.section);
  if (query.topicNodeId != null) filtered = filtered.filter((p) => p.topic_node_id === query.topicNodeId);

  // Apply sorting
  filtered.sort((a, b) => (query.sort === "year_asc" ? a.year - b.year : b.year - a.year));

  const years = Array.from(yearsSet).sort((a, b) => b - a);

  return {
    slug,
    name: slug === "geography" ? "Geography (Optional)" : `${slug} (Optional)`,
    total: filtered.length,
    filters: {
      year: query.year ?? null,
      paper: query.paper ?? null,
      section: query.section ?? null,
      sort: query.sort ?? "year_desc",
    },
    facets: {
      years: years.length > 0 ? years : [2024, 2023, 2022, 2021, 2020],
      papers: ["PAPER_I", "PAPER_II"],
      sections: ["SECTION_A", "SECTION_B"],
    },
    pyqs: filtered,
  };
}

/**
 * Resolve PYQs grouped by topic.
 */
export function resolvePyqsByTopic(slug: string): PyqByTopicOut {
  const pyqList = resolvePyqs(slug);
  const flattened = getSubjectTopicNodes(slug);

  const groups = flattened
    .filter((m) => Boolean(m.readyTopic))
    .map((m) => {
      const topicPyqs = pyqList.pyqs.filter((p) => p.topic_node_id === m.nodeId);
      return {
        node_id: m.nodeId,
        title: m.title,
        node_type: "TOPIC",
        official_phrasing: m.readyTopic?.syllabus?.official?.join("; ") ?? null,
        paper_label: m.paperLabel,
        paper_name: m.paperName,
        section_label: m.sectionLabel,
        section_name: m.sectionName,
        pyq_count: topicPyqs.length,
        pyqs: topicPyqs,
      };
    });

  return {
    slug,
    name: slug === "geography" ? "Geography (Optional)" : `${slug} (Optional)`,
    total: pyqList.total,
    group_count: groups.length,
    groups,
  };
}

/**
 * Resolve PracticeBoardOut for the subject.
 */
export function resolvePracticeStatus(slug: string): PracticeBoardOut {
  const tree = resolveSyllabusTree(slug);
  let totalTopics = 0;
  let authoredTopics = 0;

  const papers: PracticePaperOut[] = tree.papers.map((p) => ({
    paper_id: p.paper_id,
    label: p.label,
    name: p.name,
    display_order: p.display_order,
    sections: p.sections.map((s) => ({
      section_id: s.section_id,
      label: s.label ?? null,
      name: s.name,
      display_order: s.display_order,
      topics: s.nodes.map((n) => {
        totalTopics++;
        if (n.authored) authoredTopics++;
        return {
          node_id: n.node_id,
          title: n.title,
          node_type: n.node_type,
          authored: n.authored,
          weight: n.weight,
          display_order: n.display_order,
          attempt_count: 0,
          last_practiced_at: null,
          status: "NOT_STARTED" as const,
        };
      }),
    })),
  }));

  return {
    slug,
    name: tree.name,
    total_topics: totalTopics,
    authored_topics: authoredTopics,
    practiced_topics: 0,
    papers,
  };
}
