import {
  ClipboardList,
  BadgeIndianRupee,
  BookOpen,
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Compass,
  Database,
  FileInput,
  FileSearch,
  FolderTree,
  Gauge,
  GitBranch,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Leaf,
  LibraryBig,
  Mail,
  Newspaper,
  RefreshCcw,
  Route,
  Search,
  UploadCloud,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import type { ExamCode } from "@/lib/exams/examRoutes";

/**
 * Single source of truth for the student section navigation + route gating.
 *
 * The student portal standardises on the warm "Sarit Classes" palette
 * (see globals.css --sl-* tokens):
 *   paper   #f7f4ee   surface #fffdf8   ink     #13251d
 *   primary #1a3a2a   emerald #1d9e75   border  #dcd5c7
 *
 * Both the dashboard shell layout and the UPSC layout consume the route
 * sets below so the two files can no longer drift out of sync.
 */

export const CANONICAL_STUDENT_HOME = "/upsc";

export type StudentNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Subject slug, for subject entries whose href does not end with it. */
  slug?: string;
  /** When set, the item is shown but disabled with a "Soon" badge. */
  locked?: boolean;
  /** Matched against the current pathname to drive the active state. */
  match?: (pathname: string, tab: string | null) => boolean;
};

export type StudentNavSection = {
  label: string;
  items: StudentNavItem[];
};

/**
 * Routes that are NOT student-facing. They render the admin/operator shell
 * and are gated behind the ADMIN role in the UPSC layout. Centralised here so
 * the dashboard layout and the UPSC layout share one definition.
 */
export const operatorRoutes = new Set<string>([
  "/upsc/prelims-2026-audit",
  "/upsc/prelims-2026-audit-v2",
  "/upsc/prelims-2026-showcase",
  "/upsc/prelims-review-command",
  "/upsc/prelims-2027-strategy",
  "/upsc/readiness-audit",
  "/upsc/mcq-command",
  "/upsc/content-command",
  "/upsc/content-coverage",
  "/upsc/revision-command",
  "/upsc/geography/testing",
  "/upsc/geography/animation-studio",
  "/upsc/geography/continue",
  "/upsc/geography/intro",
  "/upsc/geography/pilot",
  "/upsc/geography/production-check",
  "/upsc/content-preview",
  "/upsc/question-bank",
  "/upsc/source-library",
]);

/**
 * Subjects that are not yet open to students. They appear in the sidebar as
 * locked entries (with a "Soon" badge) instead of dead links into an
 * ADMIN-only wall.
 *
 * NOTE: The 7 GS subjects have been removed from this array and moved to
 * `lockedSubjectNavItems` so they are visible to students with "Coming Soon"
 * badges rather than admin-gated. See Requirement 11.2.
 */
export const futureSubjectPrefixes: string[] = [];

/**
 * Where an MCQ practice link should go. The question bank builder is an
 * operator page, so students following it were bounced away; they practise in
 * the subject's MCQ lab instead.
 */
export function practiceHrefFor(isAdmin: boolean, subjectSlug = "geography", adminHref?: string) {
  if (isAdmin) return adminHref ?? `/upsc/question-bank?subject=${subjectSlug}`;
  return `/upsc/${subjectSlug || "geography"}/lms/practice`;
}

