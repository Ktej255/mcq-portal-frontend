/**
 * Routing from a retired legacy "day room" to the GS LMS surface that now
 * performs the same learner step.
 *
 * The subject pages `/upsc/{slug}/watch|talk|track|revisit|mcq-readiness|retro|lab`
 * are retired: the seven locked subjects' stubs redirect into
 * `/upsc/{slug}/lms`, and Geography never had room pages at all (its landing
 * page redirects straight to the LMS). Any surface that still builds a room
 * link therefore either bounces through a redirect that drops the learner's
 * intent, or — on Geography — lands on a 404.
 *
 * The LMS workspace is the single study surface
 * (`/upsc/{subject}/lms/{planner|syllabus|practice|gaps|retro}`), so room names
 * are resolved onto those tabs here rather than being re-invented per component.
 */
export type LegacyStudyRoom =
  | "watch"
  | "talk"
  | "mcq-readiness"
  | "track"
  | "revisit"
  | "retro"
  | "lab";

const ROOM_TO_LMS_SEGMENT: Record<LegacyStudyRoom, string> = {
  // Reading a topic's reviewed sections, and its discussion, both live behind
  // the syllabus map.
  watch: "syllabus",
  talk: "syllabus",
  // The 15-question MCQ set, and the lab drills, are the Practice tab.
  "mcq-readiness": "practice",
  lab: "practice",
  // The LMS planner owns the recall gate, so revision/revisit lands there.
  revisit: "planner",
  // Progress and gap tracking is the Readiness tab.
  track: "gaps",
  retro: "retro",
};

export function lmsSegmentForRoom(room: LegacyStudyRoom): string {
  return ROOM_TO_LMS_SEGMENT[room];
}

/** Absolute href for the LMS tab that performs a retired room's step. */
export function lmsHrefForRoom(subjectSlug: string, room: LegacyStudyRoom): string {
  return `/upsc/${subjectSlug}/lms/${lmsSegmentForRoom(room)}`;
}
