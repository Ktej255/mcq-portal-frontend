import { getGeographyLoopState } from "@/lib/upsc/geographyLoopState";
import { getCurrentGeographyTopic } from "@/lib/upsc/guidedStudy";
import { labSlugForGeographySession } from "@/lib/upsc/geographyLearning";
import { geographySessions } from "@/lib/upsc/plan";
import type { StudentLevel } from "@/lib/upsc/studentProfile";
import type { GeographyDayProgress } from "@/lib/upsc/useGeographyProgress";

type GeographyProgressMap = Record<string, GeographyDayProgress>;

export type GeographyContinueRoute = {
  day: number;
  href: string;
  label: string;
  reason: string;
};

function resolveSession(day?: number) {
  return geographySessions.find((session) => session.day === day) ?? geographySessions[0];
}

export function getGeographyContinueRoute(
  progress: GeographyProgressMap,
  learnerLevel: StudentLevel,
  options: { isLoaded?: boolean } = {}
): GeographyContinueRoute {
  const isLoaded = options.isLoaded ?? true;
  const currentSession = getCurrentGeographyTopic(progress);
  const currentProgress = progress[String(currentSession.day)];
  const previousSession = currentSession.day > 1 ? resolveSession(currentSession.day - 1) : null;
  const previousRecallCleared = Boolean(
    !previousSession ||
      (currentProgress?.dayStartRecallSourceDay === previousSession.day && currentProgress.dayStartRecallClearedAt)
  );

  if (previousSession && isLoaded && !previousRecallCleared) {
    return {
      day: currentSession.day,
      href: `/upsc/geography/talk?day=${previousSession.day}&startDay=${currentSession.day}`,
      label: `Recall Day ${previousSession.day} first`,
      reason: `Day ${currentSession.day} starts only after recalling Day ${previousSession.day}.`,
    };
  }

  const state = getGeographyLoopState(currentSession, currentProgress, {
    isLoaded,
    learnerLevel,
    labSlug: currentProgress?.labMode ?? labSlugForGeographySession(currentSession.lab),
  });

  return {
    day: currentSession.day,
    href: state.href,
    label: state.cta,
    reason: state.detail,
  };
}
