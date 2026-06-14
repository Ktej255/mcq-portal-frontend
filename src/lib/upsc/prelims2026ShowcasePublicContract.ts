import {
  prelims2027Priorities,
  strategyEvidenceLedger,
  strategyExecutionTasks,
  strategyPracticeBlueprints,
} from "@/lib/upsc/prelims2027Strategy";

const publicCriticalStrategyLines = prelims2027Priorities
  .filter((priority) => priority.priority === "Critical" || priority.priority === "High")
  .map((priority) => `${priority.subject}: ${priority.action}`);

export const prelims2026ShowcaseWebsiteCopyBlocks = [
  {
    id: "hero-copy",
    title: "Hero section",
    label: "Public homepage block",
    body: [
      "UPSC Prelims 2026: what we built, what appeared, and what changes for 2027.",
      "",
      "Our final research audit compares the year-long Morning Batch content system with the 2026 Prelims paper. The corrected audit shows 74 of 97 scorable questions had direct or partial preparation advantage, while question-wise claims remain proof-locked until exact source/page evidence is retained.",
    ].join("\n"),
  },
  {
    id: "proof-copy",
    title: "Proof-safe coverage line",
    label: "Use near metrics",
    body: [
      "Corrected research outcome: 44 direct hits, 30 partial hits, 23 misses and 3 dropped questions.",
      "",
      "Public interpretation: 76% effective coverage across the scorable paper. Question-level evidence is shown as direct leads, conceptual leads or gaps until every accepted claim has retained source proof.",
    ].join("\n"),
  },
  {
    id: "strategy-copy",
    title: "2027 course correction",
    label: "Use near action cards",
    body: [
      "The 2027 plan is not more content everywhere. It is sharper allocation.",
      "",
      ...publicCriticalStrategyLines,
      "",
      "Economy stays in maintenance mode, while IR, new-domain Science and Tech, legal-current caselets, map intelligence and source-depth proof become the priority build areas.",
    ].join("\n"),
  },
  {
    id: "software-copy",
    title: "Portal CTA",
    label: "Use near button",
    body: [
      "The analysis is connected to the UPSC Command software through an evidence ledger, 2027 build queue, format rebuilder, readiness simulator, practice blueprint generator and delivery dashboard.",
      "",
      "Every 2027 recommendation can move from audit signal to source proof, MCQ batch, student practice and solved-attempt evidence.",
    ].join("\n"),
  },
];

export const prelims2026ShowcaseWebsiteIntegrationMap = [
  {
    title: "Hero and corrected audit",
    publicAnchor: "/upsc-prelims-2026-showcase",
    dashboardRoute: "/upsc/prelims-2027-strategy#prelims-2027-publish-gate",
    publicUse: "Lead with the corrected 76% effective coverage and the 44 direct, 30 partial, 23 miss audit split.",
    proofOwner: "Main Website Publish Gate",
    proofStatus: "Public safe",
    handoff: "Keeps the homepage headline, coverage line and avoid-list synchronized before the page is pasted into the main site.",
  },
  {
    title: "Complete MCQ matching ledger",
    publicAnchor: "/upsc-prelims-2026-showcase#question-ledger",
    dashboardRoute: "/upsc/prelims-2027-strategy#prelims-2026-public-claim-release-board",
    publicUse: "Show complete questions with highlighted matched portions, candidate source lead and next proof action.",
    proofOwner: "Public Claim Release Board",
    proofStatus: "Proof locked",
    handoff: "Exact question-wise claims stay candidate evidence until source file, page proof and teacher validation are retained.",
  },
  {
    title: "2027 course correction",
    publicAnchor: "/upsc-prelims-2026-showcase#strategy-2027",
    dashboardRoute: "/upsc/prelims-2027-strategy#prelims-2027-build-queue",
    publicUse: "Explain the new allocation: IR, S&T new domains, legal-current caselets, maps and source depth.",
    proofOwner: "2027 Build Queue",
    proofStatus: "Portal owned",
    handoff: "Turns each research recommendation into a priority owner, target route, proof status and next action.",
  },
  {
    title: "Website copy blocks",
    publicAnchor: "/upsc-prelims-2026-showcase#website-copy-kit",
    dashboardRoute: "/upsc/prelims-2027-strategy#prelims-2026-website-publish-packet",
    publicUse: "Copy only public-safe hero, metric, strategy and portal CTA text into the main website.",
    proofOwner: "Website Publish Packet",
    proofStatus: "Public safe",
    handoff: "Protects against overclaiming by keeping stronger question-wise language behind the proof gate.",
  },
  {
    title: "Software execution path",
    publicAnchor: "/upsc-prelims-2026-showcase#software-path",
    dashboardRoute: "/upsc/prelims-review-command",
    publicUse: "Show how the analysis becomes evidence, gap tagging, format rebuilding, simulator and practice delivery.",
    proofOwner: "Prelims Review Command",
    proofStatus: "Build queue",
    handoff: "Routes visible website promises into one operator board before deeper source, proof, task and delivery owners take over.",
  },
  {
    title: "Practice and student proof",
    publicAnchor: "/upsc-prelims-2026-showcase#portal-plan",
    dashboardRoute: "/upsc/prelims-2027-strategy#prelims-2027-delivery-dashboard",
    publicUse: "Position the portal as the place where recommendations become MCQ batches, practice sets and solved evidence.",
    proofOwner: "Delivery Dashboard",
    proofStatus: "Portal owned",
    handoff: "Tracks every recommendation from queued blueprint to generated set, MCQ lock and student attempt evidence.",
  },
];

