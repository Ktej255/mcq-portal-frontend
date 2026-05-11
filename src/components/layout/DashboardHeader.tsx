"use client";

import React from 'react';
import { LanguageSwitcher } from '../shared/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Bell, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="-ml-2">
          <Menu className="w-6 h-6" />
        </Button>
        <h2 className="text-lg font-bold tracking-tight text-primary">MCQ Portal</h2>
      </div>
      
      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground font-medium">
        <span>Student Dashboard</span>
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
