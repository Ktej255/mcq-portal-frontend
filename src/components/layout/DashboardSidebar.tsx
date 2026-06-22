"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, LockKeyhole, LogOut, Settings, X } from 'lucide-react';

import {
  adminNavItems,
  lockedSubjectNavItems,
  studentNavSections,
  type StudentNavItem,
} from '@/lib/navigation/studentNav';
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
  const currentSearchParams = useSearchParams();
  const { user, logout } = useAuth();
  const hasMasterAccess = isAdmin || isMasterEmail(user?.email) || isLocalMockMasterSession();
  const currentTab = currentSearchParams.get('tab');

  const openMasterPass = () => {
    activateUpscMasterPass(user?.email, { notify: true });
    router.push('/admin/feature-inventory');
    onClose?.();
  };

  const isItemActive = (item: StudentNavItem) => {
    if (item.match) return item.match(pathname, currentTab);
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const renderNavLink = (item: StudentNavItem) => {
    const isActive = isItemActive(item);
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onClose}
        aria-current={isActive ? 'page' : undefined}
        className={`group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300 ${
          isActive
            ? 'bg-[#1a3a2a] font-bold text-white shadow-lg shadow-[#1a3a2a]/10'
            : 'text-[#5d675f] hover:bg-[#f2eadc] hover:text-[#13251d]'
        }`}
      >
        <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
        <span className="text-sm tracking-tight">{item.name}</span>
        {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r border-[#dcd5c7] bg-[#fffdf8] transition-all duration-500 md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex h-24 items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a3a2a]">
              <span className="text-sm font-black text-white">U</span>
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-[#13251d]">UPSC Command</h2>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-4">
          {hasMasterAccess ? (
            <div className="space-y-1">
              <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">Operator</p>
              <nav className="space-y-1">{adminNavItems.map(renderNavLink)}</nav>
            </div>
          ) : (
            <>
              {studentNavSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">
                    {section.label}
                  </p>
                  <nav className="space-y-1">{section.items.map(renderNavLink)}</nav>
                </div>
              ))}

              <div className="space-y-1">
                <p className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#7b7469]">
                  More subjects
                </p>
                <div className="space-y-1">
                  {lockedSubjectNavItems.map((item) => (
                    <div
                      key={item.name}
                      aria-disabled
                      title="Opens soon"
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-[#a59f93]"
                    >
                      <LockKeyhole className="h-5 w-5" />
                      <span className="text-sm tracking-tight">{item.name}</span>
                      <span className="ml-auto rounded-full border border-[#dcd5c7] bg-[#f2eadc] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#8c5d14]">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-auto space-y-6 p-6">
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
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                {user?.photoURL ? (
                  <span
                    aria-label="User avatar"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${user.photoURL})` }}
                  />
                ) : (
                  <span className="text-xs font-bold">{user?.displayName?.[0] || 'U'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{user?.displayName || 'Student'}</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{hasMasterAccess ? 'Master' : 'Student'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
               <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest text-[#5d675f] transition-colors hover:bg-white"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  onClose?.();
                }}
                className="flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Exit
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
