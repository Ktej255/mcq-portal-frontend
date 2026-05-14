"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, History, BarChart3, Settings, BookOpen, Database, ShieldAlert, UploadCloud } from 'lucide-react';

const studentNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Available Tests', href: '/tests', icon: FileText },
  { name: 'Revision Engine', href: '/revision', icon: RotateCcw },
  { name: 'Test History', href: '/history', icon: History },
  { name: 'Analytics', href: '/reports', icon: BarChart3 },
];

const adminNavItems = [
  { name: 'Admin Console', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Institutional Health', href: '/admin/founder', icon: Activity },
  { name: 'Question Bank', href: '/admin/questions', icon: Database },
  { name: 'Bulk Upload', href: '/admin/questions/bulk', icon: UploadCloud },
  { name: 'Integrity Logs', href: '/admin/integrity', icon: ShieldAlert },
];

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, X, RotateCcw, Activity } from 'lucide-react';

interface SidebarProps {
  isAdmin?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isAdmin = false, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = isAdmin ? adminNavItems : studentNavItems;

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
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full transition-all duration-500 md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-24 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 font-black text-sm">A</span>
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase italic">Antigravity</h2>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 py-4 px-4 space-y-8 overflow-y-auto">
          <div className="space-y-1">
            <p className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Navigation</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                      isActive 
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-lg shadow-zinc-900/10' 
                        : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white dark:text-zinc-900' : ''}`} />
                    <span className="text-sm tracking-tight">{item.name}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 bg-current rounded-full" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        
        <div className="mt-auto p-6 space-y-6">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? <img src={user.photoURL} alt="" /> : <span className="font-bold text-xs">{user?.displayName?.[0] || 'U'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">{user?.displayName || 'Student'}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{isAdmin ? 'Governance' : 'Sovereign'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <Link 
                href="/settings" 
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
              <button 
                onClick={() => {
                  logout();
                  onClose?.();
                }}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Exit
              </button>
            </div>
          </div>

          <div className="px-4 flex items-center justify-between text-[10px] font-bold text-muted-foreground opacity-30">
            <span>v2.4.0-STABLE</span>
            <span>OS 01</span>
          </div>
        </div>
      </aside>
    </>
  );
}
