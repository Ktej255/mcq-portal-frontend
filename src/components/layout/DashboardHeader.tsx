"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu } from 'lucide-react';

import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { UpscStudentStats } from '@/components/upsc/UpscStudentStats';
import { SyncStatus } from '@/components/shared/SyncStatus';
import { TrialStatus } from '@/components/shared/TrialStatus';
import { EXAM_BRAND, examBrandName, isExamRouteCode } from '@/lib/exams/examRoutes';

interface HeaderProps {
  onMenuClick?: () => void;
  isOpen?: boolean;
}

type Crumb = { label: string; href?: string };

export function DashboardHeader({ onMenuClick, isOpen = false }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? 'Today';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#dcd5c7] bg-[#fffdf8] px-4 md:px-6">
      {/* Mobile: menu + current page */}
      <div className="flex min-w-0 items-center gap-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="-ml-2 h-11 w-11 shrink-0 p-0"
          aria-label="Open navigation"
          aria-expanded={isOpen}
          aria-controls="dashboard-sidebar"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-[#13251d]">{examBrandName(pathname)}</p>
          <p className="truncate text-[11px] font-semibold text-muted-foreground">{pageTitle}</p>
        </div>
      </div>

      {/* Desktop: breadcrumb trail */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center md:flex">
        <ol className="flex items-center gap-1.5 text-sm font-bold text-[#4f5e55]">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#a59f93]" aria-hidden />}
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className="text-[#5d675f] transition-colors hover:text-[#13251d]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-[#13251d]' : undefined} aria-current={isLast ? 'page' : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex items-center gap-3">
        <TrialStatus />
        <SyncStatus />
        <UpscStudentStats />
        <LanguageSwitcher />
      </div>
    </header>
  );
}

// Human labels for path segments across the student section.
const SEGMENT_LABELS: Record<string, string> = {
  upsc: 'Today',
  geography: 'Geography',
  environment: 'Environment',
  'disaster-management': 'Disaster Management',
  economy: 'Economy',
  'science-tech': 'Science & Tech',
  'polity-governance': 'Polity & Governance',
  'internal-security-society': 'Internal Security & Society',
  history: 'History',
  'daily-command': 'Today',
  'content-command': 'Content',
  'content-coverage': 'Coverage',
  'mcq-command': 'Practice',
  'revision-command': 'Revise',
  'readiness-audit': 'Readiness',
  'prelims-review-command': 'Prelims Review',
  'prelims-2026-showcase': '2026 Showcase',
  'prelims-2027-strategy': '2027 Strategy',
  'question-bank': 'Question Bank',
  'source-library': 'Syllabus & PYQs',
  'yearly-planner': 'Yearly Planner',
  'optional-subjects': 'Optional Subjects',
  'answer-upload': 'Answer Upload',
  'current-affairs': 'Current Affairs',
  pricing: 'Pricing',
  reports: 'Learning Gaps',
  revision: 'Revise',
  practice: 'Practice',
  history_root: 'Progress',
  tests: 'Practice',
  settings: 'Settings',
  billing: 'Billing',
  checkout: 'Checkout',
  onboarding: 'Onboarding',
  syllabus: 'Syllabus',
  planner: 'Today',
  topic: 'Topic',
  threads: 'Threads',
  // subject sub-rooms
  watch: 'Watch',
  talk: 'Discuss',
  lab: 'Visual Lab',
  track: 'Track',
  retro: 'Retro',
  revisit: 'Revisit',
  'mcq-readiness': 'MCQ Practice',
  lms: 'Learning Portal',
  gaps: 'Readiness',
  continue: 'Continue',
};

function labelForSegment(segment: string) {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

// Segments that exist only as a prefix for a dynamic child route, such as
// `/upsc/geography/lms/topic/[nodeId]`. Linking to the bare prefix would
// prefetch a page that does not exist, so these render as plain text.
const PREFIX_ONLY_SEGMENTS = new Set(['topic', 'threads']);

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return [{ label: 'Today', href: '/upsc' }];

  // Top-level standalone student pages.
  // /neet/* and /jee/*: the same trail, rooted at the exam.
  if (isExamRouteCode(segments[0])) {
    const root = `/${segments[0]}`;
    const crumbs: Crumb[] = [{ label: EXAM_BRAND[segments[0]], href: segments.length > 1 ? root : undefined }];
    let path = root;
    segments.slice(1).forEach((segment, index, rest) => {
      path += `/${segment}`;
      crumbs.push({
        label: labelForSegment(segment),
        href: index < rest.length - 1 ? path : undefined,
      });
    });
    return crumbs;
  }

  if (segments[0] !== 'upsc') {
    const root = segments[0];
    const rootCrumb =
      root === 'history'
        ? { label: 'Progress' }
        : root === 'reports'
        ? { label: 'Learning Gaps' }
        : root === 'revision'
        ? { label: 'Revise' }
        : root === 'practice' || root === 'tests'
        ? { label: 'Practice' }
        : root === 'settings'
        ? { label: 'Settings' }
        : { label: labelForSegment(root) };
    return [{ label: 'Today', href: '/upsc' }, rootCrumb];
  }

  // /upsc/* — build a clickable trail.
  const crumbs: Crumb[] = [{ label: 'Today', href: '/upsc' }];
  let acc = '';
  segments.forEach((segment, index) => {
    if (index === 0) {
      acc = '/upsc';
      return;
    }
    acc += `/${segment}`;
    // Raw record ids carry no meaning in a trail, and the segment before a
    // dynamic child (e.g. `/lms/topic/[nodeId]`) is a route prefix without a
    // page of its own. Linking either one prefetched a route that 404s.
    if (/^\d+$/.test(segment)) return;
    const isPrefixOnly = PREFIX_ONLY_SEGMENTS.has(segment);
    crumbs.push({
      label: labelForSegment(segment),
      href: !isPrefixOnly && index < segments.length - 1 ? acc : undefined,
    });
  });

  return crumbs;
}
