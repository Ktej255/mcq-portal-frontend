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
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex min-w-0 items-center gap-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="-ml-2 shrink-0" aria-label="Open navigation">
          <Menu className="w-6 h-6" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-primary">UPSC Command</p>
          <p className="truncate text-[11px] font-semibold text-muted-foreground">{pageTitle}</p>
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground font-medium">
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
    ['/upsc/geography', 'Geography Command'],
    ['/upsc/environment', 'Environment Command'],
    ['/upsc/disaster-management', 'Disaster Management Command'],
    ['/upsc/economy', 'Economy Command'],
    ['/upsc/science-tech', 'Science and Tech Command'],
    ['/upsc/polity-governance', 'Polity and Governance Command'],
    ['/upsc/internal-security-society', 'Internal Security and Society Command'],
    ['/upsc/history', 'History Command'],
    ['/upsc/daily-command', 'Daily Mission Control'],
    ['/upsc/content-command', 'Content Command'],
    ['/upsc/mcq-command', 'MCQ Command'],
    ['/upsc/revision-command', 'Revision Command'],
    ['/upsc/readiness-audit', 'Readiness Audit'],
  ] as const;

  const matchedUpscRoute = upscRoutes.find(([route]) => pathname.startsWith(route));
  if (matchedUpscRoute) return matchedUpscRoute[1];
  if (pathname.startsWith('/upsc')) return 'UPSC Portal';
  if (pathname.startsWith('/reports')) return 'Analytics';
  if (pathname.startsWith('/revision')) return 'Revision Engine';
  if (pathname.startsWith('/history')) return 'Test History';
  if (pathname.startsWith('/tests')) return 'Available Tests';
  return 'Student Dashboard';
}
