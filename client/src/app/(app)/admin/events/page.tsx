'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { TableSkeleton } from '@/_components/shared/loading-skeleton';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminEventsPage() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', search],
    queryFn: () => apiClient.get(`/events?search=${search}`).then(r => r.data),
  });

  const deleteEvent = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/events/${id}`),
    onSuccess: () => { toast.success('Event deleted'); queryClient.invalidateQueries({ queryKey: ['admin-events'] }); },
  });

  const events = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Events Management" description="Create and manage all platform events.">
        <Button>+ New Event</Button>
      </PageHeader>

      <Card className="p-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      {isLoading ? <TableSkeleton /> : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Registrations</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event: any) => (
                <tr key={event.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-sm font-medium">{event.title}</td>
                  <td className="p-4 text-sm capitalize">{event.event_type?.replace('_', ' ')}</td>
                  <td className="p-4"><Badge variant={event.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">{event.status}</Badge></td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(event.start_date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm">{event.registrations_count || 0}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => deleteEvent.mutate(event.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
