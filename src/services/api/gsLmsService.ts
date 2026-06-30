import { apiClient } from './client';

/**
 * API client for the GS LMS Platform (multi-subject).
 *
 * Wraps all `/api/v1/gs-lms/{subject}/*` backend endpoints with typed
 * request/response interfaces, mirroring the established `optionalService.ts`
 * pattern: single exported object, shared `apiClient`, `unwrap` helper.
 *
 * Every method accepts a `subject` slug as the first parameter (default:
 * "geography") so existing callers continue to work without modification
 * while new subjects can be added seamlessly.
 *
 * Auth is handled centrally by the shared `apiClient` request interceptor
 * (Bearer token), matching every other service in this codebase.
 */

// ---------------------------------------------------------------------------
// Types — mirror backend Pydantic schemas (app/api/v1/gs_lms/schemas.py)
// ---------------------------------------------------------------------------

// -- Syllabus Tree ----------------------------------------------------------

export interface SyllabusNodeOut {
  node_id: number;
  title: string;
  node_type: 'MEGA_TOPIC' | 'SUB_TOPIC' | 'LEAF_TOPIC';
  weight: number;
  display_order: number;
  review_status: string;
  completion_percent: number | null;
  completed: boolean | null;
  day_lesson_id: number | null;
  ordering_justification: string | null;
  children: SyllabusNodeOut[];
}

export interface SyllabusTreeOut {
  subject_id: number;
  subject_name: string;
  total_nodes: number;
  tree: SyllabusNodeOut[];
}

// -- Content Sections (Progressive Disclosure) ------------------------------

export interface ContentSectionOut {
  section_id: number;
  section_label: 'BASIC' | 'ADVANCED' | 'NCERT_LEVEL' | 'CURRENT_AFFAIRS' | 'EXAMINER_TRAPS';
  title: string;
  display_order: number;
  locked: boolean;
  completed: boolean;
  skippable: boolean;
  blocks: ContentBlock[] | null;
}

export interface TopicSectionsOut {
  node_id: number;
  title: string;
  discussion_gate_passed: boolean;
  topic_completed: boolean;
  video_url: string | null;
  video_watched: boolean;
  learner_level: string | null;
  sections: ContentSectionOut[];
}

/** Typed content blocks from backend — flexible structure. */
export type ContentBlock = Record<string, unknown>;

// -- PYQs -------------------------------------------------------------------

export interface PyqOut {
  id: number;
  year: number;
  exam_type: 'PRELIMS' | 'MAINS';
  question_text: string;
  question_type: string | null;
  marks: number | null;
  answer_text: string | null;
  explanation: string | null;
  revealed: boolean;
}

export interface PyqListOut {
  node_id: number;
  title: string;
  exam_type_filter: string | null;
  total: number;
  pyqs: PyqOut[];
}

// -- MCQ Practice -----------------------------------------------------------

export interface McqOptionOut {
  label: string;
  text: string;
}

export interface McqQuestionOut {
  question_id: number;
  question_text: string;
  question_type: string;
  options: McqOptionOut[];
  display_order: number;
}

export interface PracticeSessionOut {
  session_id: number;
  syllabus_node_id: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED';
  total_questions: number;
  current_index: number;
  current_question: McqQuestionOut | null;
  started_at: string;
}

export interface PracticeAttemptResultOut {
  question_id: number;
  chosen_answer: string | null;
  correct_answer: string;
  is_correct: boolean | null;
  question_type: string;
  explanation: string | null;
  time_taken_seconds: number | null;
}

