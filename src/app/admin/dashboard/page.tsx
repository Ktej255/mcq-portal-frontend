import Link from "next/link";
import {
  ClipboardList,
  Database,
  FileInput,
  FileSearch,
  Gauge,
  Mail,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

import { GeographyContentLoader } from "@/components/admin/GeographyContentLoader";
import { OperatorOverview } from "@/components/admin/OperatorOverview";

const operatorLinks: { href: string; title: string; detail: string; icon: LucideIcon }[] = [
  {
    href: "/admin/tests",
    title: "Tests and Questions",
    detail: "Create a test, upload its questions from a spreadsheet with a check first, and publish it for students.",
    icon: ClipboardList,
  },
  {
    href: "/admin/questions",
    title: "Question Bank",
    detail: "Search, correct and retire individual questions.",
    icon: Database,
  },
  {
    href: "/admin/leads",
    title: "Leads",
    detail: "People who finished the free diagnostic or wrote through the contact page.",
    icon: Mail,
  },
  {
    href: "/upsc/content-coverage",
    title: "Content Coverage",
    detail: "Which subjects and topics have reviewed content students can open.",
    icon: Gauge,
  },
  {
    href: "/upsc/current-affairs",
    title: "Current Affairs",
    detail: "The current affairs feed as students see it.",
    icon: Newspaper,
  },
  {
    href: "/admin/pyq-import",
    title: "Exact PYQ Import",
    detail: "Stage official PYQ text with subject, syllabus, topic tags and source before it is shown.",
    icon: FileInput,
  },
  {
    href: "/admin/prelims-audit-v2",
    title: "Prelims 2026 Audit",
    detail: "Internal evidence room for the Prelims 2026 paper. Public claims stay locked until proof is reviewed.",
    icon: FileSearch,
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6" data-testid="admin-operator-dashboard">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-black text-zinc-950">UPSC Operator Console</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
          Everything on this page is read from the database when you open it.
        </p>
      </header>

      <OperatorOverview />

      <GeographyContentLoader />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Operator rooms">
        {operatorLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Icon className="h-5 w-5 text-emerald-700" />
              <h2 className="mt-4 text-base font-black text-zinc-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.detail}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
