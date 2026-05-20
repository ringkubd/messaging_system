'use client';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { KPICard } from '@/_components/shared/kpi-card';
import { KPISkeleton } from '@/_components/shared/loading-skeleton';
import { formatTimeAgo } from '@/_lib/utils';
import { FileText, MessageCircle, Calendar, Users, TrendingUp, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get('/me/stats').then(r => r.data),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="Dashboard" description="Welcome back! Here's your overview." />

      {isLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Posts" value={stats?.posts_count || 0} icon={<FileText className="w-4 h-4" />} />
          <KPICard label="Comments" value={stats?.comments_count || 0} icon={<MessageCircle className="w-4 h-4" />} />
          <KPICard label="Unread Messages" value={stats?.unread_messages_count || 0} icon={<Activity className="w-4 h-4" />} />
          <KPICard label="Notifications" value={stats?.unread_notifications_count || 0} icon={<Calendar className="w-4 h-4" />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Recent Posts</h3>
          {stats?.recent_posts?.length ? stats.recent_posts.slice(0, 5).map((post: any) => (
            <div key={post.id} className="flex items-start gap-3 py-2 border-b last:border-0">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm truncate">{post.body}</p>
                <p className="text-xs text-muted-foreground">{post.community ? `in ${post.community.name}` : ''} · {formatTimeAgo(post.created_at)}</p>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground py-4 text-center">No posts yet</p>}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Recent Comments</h3>
          {stats?.recent_comments?.length ? stats.recent_comments.slice(0, 5).map((comment: any) => (
            <div key={comment.id} className="flex items-start gap-3 py-2 border-b last:border-0">
              <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm truncate">{comment.body}</p>
                <p className="text-xs text-muted-foreground">{comment.post?.body ? `on "${comment.post.body}"` : ''} · {formatTimeAgo(comment.created_at)}</p>
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground py-4 text-center">No comments yet</p>}
        </Card>
      </div>
    </div>
  );
}
