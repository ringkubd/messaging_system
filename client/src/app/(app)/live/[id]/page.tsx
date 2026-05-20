'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDate, relativeTime } from '@/_lib/utils';
import { Video, ArrowLeft } from 'lucide-react';

export default function LiveWatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: stream, isLoading } = useQuery({
    queryKey: ['live-stream', id],
    queryFn: () => apiClient.get(`/live-streams/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    apiClient.get('/me').then(r => setUser(r.data)).catch(() => {});
  }, []);

  const isStreamer = user && stream && user.id === stream.created_by;

  const startMutation = useMutation({
    mutationFn: () => apiClient.post(`/live-streams/${id}/start`),
    onSuccess: () => { toast.success('You are live!'); queryClient.invalidateQueries({ queryKey: ['live-stream', id] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const endMutation = useMutation({
    mutationFn: () => apiClient.post(`/live-streams/${id}/end`),
    onSuccess: () => { toast.success('Stream ended'); queryClient.invalidateQueries({ queryKey: ['live-stream', id] }); },
  });

  if (isLoading) return <div className="max-w-4xl mx-auto space-y-4"><Skeleton className="h-64" /><Skeleton className="h-8 w-1/3" /><Skeleton className="h-4 w-2/3" /></div>;
  if (!stream) return <div className="max-w-4xl mx-auto text-center py-16"><p className="text-muted-foreground">Stream not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
        {stream.status === 'live' ? (
          <div className="text-center text-white">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            </div>
            <p className="text-lg font-semibold">Live Stream</p>
            <p className="text-sm text-white/60">Stream is in progress</p>
          </div>
        ) : stream.status === 'scheduled' ? (
          <div className="text-center text-white/60">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold text-white">Stream Scheduled</p>
            {stream.scheduled_at && <p className="text-sm mt-1">Starts {formatDate(stream.scheduled_at)}</p>}
          </div>
        ) : (
          <div className="text-center text-white/60">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold text-white">Stream Ended</p>
            {stream.ended_at && <p className="text-sm mt-1">Ended {relativeTime(stream.ended_at)}</p>}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={stream.status === 'live' ? 'default' : 'secondary'}>
              {stream.status === 'live' && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1.5 inline-block" />}
              {stream.status.toUpperCase()}
            </Badge>
            {stream.event && <Badge variant="outline">{stream.event.title}</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{stream.title}</h1>
          {stream.creator && <p className="text-sm text-muted-foreground mt-1">by {stream.creator.name}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          {isStreamer && stream.status === 'scheduled' && (
            <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              {startMutation.isPending ? 'Starting...' : 'Go Live'}
            </Button>
          )}
          {isStreamer && stream.status === 'live' && (
            <Button variant="destructive" onClick={() => endMutation.mutate()} disabled={endMutation.isPending}>
              {endMutation.isPending ? 'Ending...' : 'End Stream'}
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/live')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </div>

      {stream.description && (
        <Card className="p-4">
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{stream.description}</p>
        </Card>
      )}
    </div>
  );
}
