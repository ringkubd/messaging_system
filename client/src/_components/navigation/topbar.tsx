'use client';
import Link from 'next/link';
import { useAuthStore } from '@/_stores/auth-store';
import { useUIStore } from '@/_stores/ui-store';
import { getInitials } from '@/_lib/utils';
import { Search, Bell, Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Topbar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  return (
    <header className="fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-b border-border z-20 transition-all duration-300" style={{ left: 'var(--sidebar-width, 16rem)' }}>
      <div className="flex items-center justify-between h-full px-6 gap-4">
        <div className="flex-1 max-w-md">
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search anything...</span>
            <kbd className="ml-auto text-xs bg-background px-1.5 py-0.5 rounded border text-muted-foreground">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link href="/notifications" className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-medium">{getInitials(user?.name || '')}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-tight">{user?.name}</p>
                <p className="text-xs text-muted-foreground leading-tight">{user?.role === 'super_admin' ? 'Super Admin' : `Round ${user?.round || 'Student'}`}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/profile'}><User className="w-4 h-4 mr-2" />Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/profile'}><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600"><LogOut className="w-4 h-4 mr-2" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
