'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { ListSkeleton } from '@/_components/shared/loading-skeleton';
import { Users2, Search, Lock, Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getInitials } from '@/_lib/utils';

export default function GroupsPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', is_private: false });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['communities', tab, search],
    queryFn: () => apiClient.get(`/communities?filter=${tab}&search=${search}`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/communities', form),
    onSuccess: () => { toast.success('Community created!'); setCreateOpen(false); setForm({ name: '', description: '', is_private: false }); queryClient.invalidateQueries({ queryKey: ['communities'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const joinMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`/communities/${id}/join`),
    onSuccess: () => { toast.success('Joined!'); queryClient.invalidateQueries({ queryKey: ['communities'] }); },
  });

  const groups = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Communities" description="Find your people. Join batch groups, interest groups, and more.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"><Plus className="w-4 h-4 mr-1" />New Community</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Community</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <Input placeholder="Community name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_private} onChange={e => setForm(p => ({ ...p, is_private: e.target.checked }))} className="rounded" />
                Private community
              </label>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search communities..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger value="mine">My Communities</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? <ListSkeleton /> : !groups.length ? (
        <EmptyState icon={<Users2 className="w-6 h-6" />} title="No communities found" description="Create one or search for existing groups." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: any) => (
            <Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{getInitials(group.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{group.name}</h3>
                  <p className="text-xs text-muted-foreground">{group.members_count || 0} members</p>
                </div>
                {group.is_private ? <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
              </div>
              {group.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {(group.tags || []).slice(0, 3).map((tag: string) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>
              <Button size="sm" variant={group.joined ? 'secondary' : 'default'} onClick={() => !group.joined && joinMutation.mutate(group.id)} disabled={group.joined} className="w-full">
                {group.joined ? 'Joined ✓' : 'Join'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
