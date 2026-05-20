'use client';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { useAuthStore } from '@/_stores/auth-store';
import { getInitials } from '@/_lib/utils';
import { PageHeader } from '@/_components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => apiClient.get('/me/stats').then(r => r.data),
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-700" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-1.5 mt-1">
                <Badge variant="secondary" className="text-[10px]">{user.role === 'super_admin' ? 'Super Admin' : 'Student'}</Badge>
                {user.round && <Badge variant="outline" className="text-[10px]">Round {user.round}</Badge>}
                {user.batch && <Badge variant="outline" className="text-[10px]">Batch {user.batch}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Posts', value: stats?.posts_count || 0 },
          { label: 'Comments', value: stats?.comments_count || 0 },
          { label: 'Round', value: user.round || '-' },
          { label: 'Batch', value: user.batch || '-' },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Scholarship Info</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Name', user.name],
            ['Email', user.email],
            ['Phone', user.phone || 'Not set'],
            ['Address', user.address || 'Not set'],
            ['Round', user.round || 'Not set'],
            ['Batch', user.batch || 'Not set'],
            ['Course', user.course || 'Not set'],
            ['Role', user.role],
            ['Member since', new Date(user.created_at).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">{label}:</span>
              <span className="font-medium truncate">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
