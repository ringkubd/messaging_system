'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/_lib/utils';
import { useUIStore } from '@/_stores/ui-store';
import { useAuthStore } from '@/_stores/auth-store';
import {
  LayoutDashboard, FileText, Calendar, Video, Users2, BookOpen,
  Briefcase, GraduationCap, MessageCircle, ChevronLeft, ChevronRight,
  Shield, Settings, Activity, ClipboardList, Building2, ScrollText,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/feed', label: 'Feed', icon: FileText },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/live', label: 'Live', icon: Video },
  { href: '/groups', label: 'Groups', icon: Users2 },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/alumni', label: 'Alumni', icon: GraduationCap },
  { href: '/chat', label: 'Chats', icon: MessageCircle },
];

const adminItems = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: Activity },
  { href: '/admin/users', label: 'Users', icon: Shield },
  { href: '/admin/moderation', label: 'Moderation', icon: ClipboardList },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/placements', label: 'Placements', icon: Briefcase },
  { href: '/admin/scholarships', label: 'Scholarships', icon: GraduationCap },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.is_admin ?? false;

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-card border-r border-border z-30 transition-all duration-300 flex flex-col',
      sidebarOpen ? 'w-64' : 'w-16'
    )}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">IB</span>
        </div>
        {sidebarOpen && <span className="font-semibold text-sm truncate">IsDB-BISEW</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="space-y-1">
          {sidebarOpen && <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Main</div>}
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {isAdmin && (
          <div className="pt-4 space-y-1">
            {sidebarOpen && <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</div>}
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    active ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border">
        <button onClick={toggleSidebar} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
