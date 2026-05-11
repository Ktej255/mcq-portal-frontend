"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, History, BarChart3, Settings } from 'lucide-react';

const studentNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Available Tests', href: '/tests', icon: FileText },
  { name: 'Test History', href: '/history', icon: History },
  { name: 'Analytics', href: '/reports', icon: BarChart3 },
];

const adminNavItems = [
  { name: 'Admin Home', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Manage Tests', href: '/admin/tests', icon: FileText },
  { name: 'Student Analytics', href: '/admin/analytics', icon: BarChart3 },
];

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, X } from 'lucide-react';

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
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex flex-col h-full transition-transform duration-300 md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <h2 className="text-lg font-bold tracking-tight text-primary">MCQ Portal</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground font-medium' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t space-y-4">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user?.displayName || user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{isAdmin ? 'Administrator' : 'Student Account'}</p>
          </div>
          
          <div className="space-y-1">
            <Link 
              href="/settings" 
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button 
              onClick={() => {
                logout();
                onClose?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