export const prelims2026ShowcaseRequirementTracker = [
  {
    id: "standalone-public-page",
    category: "Page",
    label: "Standalone page",
    status: "Complete",
    owner: "/upsc-prelims-2026-showcase",
    proof: "Public route exists at /upsc-prelims-2026-showcase with light geography styling and chart-led presentation.",
  },
  {
    id: "main-site-safe-copy",
    category: "Website",
    label: "Main-site-safe copy",
    status: "Complete",
    owner: "#website-copy-kit",
    proof: "Website copy blocks keep internal planning language out and keep exact claims behind proof gates.",
  },
  {
    id: "portal-ready-route",
    category: "Portal",
    label: "Portal-ready route",
    status: "Complete",
    owner: "/upsc/prelims-2026-showcase",
    proof: "Dashboard route exists at /upsc/prelims-2026-showcase and is linked from UPSC global controls.",
  },
  {
    id: "final-pdf-analysis",
    category: "Research",
    label: "Final PDF analysis",
    status: "Complete",
    owner: "#strategy-2027",
    proof: "The page carries the given analysis themes: 2026 pattern shift, coverage audit, gaps and next build.",
  },
  {
    id: "archive-scan",
    category: "Archive",
    label: "Year-long archive scan",
    status: "Complete",
    owner: "/upsc/source-library#upsc-morning-batch-archive-intake",
    proof: "Morning Batch source index is connected through the Source Library scan and grouped into 2027 decision tracks.",
  },
  {
    id: "what-we-built",
    category: "Evidence",
    label: "What we built",
    status: "Complete",
    owner: "#coverage-map",
    proof: "Subject and sprint asset sections show Geography, Environment, History, Polity, S&T, value-addition and current affairs work.",
  },
  {
    id: "what-appeared",
    category: "Evidence",
    label: "What appeared",
    status: "Complete",
    owner: "#question-ledger",
    proof: "Subject cards and the 100-question ledger map the 2026 paper into subject, nature, difficulty and format.",
  },
  {
    id: "surprise-elements",
    category: "Trend",
    label: "Surprise elements",
    status: "Complete",
    owner: "#surprise-action-matrix",
    proof: "The surprise-to-software matrix turns IR, S&T, legal-current, map and Medieval absence signals into 2027 operating decisions.",
  },
  {
    id: "question-patterns",
    category: "Pattern",
    label: "Question asking pattern",
    status: "Complete",
    owner: "#question-ledger",
    proof: "Format charts, pattern cards and each expanded question show statement architecture, trap style and depth tested.",
  },
  {
    id: "complete-mcq-highlight",
    category: "MCQ proof",
    label: "Complete MCQ and highlighted match",
    status: "Proof locked",
    owner: "#question-ledger",
    proof: "Every expanded question includes complete stem, statements, options, answer, highlighted match signals and a statement coverage map.",
  },
  {
    id: "untapped-domains",
    category: "2027",
    label: "Untapped domains and next actions",
    status: "Complete",
    owner: "#surprise-action-matrix",
    proof: "The matrix names each underbuilt domain, its source standard, proof gate, software action and linked portal route.",
  },
  {
    id: "software-execution-path",
    category: "Portal",
    label: "Software execution path",
    status: "Portal owned",
    owner: "/upsc/prelims-review-command",
    proof: "The Review Command starts the software handoff, then links into Strategy Command source, capsule, MCQ, proof, release and planner tasks.",
  },
];

export function buildPrelims2026ShowcasePublicStrategyTracks() {
  return prelims2027Priorities.map((priority) => {
    const evidence = strategyEvidenceLedger.find((entry) => entry.priorityId === priority.id);
    const tasks = strategyExecutionTasks.filter((task) => task.priorityId === priority.id);
    const proofTasks = tasks.filter((task) => task.phase === "Source" || task.phase === "Proof");

    return {
      id: priority.id,
      subject: priority.subject,
      priority: priority.priority,
      action: priority.action,
      targetRoute: priority.targetRoute,
      publicStatus:
        evidence?.proofStatus === "Claim ready"
          ? "Public proof ready"
          : evidence?.proofStatus === "Needs source pack"
            ? "Needs source pack"
            : evidence?.proofStatus === "Needs page proof"
              ? "Needs page proof"
              : "Internal planning",
      taskCount: tasks.length,
      proofTaskCount: proofTasks.length,
      blueprintCount: strategyPracticeBlueprints.filter((blueprint) => blueprint.priorityId === priority.id).length,
      evidenceEntry: evidence ?? null,
    };
  });
}
