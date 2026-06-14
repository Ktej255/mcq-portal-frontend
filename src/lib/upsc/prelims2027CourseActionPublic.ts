import {
  formatRebuildRules,
  prelims2027Priorities,
  strategyEvidenceLedger,
  strategyExecutionTasks,
  strategyLaunchSteps,
  strategyPracticeBlueprints,
  strategyReallocationPlan,
  strategySprintCalendar,
  type StrategyTaskPhase,
} from "@/lib/upsc/prelims2027Strategy";

export const prelims2027CourseActionVersion = "upsc-prelims-2027-course-action-v1";

const strategyTaskPhaseOrder: StrategyTaskPhase[] = ["Source", "Capsule", "MCQ", "Proof", "Release", "Planner"];

function countTaskPhases() {
  return strategyTaskPhaseOrder.reduce<Record<StrategyTaskPhase, number>>(
    (counts, phase) => ({
      ...counts,
      [phase]: strategyExecutionTasks.filter((task) => task.phase === phase).length,
    }),
    {
      Source: 0,
      Capsule: 0,
      MCQ: 0,
      Proof: 0,
      Release: 0,
      Planner: 0,
    }
  );
}

function countPrioritiesByBand() {
  return prelims2027Priorities.reduce<Record<string, number>>((counts, priority) => {
    counts[priority.priority] = (counts[priority.priority] ?? 0) + 1;
    return counts;
  }, {});
}

export function buildPrelims2027CourseActionPublic() {
  const phaseCounts = countTaskPhases();
  const priorityBandCounts = countPrioritiesByBand();

  return {
    version: prelims2027CourseActionVersion,
    generatedAt: new Date().toISOString(),
    sourceAuditRoute: "/upsc-prelims-2026-showcase",
    reviewCommandRoute: "/upsc/prelims-review-command",
    strategyRoute: "/upsc/prelims-2027-strategy",
    publicAnchor: "/upsc-prelims-2026-showcase#software-path",
    proofPolicy:
      "This endpoint publishes the 2027 course-action plan. It does not convert question-level hits into public claims without exact source proof, page proof and teacher validation.",
    summary: {
      priorityCount: prelims2027Priorities.length,
      criticalPriorityCount: priorityBandCounts.Critical ?? 0,
      highPriorityCount: priorityBandCounts.High ?? 0,
      mediumPriorityCount: priorityBandCounts.Medium ?? 0,
      lowPriorityCount: priorityBandCounts.Low ?? 0,
      minimalPriorityCount: priorityBandCounts.Minimal ?? 0,
      taskCount: strategyExecutionTasks.length,
      sprintCount: strategySprintCalendar.length,
      practiceBlueprintCount: strategyPracticeBlueprints.length,
      formatRuleCount: formatRebuildRules.length,
      reallocationDecisionCount: strategyReallocationPlan.length,
      evidenceLedgerCount: strategyEvidenceLedger.length,
      launchStepCount: strategyLaunchSteps.length,
      phaseCounts,
    },
    priorities: prelims2027Priorities.map((priority) => {
      const tasks = strategyExecutionTasks.filter((task) => task.priorityId === priority.id);
      const blueprints = strategyPracticeBlueprints.filter((blueprint) => blueprint.priorityId === priority.id);
      const evidence = strategyEvidenceLedger.find((entry) => entry.priorityId === priority.id) ?? null;
      const reallocation = strategyReallocationPlan.find((entry) => entry.priorityId === priority.id) ?? null;
      const sprints = strategySprintCalendar.filter((sprint) => sprint.priorityIds.includes(priority.id));

      return {
        ...priority,
        taskCount: tasks.length,
        blueprintCount: blueprints.length,
        sprintWindows: sprints.map((sprint) => sprint.window),
        proofStatus: evidence?.proofStatus ?? "Internal only",
        releaseGate: reallocation?.releaseGate ?? "Keep internal until proof packet is complete.",
        studentSignal: reallocation?.studentSignal ?? "Student signal pending.",
        nextProofAction: evidence?.nextProofAction ?? "Proof action pending.",
      };
    }),
    sprints: strategySprintCalendar,
    executionTasks: strategyExecutionTasks,
    practiceBlueprints: strategyPracticeBlueprints.map((blueprint) => ({
      ...blueprint,
      format: formatRebuildRules.find((rule) => rule.id === blueprint.formatRuleId)?.format ?? "Practice",
    })),
    formatRules: formatRebuildRules,
    reallocationPlan: strategyReallocationPlan,
    evidenceLedger: strategyEvidenceLedger,
    launchSteps: strategyLaunchSteps,
    api: {
      reviewCommand: "/api/upsc/prelims-2026/review-command",
      manifest: "/api/upsc/prelims-2026/showcase-manifest",
      questionLedger: "/api/upsc/prelims-2026/question-ledger",
      proofFeed: "/api/upsc/prelims-2026/public-proof-feed",
      courseAction: "/api/upsc/prelims-2027/course-action",
    },
  };
}
