import { apiClient } from './client';

/**
 * API client for the Optional Subjects Platform Read layer (spec task 6.1).
 *
 * Content is **backend-served**: these calls hit
 * `/api/v1/optional/{slug}/syllabus-tree` and
 * `/api/v1/optional/{slug}/topics/{nodeId}/content` so the `ReadView` never
 * reads the legacy frontend TypeScript content modules (deleted in task 6.4).
 *
 * Auth is handled centrally by the shared `apiClient` request interceptor
 * (Bearer token), matching every other service in this codebase.
 */

// ---------------------------------------------------------------------------
// Types — mirror backend Pydantic schemas (app/api/v1/optional/schemas.py)
// ---------------------------------------------------------------------------

/** A typed content block preserved by the importer (mirrors geographyOptionalTypes). */
export type CalloutTone = 'key' | 'trap' | 'keyword' | 'example' | 'link';

export type ContentBlock =
  | { type: 'para'; text: string }
  | { type: 'points'; heading?: string; items: string[] }
  | { type: 'callout'; tone: CalloutTone; title: string; items: string[] }
  | { type: 'diagram'; id: string; caption: string };

export interface TrendPoint {
  theme: string;
  insight: string;
  frequency: string;
}

export interface HiddenTopicEntry {
  topic: string;
  why: string;
}

/** Shape of a subtopic ContentUnit's `blocks` payload (importer `kind: "subtopic"`). */
export interface SubtopicBlocks {
  kind: 'subtopic';
  subtopicId?: string;
  hook?: string;
  syllabusTag?: string;
  blocks?: ContentBlock[];
}

/** Shape of a topic-overview ContentUnit's `blocks` payload (`kind: "topic-overview"`). */
export interface TopicOverviewBlocks {
  kind: 'topic-overview';
  slug?: string;
  paper?: string;
  section?: string;
  order?: number;
  status?: string;
  summary?: string;
  readMinutes?: number;
  syllabus?: {
    official?: string[];
    trendSays?: TrendPoint[];
    hiddenTopics?: HiddenTopicEntry[];
  };
}

export type ContentBlocks = SubtopicBlocks | TopicOverviewBlocks | Record<string, unknown>;

export interface DiagramOut {
  diagram_id: string;
  title?: string | null;
  caption?: string | null;
  display_order: number;
}

export interface ContentUnitOut {
  id: number;
  title?: string | null;
  blocks?: ContentBlocks | null;
  exam_keywords?: string[] | null;
  answer_language?: string[] | null;
  hidden_topics?: HiddenTopicEntry[] | null;
  review_status: string;
  display_order: number;
  diagrams: DiagramOut[];
}

export interface NodeContentOut {
  node_id: number;
  title: string;
  node_type: string;
  review_status: string;
  official_phrasing?: string | null;
  /** Honesty gate (design Property 8): false => `content` is null. */
  authored: boolean;
  content?: ContentUnitOut | null;
  children: NodeContentOut[];
}

export interface SyllabusNodeOut {
  node_id: number;
  title: string;
  node_type: string;
  review_status: string;
  authored: boolean;
  weight: number;
  display_order: number;
  official_phrasing?: string | null;
  children: SyllabusNodeOut[];
}

export interface SyllabusSectionOut {
  section_id: number;
  label?: string | null;
  name: string;
  display_order: number;
  nodes: SyllabusNodeOut[];
}

export interface SyllabusPaperOut {
  paper_id: number;
  label: string;
  name: string;
  display_order: number;
  sections: SyllabusSectionOut[];
}

export interface SyllabusTreeOut {
  slug: string;
  name: string;
  papers: SyllabusPaperOut[];
}

// ---------------------------------------------------------------------------
// PYQ explorer types (spec task 7.2 — mirror app/api/v1/optional/schemas.py)
// ---------------------------------------------------------------------------

export type PaperLabel = 'PAPER_I' | 'PAPER_II';
export type SectionLabel = 'SECTION_A' | 'SECTION_B';
export type PyqSort = 'year_desc' | 'year_asc';

export interface PyqOut {
  id: number;
  year: number;
  paper_label?: PaperLabel | null;
  section_label?: SectionLabel | null;
  question_text: string;
  marks?: number | null;
  beyond_syllabus: boolean;
  topic_node_id?: number | null;
  review_status: string;
}

export interface PyqFacetsOut {
  years: number[];
  papers: string[];
  sections: string[];
}

export interface PyqFiltersEcho {
  year?: number | null;
  paper?: string | null;
  section?: string | null;
  sort: PyqSort;
}

