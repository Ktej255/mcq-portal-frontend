import type { ShowcaseQuestionEvidence } from "@/lib/upsc/prelims2026ShowcaseEvidence";

export const sourceGapWorkOrderStorageKey = "sarit-upsc-prelims-2026-source-gap-work-orders-v1";
export const sourceGapWorkOrderStatusOptions = ["Queued", "Source row drafted", "Resolved"] as const;

export type SourceGapWorkOrderStatus = (typeof sourceGapWorkOrderStatusOptions)[number];

export type SourceGapWorkOrder = {
  id: string;
  questionNumber: number;
  subject: string;
  status: SourceGapWorkOrderStatus;
  sourceGap: string;
  sourceAction: string;
  publicRule: string;
  route: string;
  createdAt: string;
  updatedAt?: string;
};

export type Prelims2027OperationalAction = {
  key: string;
  priority: number;
  title: string;
  statusLabel: string;
  detail: string;
  href: string;
  badge: string;
  tone: string;
};

export type Prelims2027OperationalTotals = {
  sourceOrders: number;
  queued: number;
  drafted: number;
  resolved: number;
  unresolved: number;
};

export function sourceGapWorkOrderId(questionNumber: number) {
  return `source-gap-q${questionNumber}`;
}

export function readSourceGapWorkOrders(): Record<string, SourceGapWorkOrder> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(sourceGapWorkOrderStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => {
        if (!value || typeof value !== "object") return false;
        const order = value as Partial<SourceGapWorkOrder>;

        return (
          typeof order.id === "string" &&
          typeof order.questionNumber === "number" &&
          typeof order.subject === "string" &&
          typeof order.sourceGap === "string" &&
          typeof order.sourceAction === "string" &&
          typeof order.publicRule === "string" &&
          typeof order.route === "string" &&
          typeof order.createdAt === "string" &&
          sourceGapWorkOrderStatusOptions.includes(order.status as SourceGapWorkOrderStatus)
        );
      })
    ) as Record<string, SourceGapWorkOrder>;
  } catch {
    return {};
  }
}

export function writeSourceGapWorkOrders(orders: Record<string, SourceGapWorkOrder>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(sourceGapWorkOrderStorageKey, JSON.stringify(orders));
}

export function buildSourceGapWorkOrder(
  question: ShowcaseQuestionEvidence,
  status: SourceGapWorkOrderStatus,
  existing?: SourceGapWorkOrder
): SourceGapWorkOrder {
  const now = new Date().toISOString();

  return {
    id: sourceGapWorkOrderId(question.number),
    questionNumber: question.number,
    subject: question.subject,
    status,
    sourceGap: `${question.sourceLead} ${question.conceptLead}`.trim(),
    sourceAction: `Create or rename a Morning Batch source row for Q${question.number} (${question.subject}); retain exact file, page or slide proof before any public claim.`,
    publicRule:
      "Public question-level claim remains blocked until source reference, page location, teacher note and public claim line are complete.",
    route: "/upsc/prelims-2027-strategy#prelims-2026-question-proof-queue",
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing ? now : undefined,
  };
}

function orderPriority(status: SourceGapWorkOrderStatus) {
  if (status === "Queued") return 1;
  if (status === "Source row drafted") return 2;
  return 5;
}

function orderTone(status: SourceGapWorkOrderStatus) {
  if (status === "Resolved") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Source row drafted") return "border-[#1f5d8f] bg-[#eef5ff] text-[#1f5d8f]";
  return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
}

export function sourceGapWorkOrderTone(status: SourceGapWorkOrderStatus | "Not queued") {
  if (status === "Resolved") return "border-[#1d9e75] bg-[#e7f5ee] text-[#085041]";
  if (status === "Source row drafted") return "border-[#1f5d8f] bg-[#eef5ff] text-[#1f5d8f]";
  if (status === "Queued") return "border-[#ef9f27] bg-[#fff4df] text-[#6f4a12]";
  return "border-[#d95f43] bg-[#fff0ec] text-[#9d3824]";
}

export function buildPrelims2027OperationalTotals(): Prelims2027OperationalTotals {
  const orders = Object.values(readSourceGapWorkOrders());
  const queued = orders.filter((order) => order.status === "Queued").length;
  const drafted = orders.filter((order) => order.status === "Source row drafted").length;
  const resolved = orders.filter((order) => order.status === "Resolved").length;

  return {
    sourceOrders: orders.length,
    queued,
    drafted,
    resolved,
    unresolved: orders.length - resolved,
  };
}

export function buildPrelims2027OperationalQueue(limit = 4): Prelims2027OperationalAction[] {
  const sourceOrders = Object.values(readSourceGapWorkOrders())
    .filter((order) => order.status !== "Resolved")
    .sort(
      (left, right) =>
        orderPriority(left.status) - orderPriority(right.status) || left.questionNumber - right.questionNumber
    )
    .map((order) => ({
      key: order.id,
      priority: orderPriority(order.status),
      title: `Q${order.questionNumber} source proof`,
      statusLabel: order.status,
      detail: order.sourceAction,
      href: order.route,
      badge: "Source gap",
      tone: orderTone(order.status),
    }));

  if (sourceOrders.length) {
    return sourceOrders.slice(0, limit);
  }

  return [
    {
      key: "prelims-2027-proof-gate",
      priority: 3,
      title: "Review 2027 strategy gate",
      statusLabel: "Proof gate",
      detail:
        "Open Strategy Command to queue no-source MCQs, complete public proof packets and lock the 2027 build tracks.",
      href: "/upsc/prelims-2027-strategy#prelims-2027-publish-gate",
      badge: "Strategy",
      tone: "border-[#dcd5c7] bg-[#fffdf8] text-[#34453b]",
    },
  ];
}
