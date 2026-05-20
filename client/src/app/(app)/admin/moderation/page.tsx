'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function ModerationPage() {
  const [tab, setTab] = useState('flagged');
  const queryClient = useQueryClient();

  const { data: queue } = useQuery({
    queryKey: ['moderation-queue', tab],
    queryFn: () => apiClient.get(`/admin/moderation`).then(r => r.data),
  });

  const approve = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/moderation/${id}/approve`),
    onSuccess: () => { toast.success('Approved'); queryClient.invalidateQueries({ queryKey: ['moderation-queue'] }); },
  });

  const reject = useMutation({
    mutationFn: (id: number) => apiClient.post(`/admin/moderation/${id}/reject`, { reason: 'Inappropriate content' }),
    onSuccess: () => { toast.success('Rejected'); queryClient.invalidateQueries({ queryKey: ['moderation-queue'] }); },
  });

  const items = Array.isArray(queue?.data) ? queue.data : [];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Moderation" description="Review flagged content and reports." />

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="flagged">Flagged Content</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="ai-log">AI Log</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <EmptyState icon={<Shield className="w-6 h-6" />} title="Queue is clear" description="No content needs moderation right now." />
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{item.resource_type}</Badge>
                    <span className="text-xs text-muted-foreground">by User #{item.reporter_id || item.user_id}</span>
                  </div>
                  <p className="text-sm">{item.reason || item.moderation_reason || 'Flagged for review'}</p>
                  {item.details && <p className="text-xs text-muted-foreground mt-1">{item.details}</p>}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="default" onClick={() => approve.mutate(item.id)} disabled={approve.isPending}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => reject.mutate(item.id)} disabled={reject.isPending}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