export interface PyqListOut {
  slug: string;
  name: string;
  total: number;
  filters: PyqFiltersEcho;
  facets: PyqFacetsOut;
  pyqs: PyqOut[];
}

/** Optional filter/sort params for the PYQ explorer listing (R6.1/R6.2/R6.3). */
export interface PyqQuery {
  year?: number | null;
  paper?: PaperLabel | null;
  section?: SectionLabel | null;
  /** Restrict the listing to PYQs filed under a syllabus topic node (R6.4). */
  topicNodeId?: number | null;
  sort?: PyqSort;
}

// ---------------------------------------------------------------------------
// Topic-wise PYQ grouping types (spec task 7.3 — R6.4)
// ---------------------------------------------------------------------------

/** A syllabus topic node and the student-visible PYQs filed beneath it (R6.4). */
export interface PyqTopicGroupOut {
  node_id: number;
  title: string;
  node_type: string;
  official_phrasing?: string | null;
  paper_label?: PaperLabel | null;
  paper_name?: string | null;
  section_label?: SectionLabel | null;
  section_name?: string | null;
  pyq_count: number;
  pyqs: PyqOut[];
}

/** The subject's student-visible PYQs grouped topic-wise (R6.4). */
export interface PyqByTopicOut {
  slug: string;
  name: string;
  total: number;
  group_count: number;
  groups: PyqTopicGroupOut[];
}

// ---------------------------------------------------------------------------
// Per-segment syllabus analysis types (spec task 7.4 — R4.4 / R4.5)
// ---------------------------------------------------------------------------

/** One "Hidden topics" entry — a theme asked beyond the printed syllabus. */
export interface SyllabusHiddenTopicEntry {
  topic: string;
  why: string;
}

/**
 * The three-layer analysis for a single syllabus segment (R4.5):
 * - `official` — official printed syllabus phrasing ("Official says").
 * - `trend_says` — the question trend (theme + insight + frequency).
 * - `hidden_topics` — themes asked beyond the printed syllabus, with rationale.
 *
 * Only reviewed+authored segments are ever returned (design Property 8).
 */
export interface SyllabusSegmentAnalysisOut {
  node_id: number;
  title: string;
  node_type: string;
  paper_label?: PaperLabel | null;
  paper_name?: string | null;
  section_label?: SectionLabel | null;
  section_name?: string | null;
  official: string[];
  trend_says: TrendPoint[];
  hidden_topics: SyllabusHiddenTopicEntry[];
}

/** The subject's per-segment three-layer syllabus analysis (R4.4 / R4.5). */
export interface SyllabusAnalysisOut {
  slug: string;
  name: string;
  segment_count: number;
  segments: SyllabusSegmentAnalysisOut[];
}

// ---------------------------------------------------------------------------
// Practice board types (spec task 8 — R7.1 / R7.2 / R7.3)
// ---------------------------------------------------------------------------

/** Per-topic practice status values (R7.3) — mirror the backend constants. */
export type PracticeStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PRACTICED';

/**
 * A practice topic node with the current student's practice status (R7.3).
 *
 * `authored` is the honesty gate (design Property 8): practice is only offered
 * for authored+reviewed topics; everything else shows the shared "not yet
 * authored" state. The status fields are derived purely from the requesting
 * student's own attempts (ownership — design Property 10): with no attempts
 * they are the honest zero-state (count 0, no timestamp, NOT_STARTED).
 */
export interface PracticeTopicStatusOut {
  node_id: number;
  title: string;
  node_type: string;
  authored: boolean;
  weight: number;
  display_order: number;
  attempt_count: number;
  /** ISO 8601 timestamp of the most recent attempt, or null if never. */
  last_practiced_at?: string | null;
  status: PracticeStatus;
}

export interface PracticeSectionOut {
  section_id: number;
  label?: string | null;
  name: string;
  display_order: number;
  topics: PracticeTopicStatusOut[];
}

export interface PracticePaperOut {
  paper_id: number;
  label: string;
  name: string;
  display_order: number;
  sections: PracticeSectionOut[];
}

/** The subject's practice topics organized under the syllabus tree (R7.1). */
export interface PracticeBoardOut {
  slug: string;
  name: string;
  total_topics: number;
  authored_topics: number;
  practiced_topics: number;
  papers: PracticePaperOut[];
}

// ---------------------------------------------------------------------------
// Speak-to-fill transcription types (spec task 9.2 — R8.2/R8.3/R8.4/R20.3)
// ---------------------------------------------------------------------------

