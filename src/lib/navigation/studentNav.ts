import {
  Activity,
  BadgeIndianRupee,
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  Compass,
  Database,
  FileInput,
  FileSearch,
  FolderTree,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  ListChecks,
  Newspaper,
  RefreshCcw,
  Route,
  ShieldAlert,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the student section navigation + route gating.
 *
 * The student portal standardises on the warm "Sarit Learn" palette
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
  "/upsc/revision-command",
  "/upsc/yearly-planner",
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

const onHome = (pathname: string) =>
  pathname === "/upsc" || pathname === "/upsc/daily-command" || pathname === "/dashboard";

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

/** Navigation shown to students. */
export const studentNavSections: StudentNavSection[] = [
  {
    label: "Study",
    items: [
      {
        name: "Today",
        href: "/upsc",
        icon: CalendarCheck,
        match: (pathname, tab) => onHome(pathname) && (!tab || tab === "today"),
      },
      {
        name: "Current Affairs",
        href: "/upsc/current-affairs",
        icon: Newspaper,
        match: (pathname) => pathname.startsWith("/upsc/current-affairs"),
      },
      {
        name: "Geography",
        href: "/upsc/geography",
        icon: Compass,
        match: (pathname) =>
          pathname.startsWith("/upsc/geography") &&
          !pathname.startsWith("/upsc/geography/lms"),
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
        match: (pathname) => pathname.startsWith("/practice"),
      },
    ],
  },
  {
    label: "Geography LMS",
    // Geography LMS uses /upsc/geography/lms/* (static route).
    // When other subjects launch their LMS, add new sections here with
    // /upsc/{subject}/lms/* paths (e.g., /upsc/economy/lms/syllabus).
    // The dynamic [subject]/lms route handles subjects without a static directory.
    items: [
      {
        name: "Syllabus",
        href: "/upsc/geography/lms/syllabus",
        icon: LibraryBig,
        match: (pathname) => pathname.startsWith("/upsc/geography/lms/syllabus") || pathname.startsWith("/upsc/geography/lms/topic"),
      },
      {
        name: "Practice",
        href: "/upsc/geography/lms/practice",
        icon: ClipboardCheck,
        match: (pathname) => pathname.startsWith("/upsc/geography/lms/practice"),
      },
      {
        name: "Gaps",
        href: "/upsc/geography/lms/gaps",
        icon: BarChart3,
        match: (pathname) => pathname.startsWith("/upsc/geography/lms/gaps"),
      },
      {
        name: "Planner",
        href: "/upsc/geography/lms/planner",
        icon: FolderTree,
        match: (pathname) => pathname.startsWith("/upsc/geography/lms/planner"),
      },
      {
        name: "Retro",
        href: "/upsc/geography/lms/retro",
        icon: RefreshCcw,
        match: (pathname) => pathname.startsWith("/upsc/geography/lms/retro"),
      },
    ],
  },
  {
    label: "GS Subjects",
    items: [
      ...lockedSubjectNavItems,
    ],
  },
  {
    label: "Review",
    items: [
      {
        name: "Revision",
        href: "/revision",
        icon: RefreshCcw,
        match: (pathname, tab) =>
          pathname.startsWith("/revision") || (onHome(pathname) && tab === "revision"),
      },
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
        match: (pathname, tab) =>
          pathname.startsWith("/reports") || (onHome(pathname) && tab === "gaps"),
      },
      {
        name: "Progress",
        href: "/history",
        icon: Activity,
        match: (pathname, tab) =>
          pathname.startsWith("/history") || (onHome(pathname) && tab === "history"),
      },
      {
        name: "Planner",
        href: "/upsc?tab=yearly",
        icon: FolderTree,
        match: (pathname, tab) => onHome(pathname) && tab === "yearly",
      },
      {
        name: "Syllabus & PYQs",
        href: "/upsc?tab=syllabus",
        icon: LibraryBig,
        match: (pathname, tab) => onHome(pathname) && tab === "syllabus",
      },
      {
        name: "Billing",
        href: "/upsc/billing",
        icon: BadgeIndianRupee,
        match: (pathname) => pathname.startsWith("/upsc/billing") || pathname.startsWith("/upsc/pricing"),
      },
    ],
  },
];

/** Admin/operator navigation (unchanged behaviour, centralised here). */
export const adminNavItems: StudentNavItem[] = [
  { name: "Admin Console", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Launch Plan", href: "/admin/launch-plan", icon: CalendarCheck },
  { name: "Yearly Planner", href: "/upsc/yearly-planner", icon: FolderTree },
  { name: "Pricing", href: "/upsc/pricing", icon: BadgeIndianRupee },
  { name: "Syllabus/PYQ", href: "/upsc/source-library", icon: LibraryBig },
  { name: "Review Command", href: "/upsc/prelims-review-command", icon: GitBranch },
  { name: "2027 Strategy", href: "/upsc/prelims-2027-strategy", icon: Route },
  { name: "2026 Showcase", href: "/upsc/prelims-2026-showcase", icon: BarChart3 },
  { name: "PYQ Import", href: "/admin/pyq-import", icon: FileInput },
  { name: "Current Affairs", href: "/upsc/current-affairs", icon: Newspaper },
  { name: "Feature Inventory", href: "/admin/feature-inventory", icon: ListChecks },
  { name: "Prelims V2", href: "/admin/prelims-audit-v2", icon: FileSearch },
  { name: "Founder Review", href: "/admin/founder", icon: Activity },
  { name: "Question Bank", href: "/admin/questions", icon: Database },
  { name: "Bulk Upload", href: "/admin/questions/bulk", icon: UploadCloud },
  { name: "Integrity Logs", href: "/admin/integrity", icon: ShieldAlert },
];
