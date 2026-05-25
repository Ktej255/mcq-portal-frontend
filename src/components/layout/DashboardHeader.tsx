"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Bell, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#dcd5c7] bg-[#fffdf8] px-6">
      <div className="flex min-w-0 items-center gap-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="-ml-2 shrink-0" aria-label="Open navigation">
          <Menu className="w-6 h-6" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-[#13251d]">UPSC Command</p>
          <p className="truncate text-[11px] font-semibold text-muted-foreground">{pageTitle}</p>
        </div>
      </div>
      
      <div className="hidden items-center gap-4 text-sm font-bold text-[#4f5e55] md:flex">
        <span>{pageTitle}</span>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="bg-accent rounded-full text-accent-foreground">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}

function resolvePageTitle(pathname: string) {
  const upscRoutes = [
    ['/upsc/geography', 'Today: Geography'],
    ['/upsc/environment', 'Environment'],
    ['/upsc/disaster-management', 'Disaster Management'],
    ['/upsc/economy', 'Economy'],
    ['/upsc/science-tech', 'Science and Tech'],
    ['/upsc/polity-governance', 'Polity and Governance'],
    ['/upsc/internal-security-society', 'Internal Security and Society'],
    ['/upsc/history', 'History'],
    ['/upsc/daily-command', 'Today'],
    ['/upsc/content-command', 'Content'],
    ['/upsc/mcq-command', 'Practice'],
    ['/upsc/revision-command', 'Revise'],
    ['/upsc/readiness-audit', 'Readiness'],
  ] as const;

  const matchedUpscRoute = upscRoutes.find(([route]) => pathname.startsWith(route));
  if (matchedUpscRoute) return matchedUpscRoute[1];
  if (pathname.startsWith('/upsc')) return 'Today';
  if (pathname.startsWith('/reports')) return 'Learning Gaps';
  if (pathname.startsWith('/revision')) return 'Revise';
  if (pathname.startsWith('/history')) return 'Progress';
  if (pathname.startsWith('/tests')) return 'Practice';
  return 'Today';
}