export function isOperatorRoute(pathname: string) {
  if (operatorRoutes.has(pathname)) return true;
  // Also match sub-paths of operator routes (e.g. /upsc/content-preview/galaxies)
  for (const route of operatorRoutes) {
    if (pathname.startsWith(`${route}/`)) return true;
  }
  return futureSubjectPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Locked subjects rendered as disabled "Soon" entries in the sidebar.
 *  These 7 GS subjects are visible to students with "Coming Soon" badges
 *  but not navigable. They have been removed from `futureSubjectPrefixes`
 *  (which admin-gates routes) and instead shown here as locked nav items.
 *  See Requirement 11.1, 11.2. */
export const lockedSubjectNavItems: StudentNavItem[] = [
  { name: "Polity & Governance", href: "/upsc/polity-governance", icon: Compass, locked: true },
  { name: "Economy", href: "/upsc/economy", icon: Compass, locked: true },
  { name: "Environment", href: "/upsc/environment", icon: Compass, locked: true },
  { name: "History", href: "/upsc/history", icon: Compass, locked: true },
  { name: "Science & Tech", href: "/upsc/science-tech", icon: Compass, locked: true },
  { name: "Disaster Management", href: "/upsc/disaster-management", icon: Compass, locked: true },
  { name: "Internal Security & Society", href: "/upsc/internal-security-society", icon: Compass, locked: true },
];

/** Subjects that already have their own nav entry (not part of "More subjects"). */
const primarySubjectSlugs = new Set(["geography"]);

/**
 * "More subjects" entries for the sidebar. `subjects` is the API subject list
 * for the student's exam. For UPSC the static list above stays as it is (so
 * nothing disappears) and only subjects the API adds are appended; for any
 * other exam the API list is used as is. With no API list, the static list.
 */
export function subjectNavItemsFor(
  subjects: { slug: string; name: string; exam?: string }[] | null,
  exam: ExamCode = "upsc",
): StudentNavItem[] {
  if (exam !== "upsc") {
    // NEET / JEE: only the API list, linking into the exam's own routes.
    return (subjects ?? []).map((s) => ({
      name: s.name.replace(new RegExp(`^${exam}\\s+`, "i"), ""),
      slug: s.slug,
      href: `/${exam}/${s.slug}/lms`,
      icon: Compass,
      locked: true,
    }));
  }
  if (!subjects || subjects.length === 0) return lockedSubjectNavItems;
  const fromApi: StudentNavItem[] = subjects
    .filter((s) => !primarySubjectSlugs.has(s.slug))
    .map((s) => ({ name: s.name, href: `/upsc/${s.slug}`, icon: Compass, locked: true }));
  const isUpsc = subjects.every((s) => !s.exam || s.exam === "upsc");
  if (!isUpsc) return fromApi;
  const known = new Set(lockedSubjectNavItems.map((item) => item.href));
  return [...lockedSubjectNavItems, ...fromApi.filter((item) => !known.has(item.href))];
}

/** Navigation shown to students. */
export const studentNavSections: StudentNavSection[] = [
  {
    label: "Study",
    items: [
      {
        name: "Study",
        href: "/upsc/study",
        icon: Search,
        match: (pathname) => pathname.startsWith("/upsc/study"),
      },
      {
        name: "My books",
        href: "/upsc/books",
        icon: BookOpen,
        match: (pathname) => pathname.startsWith("/upsc/books"),
      },
      {
        name: "Wellbeing",
        href: "/upsc/wellbeing",
        icon: Leaf,
        match: (pathname) => pathname.startsWith("/upsc/wellbeing"),
      },
      {
        name: "Today",
        href: "/upsc",
        icon: CalendarCheck,
        match: (pathname) =>
          pathname === "/upsc" || pathname === "/upsc/daily-command" || pathname === "/dashboard",
      },
      {
        name: "Current Affairs",
        href: "/upsc/current-affairs",
        icon: Newspaper,
        match: (pathname) => pathname.startsWith("/upsc/current-affairs"),
      },
      {
        name: "GS",
        href: "/upsc/geography/lms",
        icon: Compass,
        // Study-map surfaces only. Practice, Readiness and the revision plan
        // have their own entries below, so marking GS active on those pages
        // would highlight two destinations at once.
        match: (pathname) =>
          pathname === "/upsc/geography" ||
          pathname === "/upsc/geography/lms" ||
          pathname === "/upsc/geography/lms/syllabus" ||
          pathname.startsWith("/upsc/geography/lms/topic") ||
          pathname.startsWith("/upsc/geography/lms/onboarding"),
      },
      {
        name: "Yearly Planner",
        href: "/upsc/yearly-planner",
        icon: FolderTree,
        match: (pathname) => pathname.startsWith("/upsc/yearly-planner"),
      },
      {
        name: "Optional",
        href: "/upsc/optional-subjects",
        icon: GraduationCap,
        match: (pathname) => pathname.startsWith("/upsc/optional-subjects"),
      },
      {
        name: "Practice",
        href: "/practice",
        icon: ClipboardCheck,
        // /practice redirects into the Geography MCQ Lab, so the nav item must
        // stay active on the destination the learner actually lands on.
        match: (pathname) =>
          pathname.startsWith("/practice") ||
          pathname.startsWith("/upsc/geography/lms/practice"),
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        // The server-backed "what UPSC asks vs what you covered" dashboard is
        // the real report for a beta learner. The legacy /reports page reads
        // local storage from the old exam flow and stays reachable by URL only.
        name: "Readiness",
        href: "/upsc/geography/lms/gaps",
        icon: BarChart3,
        match: (pathname) => pathname.startsWith("/upsc/geography/lms/gaps"),
      },
      {
        // Due Day 3/7/21 revisits are listed at the top of Today's plan. The
        // legacy /revision queue is fed only by full-exam attempts, so pointing
        // learners there produced an empty page while revisits were due.
        name: "Revision",
        href: "/upsc/geography/lms/planner",
        icon: RefreshCcw,
        match: (pathname) =>
          pathname.startsWith("/upsc/geography/lms/planner") ||
          pathname.startsWith("/upsc/geography/lms/retro"),
      },
      {
        name: "Billing",
        href: "/upsc/billing",
        icon: BadgeIndianRupee,
        match: (pathname) =>
          pathname.startsWith("/upsc/billing") || pathname.startsWith("/upsc/pricing"),
      },
    ],
  },
];

/**
 * Navigation on /neet and /jee. UPSC-only features (Current Affairs, Optional
 * subjects, GS, answer upload / Mains, prelims pages, UPSC billing) are left
 * out; Study, My books and Wellbeing stay, under the exam's own prefix.
 */
export function studentNavSectionsFor(exam: ExamCode): StudentNavSection[] {
  if (exam === "upsc") return studentNavSections;
  const base = `/${exam}`;
  return [
    {
      label: "Study",
      items: [
        { name: "Home", href: base, icon: CalendarCheck, match: (pathname) => pathname === base },
        {
          name: "Study",
          href: `${base}/study`,
          icon: Search,
          match: (pathname) => pathname.startsWith(`${base}/study`),
        },
        {
          name: "My books",
          href: `${base}/books`,
          icon: BookOpen,
          match: (pathname) => pathname.startsWith(`${base}/books`),
        },
        {
          name: "Wellbeing",
          href: `${base}/wellbeing`,
          icon: Leaf,
          match: (pathname) => pathname.startsWith(`${base}/wellbeing`),
        },
      ],
    },
  ];
}

/** Admin/operator navigation (unchanged behaviour, centralised here). */
export const adminNavItems: StudentNavItem[] = [
  { name: "Admin Console", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Yearly Planner", href: "/upsc/yearly-planner", icon: FolderTree },
  { name: "Pricing", href: "/upsc/pricing", icon: BadgeIndianRupee },
  { name: "Syllabus/PYQ", href: "/upsc/source-library", icon: LibraryBig },
  { name: "Review Command", href: "/upsc/prelims-review-command", icon: GitBranch },
  { name: "Content Coverage", href: "/upsc/content-coverage", icon: Gauge },
  { name: "2027 Strategy", href: "/upsc/prelims-2027-strategy", icon: Route },
  { name: "2026 Showcase", href: "/upsc/prelims-2026-showcase", icon: BarChart3 },
  { name: "PYQ Import", href: "/admin/pyq-import", icon: FileInput },
  { name: "Current Affairs", href: "/upsc/current-affairs", icon: Newspaper },
  { name: "Current Affairs CMS", href: "/admin/cms", icon: Newspaper },
  { name: "Prelims V2", href: "/admin/prelims-audit-v2", icon: FileSearch },
  { name: "Tests", href: "/admin/tests", icon: ClipboardList },
  { name: "Question Bank", href: "/admin/questions", icon: Database },
  { name: "Bulk Upload", href: "/admin/questions/bulk", icon: UploadCloud },
  { name: "Leads", href: "/admin/leads", icon: Mail },
  { name: "Beta access", href: "/admin/beta-access", icon: UserCheck },
  { name: "Content studio", href: "/admin/content", icon: BookOpen },
  { name: "Content requests", href: "/admin/content-requests", icon: Inbox },
];