export interface QuestionTypeAccuracyOut {
  question_type: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface PracticeResultOut {
  session_id: number;
  total_questions: number;
  correct_count: number;
  score: number;
  attempts: PracticeAttemptResultOut[];
  type_accuracy: QuestionTypeAccuracyOut[];
  submitted_at: string;
}

// -- AI Discussion ----------------------------------------------------------

export interface DiscussionTurnOut {
  turn_order: number;
  role: 'student' | 'ai';
  content: string;
  created_at: string;
}

export interface DiscussionSessionOut {
  session_id: number;
  syllabus_node_id: number;
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  started_at: string;
  completed_at: string | null;
  turns: DiscussionTurnOut[];
}

export interface DiscussionTurnResponseOut {
  session_id: number;
  status: string;
  student_turn: DiscussionTurnOut;
  ai_turn: DiscussionTurnOut;
  gate_passed: boolean;
  concepts_matched: string[] | null;
  concepts_missed: string[] | null;
  match_percentage: number | null;
}

// -- Progress / Gaps --------------------------------------------------------

export interface WeakTopicOut {
  node_id: number;
  title: string;
  accuracy: number;
  attempt_count: number;
}

export interface WeakQuestionTypeOut {
  question_type: string;
  accuracy: number;
  attempt_count: number;
}

export interface RecommendedActionOut {
  action: string;
  target_node_id: number | null;
  reason: string;
}

export interface GapOut {
  overall_accuracy: number;
  weak_topics: WeakTopicOut[];
  weak_question_types: WeakQuestionTypeOut[];
  recommended_actions: RecommendedActionOut[];
  computed_at: string;
}

export interface MegaTopicProgressOut {
  node_id: number;
  title: string;
  total_children: number;
  completed_children: number;
  completion_percent: number;
}

export interface ProgressOut {
  total_topics: number;
  completed_topics: number;
  overall_percent: number;
  mega_topics: MegaTopicProgressOut[];
}

// -- Daily Planner ----------------------------------------------------------

export interface PlanItemOut {
  node_id: number;
  title: string;
  item_type: 'section' | 'practice' | 'revisit' | 'retro';
  completed: boolean;
  completed_at: string | null;
  revisit_id: number | null;
  revisit_type: string | null;
  overdue: boolean;
}

export interface DailyPlanOut {
  plan_date: string;
  bandwidth: number;
  planned_items: PlanItemOut[];
  completed_count: number;
  is_target_met: boolean | null;
  projected_completion_date: string | null;
  streak_days: number;
}

export interface ReplanOut {
  reason: string;
  old_bandwidth: number;
  new_bandwidth: number;
  old_projected_date: string | null;
  new_projected_date: string | null;
  triggered_at: string;
}

// -- Onboarding -------------------------------------------------------------

export interface OnboardingStatusOut {
  completed: boolean;
  completed_at: string | null;
  bandwidth_selected: number | null;
  first_topic_id: number | null;
  first_topic_title: string | null;
  learner_level: string | null;
  study_window_minutes: number | null;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const unwrap = <T>(data: unknown): T => {
  const record = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
  return (record.data ?? record) as T;
};

export const gsLmsService = {
  // -------------------------------------------------------------------------
  // Syllabus
  // -------------------------------------------------------------------------

  /**
   * Fetch the full syllabus tree (mega-topics → sub-topics → leaves).
   * @fulfills Requirement 1.1, 2.1
   */
  getSyllabusTree: async (subject = "geography"): Promise<SyllabusTreeOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/syllabus`);
    return unwrap<SyllabusTreeOut>(response.data);
  },

  /**
   * Fetch a single syllabus node by ID with its children.
   * @fulfills Requirement 1.1
   */
  getSyllabusNode: async (subject = "geography", nodeId: number): Promise<SyllabusNodeOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/syllabus/${nodeId}`);
    return unwrap<SyllabusNodeOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Content (Progressive Disclosure)
  // -------------------------------------------------------------------------

  /**
   * Fetch the four progressive-disclosure sections for a topic.
   * @fulfills Requirement 1.1, 3.1
   */
  getTopicSections: async (subject = "geography", nodeId: number): Promise<TopicSectionsOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/topics/${nodeId}/sections`);
    return unwrap<TopicSectionsOut>(response.data);
  },

  /**
   * Mark a content section as completed, unlocking the next section.
   * @fulfills Requirement 1.1, 3.3
   */
  completeSection: async (subject = "geography", nodeId: number, sectionId: number): Promise<void> => {
    await apiClient.post(`gs-lms/${subject}/topics/${nodeId}/sections/${sectionId}/complete`);
  },

  /**
   * Mark a topic's video as watched (persist optional watch duration).
   * @fulfills Requirement 1.2, 1.3
   */
  markVideoWatched: async (subject = "geography", nodeId: number, durationSeconds?: number): Promise<void> => {
    const payload: Record<string, unknown> = {};
    if (durationSeconds != null) payload.duration_seconds = durationSeconds;
    await apiClient.post(`gs-lms/${subject}/topics/${nodeId}/video/watched`, payload);
  },

  // -------------------------------------------------------------------------
  // PYQs
  // -------------------------------------------------------------------------

  /**
   * Fetch PYQs for a topic, optionally filtered by exam type.
   * @fulfills Requirement 1.1, 4.1
   */
  getTopicPyqs: async (subject = "geography", nodeId: number, examType?: string): Promise<PyqListOut> => {
    const params: Record<string, string> = {};
    if (examType) params.exam_type = examType;
    const response = await apiClient.get(`gs-lms/${subject}/topics/${nodeId}/pyqs`, { params });
    return unwrap<PyqListOut>(response.data);
  },

  /**
   * Reveal the answer/explanation for a PYQ (persists server-side).
   * @fulfills Requirement 1.1, 4.2, 4.4
   */
  revealPyqAnswer: async (subject = "geography", pyqId: number): Promise<PyqOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/pyqs/${pyqId}/reveal`);
    return unwrap<PyqOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Practice (Sequential MCQ)
  // -------------------------------------------------------------------------

