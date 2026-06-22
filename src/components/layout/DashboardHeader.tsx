"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu } from 'lucide-react';

import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { UpscStudentStats } from '@/components/upsc/UpscStudentStats';

interface HeaderProps {
  onMenuClick?: () => void;
}

type Crumb = { label: string; href?: string };

export function DashboardHeader({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? 'Today';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#dcd5c7] bg-[#fffdf8] px-4 md:px-6">
      {/* Mobile: menu + current page */}
      <div className="flex min-w-0 items-center gap-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="-ml-2 shrink-0" aria-label="Open navigation">
          <Menu className="h-6 w-6" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-[#13251d]">UPSC Command</p>
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
  // subject sub-rooms
  watch: 'Watch',
  talk: 'Discuss',
  lab: 'Visual Lab',
  track: 'Track',
  retro: 'Retro',
  revisit: 'Revisit',
  'mcq-readiness': 'MCQ Practice',
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

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return [{ label: 'Today', href: '/upsc' }];

  // Top-level standalone student pages.
  if (segments[0] !== 'upsc') {
    const root = segments[0];
    if (root === 'history') return [{ label: 'Progress' }];
    if (root === 'reports') return [{ label: 'Learning Gaps' }];
    if (root === 'revision') return [{ label: 'Revise' }];
    if (root === 'practice' || root === 'tests') return [{ label: 'Practice' }];
    if (root === 'settings') return [{ label: 'Settings' }];
    return [{ label: labelForSegment(root) }];
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
    // Day query (?day=) is not in the path; show "Day N" only if numeric segment.
    crumbs.push({
      label: labelForSegment(segment),
      href: index < segments.length - 1 ? acc : undefined,
    });
  });

  return crumbs;
}
