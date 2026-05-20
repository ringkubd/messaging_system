'use client';
import { type ReactNode } from 'react';
import { Sidebar } from '@/_components/navigation/sidebar';
import { Topbar } from '@/_components/navigation/topbar';
import { useUIStore } from '@/_stores/ui-store';

export function AppLayout({ children }: { children: ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Topbar />
        <main className="p-6 pt-20">{children}</main>
      </div>
    </div>
  );
}
