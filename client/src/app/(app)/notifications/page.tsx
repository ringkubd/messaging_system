'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { Bell, CheckCheck, Heart, MessageCircle, UserPlus, Calendar, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatTimeAgo } from '@/_lib/utils';

const iconMap: Record<string, any> = {
  like: Heart, comment: MessageCircle, friend: UserPlus,
  event: Calendar, job: Briefcase, default: Bell,
};

export default function NotificationsPage() {
  const [tab, setTab] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications').then(r => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiClient.post('/notifications/read-all'),
    onSuccess: () => { toast.success('All marked as read'); queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const notifications = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Notifications" description="Stay updated with your community.">
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
          <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
        </Button>
      </PageHeader>

      <div className="space-y-2">
        {notifications.map((notif: any) => {
          const Icon = iconMap[notif.data?.kind] || iconMap.default;
          const isUnread = !notif.read_at;
          return (
            <Card key={notif.id} className={`p-4 flex items-start gap-4 ${isUnread ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : ''}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isUnread ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{notif.data?.message || 'You have a new notification'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(notif.created_at)}</p>
              </div>
              {isUnread && (
                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => markRead.mutate(notif.id)}>
                  Mark read
                </Button>
              )}
            </Card>
          );
        })}
        {!notifications.length && <EmptyState icon={<Bell className="w-6 h-6" />} title="No notifications" description="You're all caught up!" />}
      </div>
    </div>
  );
}
