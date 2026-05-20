'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { ListSkeleton } from '@/_components/shared/loading-skeleton';
import { Calendar, MapPin, Clock, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const eventTypes = ['workshop', 'seminar', 'hackathon', 'career_fair', 'training', 'alumni_meetup', 'other'];

export default function EventsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', typeFilter],
    queryFn: () => apiClient.get(`/events${typeFilter ? `?type=${typeFilter}` : ''}`).then(r => r.data),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Events" description="Discover and register for workshops, seminars, and more.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
            + Create Event
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <CreateEventForm onSuccess={() => { setCreateOpen(false); queryClient.invalidateQueries({ queryKey: ['events'] }); }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="">All</TabsTrigger>
          {eventTypes.map(t => <TabsTrigger key={t} value={t} className="capitalize">{t.replace('_', ' ')}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {isLoading ? <ListSkeleton /> : !data?.data?.length ? (
        <EmptyState icon={<Calendar className="w-6 h-6" />} title="No events found" description="Check back later for upcoming events." action={<Button onClick={() => setCreateOpen(true)}>Create Event</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((event: any) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const queryClient = useQueryClient();
  const register = useMutation({
    mutationFn: () => apiClient.post(`/events/${event.id}/register`),
    onSuccess: () => { toast.success('Registered!'); queryClient.invalidateQueries({ queryKey: ['events'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Could not register'),
  });

  return (
    <Card className="p-0 overflow-hidden hover:shadow-md transition-shadow">
      {event.image && <div className="h-40 bg-muted"><img src={event.image} alt="" className="w-full h-full object-cover" /></div>}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className="text-[10px] uppercase mb-1">{event.event_type?.replace('_', ' ')}</Badge>
            <h3 className="font-semibold leading-tight">{event.title}</h3>
          </div>
        </div>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{formatDate(event.start_date)}</div>
          {event.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{event.location}</div>}
          <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{event.max_participants ? `${event.registrations_count}/${event.max_participants}` : `${event.registrations_count} registered`}</div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant={event.user_registration ? 'secondary' : 'default'} onClick={() => register.mutate()} disabled={register.isPending} className="flex-1">
            {event.user_registration ? 'Registered ✓' : 'Register'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CreateEventForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', event_type: 'workshop', location: '', online_url: '', max_participants: '', start_date: '', end_date: '' });
  const mutation = useMutation({
    mutationFn: () => apiClient.post('/events', { ...form, max_participants: form.max_participants ? parseInt(form.max_participants) : null }),
    onSuccess: () => { toast.success('Event created!'); onSuccess(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <Input placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      <Textarea placeholder="Description *" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
      <div className="grid grid-cols-2 gap-3">
        <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v || 'workshop' }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{eventTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="number" placeholder="Max participants" value={form.max_participants} onChange={e => setForm(p => ({ ...p, max_participants: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input type="datetime-local" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
        <Input type="datetime-local" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required />
      </div>
      <Input placeholder="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
      <Input type="url" placeholder="Online URL (Google Meet / Zoom)" value={form.online_url} onChange={e => setForm(p => ({ ...p, online_url: e.target.value }))} />
      <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create Event'}</Button>
    </form>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
