"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BadgeIndianRupee,
  BarChart3,
  CalendarCheck,
  Database,
  FileSearch,
  FileInput,
  FolderTree,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LibraryBig,
  LogOut,
  Newspaper,
  RefreshCcw,
  Route,
  Settings,
  ShieldAlert,
  Target,
  UploadCloud,
  X,
} from 'lucide-react';

const studentNavItems = [
  { name: 'Today', href: '/dashboard', icon: CalendarCheck },
  { name: 'Gaps', href: '/reports', icon: Target },
  { name: 'Revise', href: '/revision', icon: RefreshCcw },
  { name: 'Progress', href: '/history', icon: BarChart3 },
];

const adminNavItems = [
  { name: 'Admin Console', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Launch Plan', href: '/admin/launch-plan', icon: CalendarCheck },
  { name: 'Yearly Planner', href: '/upsc/yearly-planner', icon: FolderTree },
  { name: 'Pricing', href: '/upsc/pricing', icon: BadgeIndianRupee },
  { name: 'Syllabus/PYQ', href: '/upsc/source-library', icon: LibraryBig },
  { name: 'Review Command', href: '/upsc/prelims-review-command', icon: GitBranch },
  { name: '2027 Strategy', href: '/upsc/prelims-2027-strategy', icon: Route },
  { name: '2026 Showcase', href: '/upsc/prelims-2026-showcase', icon: BarChart3 },
  { name: 'PYQ Import', href: '/admin/pyq-import', icon: FileInput },
  { name: 'Current Affairs', href: '/upsc/current-affairs', icon: Newspaper },
  { name: 'Feature Inventory', href: '/admin/feature-inventory', icon: ListChecks },
  { name: 'Prelims V2', href: '/admin/prelims-audit-v2', icon: FileSearch },
  { name: 'Founder Review', href: '/admin/founder', icon: Activity },
  { name: 'Question Bank', href: '/admin/questions', icon: Database },
  { name: 'Bulk Upload', href: '/admin/questions/bulk', icon: UploadCloud },
  { name: 'Integrity Logs', href: '/admin/integrity', icon: ShieldAlert },
];

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { isLocalMockMasterSession, isMasterEmail } from '@/lib/auth/master-access';
import { activateUpscMasterPass } from '@/lib/upsc/masterPass';

interface SidebarProps {
  isAdmin?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isAdmin = false, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const hasMasterAccess = isAdmin || isMasterEmail(user?.email) || isLocalMockMasterSession();
  const navItems = hasMasterAccess ? adminNavItems : studentNavItems;

  const openMasterPass = () => {
    activateUpscMasterPass(user?.email, { notify: true });
    router.push('/admin/feature-inventory');
    onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r border-[#dcd5c7] bg-[#fffdf8] transition-all duration-500 md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-24 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a3a2a]">
              <span className="text-sm font-black text-white">U</span>
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#13251d]">UPSC Command</h2>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 py-4 px-4 space-y-8 overflow-y-auto">
          <div className="space-y-1">
            <p className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">Study</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) || (!hasMasterAccess && item.href === "/dashboard" && pathname.startsWith("/upsc"));
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={onClose}
                    className={`group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#1a3a2a] font-bold text-white shadow-lg shadow-[#1a3a2a]/10'
                        : 'text-[#5d675f] hover:bg-[#f2eadc] hover:text-[#13251d]'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                    <span className="text-sm tracking-tight">{item.name}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 bg-current rounded-full" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        
        <div className="mt-auto p-6 space-y-6">
          {hasMasterAccess ? (
            <div className="rounded-lg border border-[#1d9e75]/30 bg-[#e7f5ee] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1a3a2a] text-white">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#13251d]">Master Pass</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-[#476258]">
                    Unlock the operator view and seed the UPSC profile for flow checks.
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="master-one-pass"
                onClick={openMasterPass}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1a3a2a] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#10291d]"
              >
                One Pass
              </button>
            </div>
          ) : null}

          <div className="rounded-lg border border-[#dcd5c7] bg-[#f7f4ee] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                {user?.photoURL ? (
                  <span
                    aria-label="User avatar"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${user.photoURL})` }}
                  />
                ) : (
                  <span className="font-bold text-xs">{user?.displayName?.[0] || 'U'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">{user?.displayName || 'Student'}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{hasMasterAccess ? 'Master' : 'Student'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <Link 
                href="/settings" 
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest text-[#5d675f] transition-colors hover:bg-white"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
              <button 
                onClick={() => {
                  logout();
                  onClose?.();
                }}
                className="flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" /> Exit
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 text-[10px] font-bold text-[#8c8478]">
            <span>UPSC</span>
            <span>June</span>
          </div>
        </div>
      </aside>
    </>
  );
}