  /**
   * Start a new practice session for a topic.
   * @fulfills Requirement 1.1, 5.1
   */
  startPractice: async (subject = "geography", nodeId: number): Promise<PracticeSessionOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/practice/start`, {
      syllabus_node_id: nodeId,
    });
    return unwrap<PracticeSessionOut>(response.data);
  },

  /**
   * Submit an answer for the current practice question.
   * @fulfills Requirement 1.1, 5.2
   */
  answerQuestion: async (
    subject = "geography",
    sessionId: number,
    answer: string,
    timeTakenSeconds?: number,
  ): Promise<PracticeSessionOut> => {
    const payload: Record<string, unknown> = { chosen_answer: answer };
    if (timeTakenSeconds != null) payload.time_taken_seconds = timeTakenSeconds;
    const response = await apiClient.post(
      `gs-lms/${subject}/practice/${sessionId}/answer`,
      payload,
    );
    return unwrap<PracticeSessionOut>(response.data);
  },

  /**
   * Skip the current practice question and advance.
   * @fulfills Requirement 1.1, 5.3
   */
  skipQuestion: async (subject = "geography", sessionId: number): Promise<PracticeSessionOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/practice/${sessionId}/skip`);
    return unwrap<PracticeSessionOut>(response.data);
  },

  /**
   * Fetch an active practice session by ID (for session recovery).
   * @fulfills Requirement 5.1, 5.2
   */
  getPracticeSession: async (subject = "geography", sessionId: number): Promise<PracticeSessionOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/practice/${sessionId}`);
    return unwrap<PracticeSessionOut>(response.data);
  },

  /**
   * Submit the practice session for scoring.
   * @fulfills Requirement 1.1, 5.4, 5.5
   */
  submitPractice: async (subject = "geography", sessionId: number): Promise<PracticeResultOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/practice/${sessionId}/submit`);
    return unwrap<PracticeResultOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // AI Discussion
  // -------------------------------------------------------------------------

  /**
   * Start an AI discussion session for a topic (gates content access).
   * @fulfills Requirement 1.1, 6.1
   */
  startDiscussion: async (subject = "geography", nodeId: number): Promise<DiscussionSessionOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/discussion/start`, {
      syllabus_node_id: nodeId,
    });
    return unwrap<DiscussionSessionOut>(response.data);
  },

  /**
   * Submit a student turn in the discussion and receive the AI reply.
   * @fulfills Requirement 1.1, 6.3
   */
  submitDiscussionTurn: async (
    subject = "geography",
    sessionId: number,
    content: string,
  ): Promise<DiscussionTurnResponseOut> => {
    const response = await apiClient.post(
      `gs-lms/${subject}/discussion/${sessionId}/turn`,
      { content },
    );
    return unwrap<DiscussionTurnResponseOut>(response.data);
  },

  /**
   * Get the current status of a discussion session.
   * @fulfills Requirement 1.1, 6.4
   */
  getDiscussionStatus: async (subject = "geography", sessionId: number): Promise<DiscussionSessionOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/discussion/${sessionId}/status`);
    return unwrap<DiscussionSessionOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Progress / Gaps
  // -------------------------------------------------------------------------

  /**
   * Fetch overall student progress across the syllabus.
   * @fulfills Requirement 1.1, 7.6
   */
  getProgress: async (subject = "geography"): Promise<ProgressOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/progress`);
    return unwrap<ProgressOut>(response.data);
  },

  /**
   * Fetch the student's gap profile (weak topics, types, recommended actions).
   * @fulfills Requirement 1.1, 7.1
   */
  getGaps: async (subject = "geography"): Promise<GapOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/gaps`);
    return unwrap<GapOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Planner
  // -------------------------------------------------------------------------

  /**
   * Fetch today's daily plan with planned items and streak.
   * @fulfills Requirement 1.1, 8.1
   */
  getTodayPlan: async (subject = "geography"): Promise<DailyPlanOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/plan/today`);
    return unwrap<DailyPlanOut>(response.data);
  },

  /**
   * Set or update the student's daily bandwidth target.
   * @fulfills Requirement 1.1, 8.2
   */
  setBandwidth: async (subject = "geography", bandwidth: number): Promise<DailyPlanOut> => {
    const response = await apiClient.put(`gs-lms/${subject}/plan/bandwidth`, { bandwidth });
    return unwrap<DailyPlanOut>(response.data);
  },

  /**
   * Trigger a replan event (consecutive misses, manual, or bandwidth change).
   * @fulfills Requirement 1.1, 8.6
   */
  replan: async (subject = "geography"): Promise<ReplanOut> => {
    const response = await apiClient.post(`gs-lms/${subject}/plan/replan`);
    return unwrap<ReplanOut>(response.data);
  },

  // -------------------------------------------------------------------------
  // Revisit & Recall Gate
  // -------------------------------------------------------------------------

  /** Fetch today's due revisits (spaced repetition items). */
  getDueRevisits: async (subject = "geography"): Promise<{
    total: number;
    revisits: Array<{
      id: number;
      syllabus_node_id: number;
      title: string;
      due_date: string;
      revisit_type: string;
      overdue: boolean;
    }>;
  }> => {
    const response = await apiClient.get(`gs-lms/${subject}/revisits/due`);
    return unwrap(response.data);
  },

  /** Mark a revisit as completed. */
  completeRevisit: async (subject = "geography", revisitId: number): Promise<void> => {
    await apiClient.post(`gs-lms/${subject}/revisits/${revisitId}/complete`);
  },

  /**
   * Check if a day-start recall is needed before today's content.
   * @fulfills Requirement 5.1, 5.2
   */
  checkRecallGate: async (subject = "geography"): Promise<{
    recall_needed: boolean;
    topic_id: number | null;
    topic_title: string | null;
    concepts: string[] | null;
  }> => {
    const response = await apiClient.get(`gs-lms/${subject}/recall-gate`);
    return unwrap(response.data);
  },

  /**
   * Clear today's recall gate after the student completes a quick recall.
   * @fulfills Requirement 5.4
   */
  clearRecallGate: async (subject = "geography", topicId: number): Promise<void> => {
    await apiClient.post(`gs-lms/${subject}/recall-gate/clear`, { topic_id: topicId });
  },

  // -------------------------------------------------------------------------
  // Weekly Retro
  // -------------------------------------------------------------------------

  /** Get the current week's retrospective (creates one if not exists). */
  getCurrentRetro: async (subject = "geography"): Promise<{
    id: number;
    week_number: number;
    plan_date: string;
    topics_completed: Array<{ node_id: number; title: string }> | null;
    gap_summary: Array<{ type: string; accuracy: number }> | null;
    reflection_text: string | null;
    completed: boolean;
    completed_at: string | null;
  }> => {
    const response = await apiClient.get(`gs-lms/${subject}/retro/current`);
    return unwrap(response.data);
  },

  /** Submit reflection and mark the current retro as done. */
  completeRetro: async (subject = "geography", reflectionText: string): Promise<void> => {
    await apiClient.post(`gs-lms/${subject}/retro/complete`, {
      reflection_text: reflectionText,
    });
  },

  // -------------------------------------------------------------------------
  // PDF
  // -------------------------------------------------------------------------

  /**
   * Download the topic's compiled PDF as a Blob.
   * Uses responseType: 'blob' — does NOT go through the unwrap helper.
   * @fulfills Requirement 1.1, 9.1, 9.2
   */
  getTopicPdf: async (subject = "geography", nodeId: number): Promise<Blob> => {
    const response = await apiClient.get(`gs-lms/${subject}/topics/${nodeId}/pdf`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  // -------------------------------------------------------------------------
  // Onboarding
  // -------------------------------------------------------------------------

  /**
   * Check the student's onboarding status (completed, bandwidth, first topic).
   * @fulfills Requirement 1.1, 10.1, 10.5
   */
  getOnboardingStatus: async (subject = "geography"): Promise<OnboardingStatusOut> => {
    const response = await apiClient.get(`gs-lms/${subject}/onboarding/status`);
    return unwrap<OnboardingStatusOut>(response.data);
  },

  /**
   * Mark onboarding as complete with bandwidth selection and optional first topic.
   * @fulfills Requirement 1.1, 10.4, 3.1, 6.1
   */
  completeOnboarding: async (
    subject = "geography",
    bandwidth: number,
    firstTopicId?: number,
    learnerLevel?: string,
    studyWindowMinutes?: number,
  ): Promise<void> => {
    const payload: Record<string, unknown> = { bandwidth };
    if (firstTopicId != null) payload.first_topic_id = firstTopicId;
    if (learnerLevel != null) payload.learner_level = learnerLevel;
    if (studyWindowMinutes != null) payload.study_window_minutes = studyWindowMinutes;
    await apiClient.post(`gs-lms/${subject}/onboarding/complete`, payload);
  },

  /**
   * Update the student's learner level post-onboarding.
   * @fulfills Requirement 3.1, 3.2, 6.4
   */
  updateLearnerLevel: async (
    subject = "geography",
    learnerLevel: string,
  ): Promise<OnboardingStatusOut> => {
    const response = await apiClient.put(`gs-lms/${subject}/onboarding/level`, {
      learner_level: learnerLevel,
    });
    return unwrap<OnboardingStatusOut>(response.data);
  },
};
