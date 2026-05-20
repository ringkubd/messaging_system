'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { ListSkeleton } from '@/_components/shared/loading-skeleton';
import { Video, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDate, formatTimeAgo } from '@/_lib/utils';

export default function LivePage() {
  const [tab, setTab] = useState('live');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '' });
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['live-streams', tab],
    queryFn: () => apiClient.get(`/live-streams${tab ? `?status=${tab}` : ''}`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/live-streams', { ...form, scheduled_at: form.scheduled_at || null }),
    onSuccess: (res) => { toast.success('Stream created!'); setCreateOpen(false); setForm({ title: '', description: '', scheduled_at: '' }); queryClient.invalidateQueries({ queryKey: ['live-streams'] }); router.push(`/live/${res.data.id}`); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const streams = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Live" description="Live streams, webinars, and video calls.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"><Plus className="w-4 h-4 mr-1" />New Stream</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Live Stream</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <Input placeholder="Stream title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <Input type="datetime-local" placeholder="Schedule (optional)" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} />
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Stream'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="live">Live Now</TabsTrigger>
          <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? <ListSkeleton /> : !streams.length ? (
        <EmptyState icon={<Video className="w-6 h-6" />} title="No streams" description="Create a stream or check back later." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream: any) => (
            <Card key={stream.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/live/${stream.id}`)}>
              <div className="h-40 bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center relative">
                {stream.status === 'live' && <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE</span>}
                <Video className="w-10 h-10 text-white/50" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm truncate">{stream.title}</h3>
                {stream.creator && <p className="text-xs text-muted-foreground mt-0.5">by {stream.creator.name}</p>}
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <Badge variant={stream.status === 'live' ? 'default' : stream.status === 'scheduled' ? 'secondary' : 'outline'} className="text-[10px]">
                    {stream.status === 'scheduled' && stream.scheduled_at ? formatDate(stream.scheduled_at) : stream.status}
                  </Badge>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />0</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