/** A contiguous transcribed span with timing + per-segment confidence. */
export interface SttSegmentOut {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

/**
 * A speak-to-fill transcription result (R8.2/R8.3/R8.4/R20.3).
 *
 * `text` is the transcript that, once accepted, becomes part of the draft that
 * will be evaluated (R8.3). `low_confidence` (`confidence < threshold`) is the
 * gating signal (design Property 7): when true the UI must route the student
 * through an explicit review/correct step before the transcript fills the
 * answer segment, rather than committing it silently (R8.4 / R20.3).
 */
export interface TranscriptionOut {
  text: string;
  confidence: number;
  threshold: number;
  low_confidence: boolean;
  provider: string;
  segments: SttSegmentOut[];
}

// ---------------------------------------------------------------------------
// Handwritten-image OCR types (spec task 9.3 — R9.1/R9.3/R20.1)
// ---------------------------------------------------------------------------

/** A detected text block/region within the uploaded image. */
export interface OcrBlockOut {
  text: string;
  confidence: number;
  /** Optional normalised [x0, y0, x1, y1] box (fractions of width/height). */
  bbox?: number[] | null;
}

/**
 * A handwritten-image OCR result (R9.1/R9.3/R20.1).
 *
 * `text` is the transcribed handwriting that, once accepted, feeds the draft
 * that will be evaluated (R9.1; evaluation is task 9.4). `low_confidence`
 * (`confidence < threshold`) is the gating signal (design Property 7): when
 * true the UI must inform the student and offer a fallback (review/correct,
 * type instead, or re-upload) before the text fills the answer — never commit
 * a shaky OCR result silently (R9.3 / R20.1).
 */
export interface HandwritingOcrOut {
  text: string;
  confidence: number;
  threshold: number;
  low_confidence: boolean;
  provider: string;
  blocks: OcrBlockOut[];
}

// ---------------------------------------------------------------------------
// Answer evaluation types (spec task 9.4 — R9.2 / R9.4 / R9.5)
// ---------------------------------------------------------------------------

export type AnswerMode = 'TYPED' | 'SPOKEN' | 'HANDWRITTEN';

/**
 * A student's answer draft submitted for evaluation (R9.2).
 *
 * Carries the three-part typed composition and/or a combined `raw_text` plus
 * prompt context. For spoken/handwritten drafts the originating provider
 * confidence is passed through so the backend can apply confidence gating
 * (design Property 7): a low-confidence draft that has NOT been reviewed
 * (`confidence_acknowledged` false) is not auto-graded.
 */
export interface AnswerSubmitIn {
  mode: AnswerMode;
  intro_text?: string | null;
  body_text?: string | null;
  conclusion_text?: string | null;
  raw_text?: string | null;
  topic_node_id?: number | null;
  question_text?: string | null;
  pyq_id?: number | null;
  stt_confidence?: number | null;
  ocr_confidence?: number | null;
  source_media_ref?: string | null;
  confidence_acknowledged?: boolean;
}

/** Feedback for one produced evaluation-report section (R9.2). */
export interface EvaluationSectionOut {
  feedback: string;
  score?: number | null;
}

/**
 * A persisted, student-visible evaluation report (R9.2/R9.4/R9.5).
 *
 * `is_complete` is true only when `incomplete_sections` is empty (design
 * Property 6). Sections the model could not produce are listed in
 * `incomplete_sections` and the report is honestly marked incomplete — never
 * presented as complete or fabricated.
 */
export interface EvaluationReportOut {
  report_id?: number | null;
  attempt_id: number;
  sections: Record<string, EvaluationSectionOut>;
  incomplete_sections: string[];
  is_complete: boolean;
  overall_score?: number | null;
}

/**
 * The result of submitting an answer for evaluation (R9.2/R9.4/R9.5).
 *
 * When `review_required` is true (and `low_confidence` true) the spoken /
 * handwritten input fell below the confidence threshold and was not explicitly
 * reviewed, so it was NOT auto-graded (design Property 7); `report` is null and
 * `message` explains the review/correct step. Otherwise `report` carries the
 * (possibly incomplete) evaluation report and the attempt is persisted.
 */
export interface AnswerEvaluationOut {
  attempt_id: number;
  mode: AnswerMode;
  status: string;
  review_required: boolean;
  low_confidence: boolean;
  report?: EvaluationReportOut | null;
  message?: string | null;
}

// ---------------------------------------------------------------------------
// Gap / progress types (spec task 11 — R12.1 / R12.2 / R12.3 / R12.4)
// ---------------------------------------------------------------------------

/** Tracked-activity event types that mark a syllabus node covered (R12.2). */
export type ProgressEventType = 'READ_COMPLETE' | 'PRACTICE_PASS' | 'RECALL_THRESHOLD';

/** A tracked-activity event recorded against a syllabus node (R12.2). */
export interface ProgressEventIn {
  syllabus_node_id: number;
  event_type: ProgressEventType;
  value?: number | null;
  metadata?: Record<string, unknown> | null;
}

/** Per-paper coverage breakdown for the gap panel (R12.3). */
export interface GapPaperOut {
  paper_id: number;
  label: string;
  name: string;
  display_order: number;
  covered_percent: number;
  remaining_percent: number;
  total_nodes: number;
  covered_nodes: number;
}

/**
 * The subject's weighted coverage for the requesting student (R12.3/R12.4).
 *
 * `covered_percent` is `Σ weight(covered) / Σ weight(all) × 100` over the
 * weighted syllabus tree (design Property 2); `remaining_percent` is
 * `100 − covered_percent` (the two always sum to 100). Derived purely from the
 * student's own progress events (ownership — design Property 10): with no
 * activity the honest zero-state is 0% covered / 100% remaining.
 */
export interface GapPanelOut {
  slug: string;
  name: string;
  covered_percent: number;
  remaining_percent: number;
  total_nodes: number;
  covered_nodes: number;
  papers: GapPaperOut[];
}

// ---------------------------------------------------------------------------
// Recall-LMS types (spec task 12 — R13 / R14 / R20)
// ---------------------------------------------------------------------------

/** A video segment of a subject's lesson (R13.1). Checklist is not exposed. */
export interface RecallSegmentOut {
  segment_id: number;
  subject_id: number;
  title: string;
  segment_order: number;
  video_ref?: string | null;
  duration_seconds?: number | null;
  concept_count: number;
}

/** The subject's ordered recall segments; empty = none authored yet (honest). */
export interface RecallSegmentListOut {
  slug: string;
  name: string;
  total: number;
  segments: RecallSegmentOut[];
}

/** A credited concept in the recall explanation (R14.5). */
export interface RecallMatchedConceptOut {
  concept: string;
  status: string;
  evidence: string;
}

/**
 * The result of one recall turn (R14.1/R14.3/R14.5).
 *
 * `recall_score` is the cumulative session score in [0, 1] after this turn (it
 * only rises or holds across turns — design Property 3). `matched`/`missed` are
 * the explanation; when below 100% a Socratic `hint` toward `hint_target` is
 * included (R14.2/R14.4). `stt_low_confidence` flags an uncertain transcript.
 */
export interface RecallTurnResultOut {
  session_id: number;
  turn_order: number;
  transcript: string;
  stt_confidence: number;
  stt_low_confidence: boolean;
  recall_score: number;
  recall_percent: number;
  matched: RecallMatchedConceptOut[];
  missed: string[];
  hint?: string | null;
  hint_target?: string | null;
  complete: boolean;
}

/** A recall session with its ordered turns (reload-on-return, R15). */
export interface RecallSessionStateOut {
  session_id: number;
  segment_id: number;
  status: string;
  recall_score: number;
  recall_percent: number;
  turns: RecallTurnResultOut[];
}

// ---------------------------------------------------------------------------
// Subject selection + entitlement types (spec task 13 — R1.3 / R15 / R16)
// ---------------------------------------------------------------------------

/**
 * The student's persisted optional-subject selection (R1.3 / R15).
 * `selected` is false (other fields null) when none is chosen yet.
 */
export interface SubjectSelectionOut {
  selected: boolean;
  slug?: string | null;
  name?: string | null;
  subject_id?: number | null;
  selected_at?: string | null;
}

/**
 * The entitlement decision for a subject (R16). The UI gates premium content on
 * `allowed` and shows `upgrade_path` when restricted. A safe configurable
 * default applies until the real entitlement engine is wired.
 */
export interface AccessOut {
  slug: string;
  allowed: boolean;
  premium: boolean;
  reason: string;
  upgrade_path?: string | null;
}

// ---------------------------------------------------------------------------
// Geography Mapping types (spec task 10 — R10)
// ---------------------------------------------------------------------------

/** A clickable map location with UPSC-style detail (R10.3). */
export interface MapLocationOut {
  id: number;
  name: string;
  category: string;
  latitude?: number | null;
  longitude?: number | null;
  detail?: string | null;
  display_order: number;
}

/** A student-visible (REVIEWED) previous-year map-based question (R10.1). */
export interface MapQuestionOut {
  id: number;
  year: number;
  category: string;
  question_text: string;
  marks?: number | null;
  beyond_syllabus: boolean;
  location_id?: number | null;
}

/** A feature category (river / plateau / plain / …) with its map content (R10.2). */
export interface MapCategoryGroupOut {
  category: string;
  location_count: number;
  question_count: number;
  locations: MapLocationOut[];
  questions: MapQuestionOut[];
}

/**
 * The subject's reviewed mapping content organized category-wise (R10).
 * Only REVIEWED items appear (design Property 8); an empty `categories` list is
 * the honest "no reviewed mapping content yet" state (draft mapping is gated).
 */
export interface MappingOut {
  slug: string;
  name: string;
  category_count: number;
  location_count: number;
  question_count: number;
  categories: MapCategoryGroupOut[];
}

// ---------------------------------------------------------------------------
// Per-subject framework types (spec task 15 — R11 / R19)
// ---------------------------------------------------------------------------

/** The papers/sections shape a subject declares (R11.1). */
export interface SubjectPaperShapeOut {
  label: string;
  sections: string[];
}

/**
 * The DB-backed per-subject configuration (R11). `features` is the list of
 * enabled feature-module keys (e.g. "read", "pyq", "practice", "answer",
 * "mapping", "diagrams", "gap", "recall", "currentAffairs"); the frontend
 * mounts subject-specific features by this config via `SubjectFeatureSlot`.
 */
export interface SubjectConfigOut {
  slug: string;
  name: string;
  is_complete: boolean;
  features: string[];
  papers: SubjectPaperShapeOut[];
  completeness_status?: Record<string, unknown> | null;
}

/** Per-feature availability for the completeness surface (spec task 16.2). */
export interface CompletenessFeatureOut {
  feature: string;
  available: boolean;
}

/**
 * A backend-derived, student-facing completeness status for a subject
 * (spec task 16.2 — R3.5/R19.3). Honest reviewed-vs-total counts + which
 * feature modules actually have student-visible (REVIEWED) content.
 */
export interface SubjectCompletenessOut {
  slug: string;
  name: string;
  is_complete: boolean;
  status_label: string;
  reviewed_topics: number;
  total_topics: number;
  reviewed_content_units: number;
  total_content_units: number;
  reviewed_pyqs: number;
  features: CompletenessFeatureOut[];
}

// ---------------------------------------------------------------------------
// Subject-specific Current-Affairs feature types (spec task 17.1 — R11.4)
// ---------------------------------------------------------------------------

/** A student-visible (REVIEWED) current-affairs item (R11.4). */
export interface CurrentAffairsItemOut {
  id: number;
  title: string;
  topic?: string | null;
  summary?: string | null;
  source_url?: string | null;
  published_on?: string | null;
  display_order: number;
}

/** The subject's reviewed current-affairs feed (R11.4). Empty = none reviewed yet. */
export interface CurrentAffairsFeedOut {
  slug: string;
  name: string;
  total: number;
  topics: string[];
  items: CurrentAffairsItemOut[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const unwrap = <T>(data: unknown): T => {
  const record = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
  return (record.data ?? record) as T;
};

/**
 * Derive an upload filename whose extension matches the recorded audio's MIME
 * type. Browser `MediaRecorder` produces webm/ogg/mp4 depending on the platform
 * (Safari records mp4/m4a), so a hard-coded `.webm` name mislabels the clip. The
 * backend keys transcription off the multipart part's content-type (the Blob's
 * `type`), but a matching extension keeps logs/storage honest and consistent
 * with the legacy `upscSpeechService`.
 */
const audioUploadName = (audio: Blob, fallback = 'answer'): string => {
  const type = (audio.type || '').toLowerCase();
  let ext = 'webm';
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) ext = 'm4a';
  else if (type.includes('ogg')) ext = 'ogg';
  else if (type.includes('wav')) ext = 'wav';
  else if (type.includes('mpeg') || type.includes('mp3')) ext = 'mp3';
  return `${fallback}.${ext}`;
};

export const optionalService = {
  /** Fetch the subject's syllabus tree (papers → sections → topics → subtopics). */
  getSyllabusTree: async (slug: string): Promise<SyllabusTreeOut> => {
    const response = await apiClient.get(`optional/${slug}/syllabus-tree`);
    return unwrap<SyllabusTreeOut>(response.data);
  },

  /** Fetch a syllabus node's reviewed content + child subtopics. */
  getTopicContent: async (slug: string, nodeId: number): Promise<NodeContentOut> => {
    const response = await apiClient.get(`optional/${slug}/topics/${nodeId}/content`);
    return unwrap<NodeContentOut>(response.data);
  },

  /**
   * Fetch the subject's student-visible (REVIEWED) PYQs (spec task 7.2).
   *
   * Supports optional year/paper/section filtering (R6.2/R6.3/R6.5) and
   * year-wise sorting (R6.1). The response includes `facets` (distinct years /
   * papers / sections that have data) so the UI can build stable filter
   * controls. Unreviewed/draft PYQs are gated out server-side.
   */
  getPyqs: async (slug: string, query: PyqQuery = {}): Promise<PyqListOut> => {
    const params: Record<string, string | number> = {};
    if (query.year != null) params.year = query.year;
    if (query.paper) params.paper = query.paper;
    if (query.section) params.section = query.section;
    if (query.topicNodeId != null) params.topic_node_id = query.topicNodeId;
    if (query.sort) params.sort = query.sort;
    const response = await apiClient.get(`optional/${slug}/pyqs`, { params });
    return unwrap<PyqListOut>(response.data);
  },

  /**
   * Fetch the subject's student-visible (REVIEWED) PYQs grouped topic-wise
   * under the syllabus tree (spec task 7.3 — R6.4).
   *
   * Each group is a syllabus topic node (id + title + the node's paper/section)
   * with the list of its PYQs, ordered by syllabus position. Powers the
   * PyqExplorer "By topic" solving view. Unreviewed/draft PYQs are gated out
   * server-side (design Property 8); PYQs with no syllabus mapping are omitted
   * from the grouped view.
   */
  getPyqsByTopic: async (slug: string): Promise<PyqByTopicOut> => {
    const response = await apiClient.get(`optional/${slug}/pyqs/by-topic`);
    return unwrap<PyqByTopicOut>(response.data);
  },

  /**
   * Fetch the subject's per-segment three-layer syllabus analysis
   * (spec task 7.4 — R4.4 / R4.5).
   *
   * One call returns, per **reviewed+authored** syllabus segment, the three
   * layers a student sees on opening that segment: the official phrasing
   * ("Official says"), the question trend ("Trend says": theme + insight +
   * frequency) and the hidden topics asked beyond the printed syllabus. The
   * backend gates out unreviewed/draft segments (design Property 8 / R17.3),
   * so the `SyllabusView` only ever renders reviewed content; an empty
   * `segments` list is the honest "nothing authored yet" signal.
   */
  getSyllabusAnalysis: async (slug: string): Promise<SyllabusAnalysisOut> => {
    const response = await apiClient.get(`optional/${slug}/syllabus-analysis`);
    return unwrap<SyllabusAnalysisOut>(response.data);
  },

  /**
   * Fetch the subject's practice topics organized under the syllabus tree,
   * with the current student's per-topic practice status (spec task 8 —
   * R7.1/R7.2/R7.3).
   *
   * The backend returns papers → sections → topics (R7.1) and overlays, per
   * topic, the requesting student's attempt count, last-practiced timestamp and
   * derived status (NOT_STARTED / IN_PROGRESS / PRACTICED — R7.3). Each topic
   * carries an `authored` honesty flag so the UI only offers a practice
   * call-to-action (R7.2) where reviewed content exists; everything else shows
   * the shared "not yet authored" state. Status is gated to the student
   * (ownership — design Property 10), so a student with no attempts gets the
   * honest zero-state rather than fabricated activity.
   */
  getPracticeStatus: async (slug: string): Promise<PracticeBoardOut> => {
    const response = await apiClient.get(`optional/${slug}/practice/status`);
    return unwrap<PracticeBoardOut>(response.data);
  },

  /**
   * Transcribe a spoken-answer audio blob into text via the backend's shared
   * STT provider (spec task 9.2 — R8.2/R8.3/R8.4/R20.3).
   *
   * Sends the recorded audio as multipart to `POST /api/v1/optional/transcribe`
   * along with the subject slug (for per-subject vocabulary biasing — R20.2)
   * and an optional extra `vocabularyHint`. The returned transcript is the
   * exact text that, once the student accepts it, becomes part of the draft
   * that will be evaluated (R8.3).
   *
   * The response carries `low_confidence` (`confidence < threshold`): when true
   * the caller MUST route the student through a review/correct step before the
   * transcript fills the answer segment (R8.4 / R20.3), rather than committing
   * it silently. Real transcription requires a configured Whisper backend; the
   * deterministic mock provider is the dev/test default.
   */
  transcribeAudio: async (
    slug: string,
    audio: Blob,
    options: { vocabularyHint?: string; filename?: string } = {},
  ): Promise<TranscriptionOut> => {
    const form = new FormData();
    form.append('audio', audio, options.filename ?? audioUploadName(audio, 'answer'));
    if (slug) form.append('subject', slug);
    if (options.vocabularyHint) form.append('vocabulary_hint', options.vocabularyHint);
    const response = await apiClient.post('optional/transcribe', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<TranscriptionOut>(response.data);
  },

  /**
   * Extract handwritten text from an uploaded image via the backend's shared
   * OCR provider (spec task 9.3 — R9.1/R9.3/R20.1).
   *
   * Sends the image as multipart to `POST /api/v1/optional/ocr` along with the
   * subject slug. The returned text is the transcribed handwriting that, once
   * the student accepts it, feeds the draft that will be evaluated (R9.1;
   * evaluation is task 9.4).
   *
   * The response carries `low_confidence` (`confidence < threshold`): when true
   * the caller MUST inform the student and offer a fallback (review/correct,
   * type instead, or re-upload) before the text fills the answer (R9.3 /
   * R20.1), rather than committing a shaky extraction silently. Real OCR
   * requires a configured Gemini-Vision backend (routed through the shared
   * inference gateway); the deterministic mock provider is the dev/test default.
   */
  extractHandwriting: async (
    slug: string,
    image: Blob,
    options: { filename?: string } = {},
  ): Promise<HandwritingOcrOut> => {
    const form = new FormData();
    const fallbackName =
      image instanceof File && image.name ? image.name : 'handwritten-answer.png';
    form.append('image', image, options.filename ?? fallbackName);
    if (slug) form.append('subject', slug);
    const response = await apiClient.post('optional/ocr', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<HandwritingOcrOut>(response.data);
  },

  /**
   * Submit a composed answer draft for AI evaluation and persistence
   * (spec task 9.4 — R9.2/R9.4/R9.5).
   *
   * Posts the draft to `POST /api/v1/optional/{slug}/answers`. The backend
   * builds a topic-aware rubric, runs the draft through the shared evaluation
   * provider (Gemini via the inference gateway in production; a deterministic
   * mock in dev/test) and persists an attempt + report.
   *
   * Two honest outcomes (mirroring the backend):
   * - evaluated: `review_required` false and `report` carries the (possibly
   *   incomplete) report. A report is `is_complete` only when no sections are
   *   flagged in `incomplete_sections` (design Property 6) — incomplete reports
   *   are surfaced honestly, never as complete.
   * - needs review: `review_required` true — a low-confidence spoken/handwritten
   *   draft was not auto-graded (design Property 7). Resubmit with
   *   `confidence_acknowledged: true` after the student reviews the text.
   */
  submitAnswer: async (
    slug: string,
    payload: AnswerSubmitIn,
  ): Promise<AnswerEvaluationOut> => {
    const response = await apiClient.post(`optional/${slug}/answers`, payload);
    return unwrap<AnswerEvaluationOut>(response.data);
  },

  /**
   * Fetch the persisted evaluation report for one of the student's own attempts
   * (spec task 9.4 — R9.5). Ownership is enforced server-side (design Property
   * 10): another student's report is never returned.
   */
  getAnswerReport: async (attemptId: number): Promise<EvaluationReportOut> => {
    const response = await apiClient.get(`optional/answers/${attemptId}/report`);
    return unwrap<EvaluationReportOut>(response.data);
  },

  /**
   * Fetch the student's weighted syllabus coverage for the subject
   * (spec task 11 — R12.3/R12.4). Returns overall covered% / remaining% plus a
   * per-paper breakdown, computed from the student's own progress events
   * (ownership — design Property 10). With no activity it is the honest
   * zero-state (0% covered / 100% remaining).
   */
  getProgress: async (slug: string): Promise<GapPanelOut> => {
    const response = await apiClient.get(`optional/${slug}/progress`);
    return unwrap<GapPanelOut>(response.data);
  },

  /**
   * Record a tracked-activity event (read completion / practice pass / recall
   * threshold) against a syllabus node and return the freshly recomputed
   * coverage (spec task 11 — R12.2). Recording any qualifying event against a
   * node marks it covered for the student, advancing the gap figure.
   */
  recordProgressEvent: async (
    slug: string,
    payload: ProgressEventIn,
  ): Promise<GapPanelOut> => {
    const response = await apiClient.post(`optional/${slug}/progress/events`, payload);
    return unwrap<GapPanelOut>(response.data);
  },

  /**
   * List the subject's recall video segments (spec task 12 — R13.1). The
   * concept checklist is not exposed (recall isn't given away); an empty list
   * is the honest "no recall lessons authored yet" state.
   */
  getRecallSegments: async (slug: string): Promise<RecallSegmentListOut> => {
    const response = await apiClient.get(`optional/${slug}/segments`);
    return unwrap<RecallSegmentListOut>(response.data);
  },

  /**
   * Start a recall session for a segment: upload the spoken recall, get back the
   * scored, explainable result + an adaptive hint when below 100% (spec task 12
   * — R13/R14). The audio is sent multipart; the backend transcribes (STT),
   * concept-matches, scores, and persists the first turn.
   */
  startRecall: async (
    segmentId: number,
    audio: Blob,
    options: { filename?: string } = {},
  ): Promise<RecallTurnResultOut> => {
    const form = new FormData();
    form.append('audio', audio, options.filename ?? audioUploadName(audio, 'recall'));
    const response = await apiClient.post(`optional/segments/${segmentId}/recall`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<RecallTurnResultOut>(response.data);
  },

  /**
   * Append a follow-up recall turn answering a hint (spec task 12 — R14.3).
   * Only newly recalled concepts raise the cumulative score (design Property 3).
   */
  respondRecall: async (
    sessionId: number,
    audio: Blob,
    options: { filename?: string } = {},
  ): Promise<RecallTurnResultOut> => {
    const form = new FormData();
    form.append('audio', audio, options.filename ?? audioUploadName(audio, 'recall'));
    const response = await apiClient.post(`optional/recall/${sessionId}/respond`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<RecallTurnResultOut>(response.data);
  },

  /** Fetch a recall session's state + ordered turns (reload-on-return, R15). */
  getRecallSession: async (sessionId: number): Promise<RecallSessionStateOut> => {
    const response = await apiClient.get(`optional/recall/${sessionId}`);
    return unwrap<RecallSessionStateOut>(response.data);
  },

  /**
   * Fetch the student's backend-persisted optional-subject selection
   * (spec task 13.1 — R1.3/R15.3). Reloads across devices, unlike client-only
   * storage. Returns the honest "none selected" state for a fresh student.
   */
  getSelection: async (): Promise<SubjectSelectionOut> => {
    const response = await apiClient.get('optional/selection');
    return unwrap<SubjectSelectionOut>(response.data);
  },

  /**
   * Persist the student's active optional-subject selection to the backend
   * (spec task 13.1 — R1.3/R15.2). Switching replaces the prior active choice.
   */
  setSelection: async (slug: string): Promise<SubjectSelectionOut> => {
    const response = await apiClient.put('optional/selection', { slug });
    return unwrap<SubjectSelectionOut>(response.data);
  },

  /**
   * Fetch the entitlement decision for a subject (spec task 13.2 — R16). The
   * caller gates premium content on `allowed` and shows `upgrade_path` when
   * restricted. A safe default applies until the real engine is wired.
   */
  getAccess: async (slug: string): Promise<AccessOut> => {
    const response = await apiClient.get(`optional/${slug}/access`);
    return unwrap<AccessOut>(response.data);
  },

  /**
   * Fetch the subject's reviewed mapping content, organized category-wise
   * (spec task 10 — R10). Returns clickable locations (with UPSC-style detail)
   * and previous-year map questions per feature category. Only REVIEWED items
   * are returned (design Property 8); draft/seeded mapping stays gated, so an
   * empty `categories` list is the honest "not yet authored/reviewed" state.
   */
  getMapping: async (slug: string): Promise<MappingOut> => {
    const response = await apiClient.get(`optional/${slug}/mapping`);
    return unwrap<MappingOut>(response.data);
  },

  /**
   * Fetch the subject's DB-backed configuration (spec task 15 — R11): enabled
   * feature modules + papers/sections shape + completeness. The UI mounts
   * subject-specific features by this config (`SubjectFeatureSlot`), so adding a
   * subject is content + config, not new code.
   */
  getSubjectConfig: async (slug: string): Promise<SubjectConfigOut> => {
    const response = await apiClient.get(`optional/${slug}/config`);
    return unwrap<SubjectConfigOut>(response.data);
  },

  /**
   * Fetch the subject's backend-derived completeness status (spec task 16.2 —
   * R3.5/R19.3): honest reviewed-vs-total counts + per-feature availability.
   * A subject is "complete" only when its content genuinely exists and is
   * reviewed, so the UI can surface an accurate status instead of guessing.
   */
  getSubjectCompleteness: async (slug: string): Promise<SubjectCompletenessOut> => {
    const response = await apiClient.get(`optional/${slug}/completeness`);
    return unwrap<SubjectCompletenessOut>(response.data);
  },

  /**
   * Fetch the subject's reviewed current-affairs feed (spec task 17.1 — R11.4).
   * A subject-specific feature shown only when the subject's config enables the
   * `currentAffairs` module. Only REVIEWED items are returned (design Property
   * 8); an empty `items` list is the honest "no reviewed current affairs yet".
   */
  getCurrentAffairs: async (slug: string): Promise<CurrentAffairsFeedOut> => {
    const response = await apiClient.get(`optional/${slug}/current-affairs`);
    return unwrap<CurrentAffairsFeedOut>(response.data);
  },
};
