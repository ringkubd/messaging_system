'use client';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { KPICard } from '@/_components/shared/kpi-card';
import { KPISkeleton } from '@/_components/shared/loading-skeleton';
import { Users, FileText, Calendar, Activity, MessageCircle, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo } from '@/_lib/utils';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get('/admin/dashboard').then(r => r.data),
  });

  if (isLoading) return <div className="max-w-6xl mx-auto space-y-6"><KPISkeleton /></div>;

  const d = data || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enterprise Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time platform metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Total Users" value={d.users?.total || 0} trend={{ value: `${d.users?.new_today || 0} today`, positive: true }} icon={<Users className="w-4 h-4" />} />
        <KPICard label="Active (7d)" value={d.users?.active_users || 0} icon={<Activity className="w-4 h-4" />} />
        <KPICard label="Total Posts" value={d.engagement?.posts || 0} icon={<FileText className="w-4 h-4" />} />
        <KPICard label="Comments" value={d.engagement?.comments || 0} icon={<MessageCircle className="w-4 h-4" />} />
        <KPICard label="Upcoming Events" value={d.events?.upcoming || 0} icon={<Calendar className="w-4 h-4" />} />
        <KPICard label="Attendance" value={`${d.events?.attendance_rate || 0}%`} icon={<Trophy className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-4">Activity (30 days)</h3>
          <div className="flex items-end gap-1 h-40">
            {(d.activity || []).map((day: any, i: number) => {
              const max = Math.max(...(d.activity || []).map((a: any) => Math.max(a.posts || 0, a.comments || 0, a.registrations || 0)), 1);
              const total = (day.posts || 0) + (day.comments || 0) + (day.registrations || 0);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${day.date}: ${day.posts || 0} posts, ${day.comments || 0} comments`}>
                  <div className="w-full bg-emerald-400 rounded-t" style={{ height: `${((day.registrations || 0) / max) * 80}px` }} />
                  <div className="w-full bg-blue-400" style={{ height: `${((day.comments || 0) / max) * 80}px` }} />
                  <div className="w-full bg-emerald-600 rounded-b" style={{ height: `${((day.posts || 0) / max) * 80}px` }} />
                  {i % 5 === 0 && <span className="text-[8px] text-muted-foreground mt-1">{new Date(day.date).getDate()}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Posts</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-400" /> Comments</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Registrations</span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Users by Role</h3>
          <div className="space-y-3">
            {Object.entries(d.users?.by_role || {}).map(([role, count]) => {
              const total = Object.values(d.users?.by_role || {}).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0);
              return (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((count as number) / Math.max(total, 1)) * 100}%` }} />
                    </div>
                    <Badge variant="secondary" className="text-[10px] w-8 justify-center">{count as number}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(d.recent_activity || []).slice(0, 8).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground flex-1 truncate">{item.description || `${item.action} on ${item.resource_type}`}</span>
                <span className="text-xs text-muted-foreground shrink-0">{item.created_at ? formatTimeAgo(item.created_at) : ''}</span>
              </div>
            ))}
            {!(d.recent_activity?.length) && <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-4">Scholarship Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Total Programs</p>
              <p className="text-xl font-bold">{d.scholarships?.total || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Active Batches</p>
              <p className="text-xl font-bold">{d.scholarships?.active_batches || 0}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
