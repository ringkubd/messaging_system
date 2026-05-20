'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Calendar, Video, Users2, BookOpen, Briefcase, MessageCircle, LayoutDashboard, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const pages = [
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

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(s => !s);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filtered = pages.filter(p =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-24 -translate-y-0 sm:max-w-lg p-0 gap-0">
        <div className="flex items-center border-b px-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="border-0 h-12 focus-visible:ring-0 text-base"
            autoFocus
          />
          <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((page) => {
            const Icon = page.icon;
            return (
              <button key={page.href} onClick={() => handleSelect(page.href)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-left"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                {page.label}
              </button>
            );
          })}
          {!filtered.length && <p className="text-sm text-muted-foreground text-center py-6">No pages found</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
