'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { ListSkeleton } from '@/_components/shared/loading-skeleton';
import { GraduationCap, Search, MessageCircle, UserPlus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getInitials } from '@/_lib/utils';

export default function AlumniPage() {
  const [tab, setTab] = useState('directory');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: mentors, isLoading: mentorsLoading } = useQuery({
    queryKey: ['mentors'],
    queryFn: () => apiClient.get('/mentors').then(r => r.data),
  });

  const { data: stories, isLoading: storiesLoading } = useQuery({
    queryKey: ['success-stories'],
    queryFn: () => apiClient.get('/success-stories').then(r => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users', search],
    queryFn: () => apiClient.get(`/users?search=${search}`).then(r => r.data),
  });

  const mentorReq = useMutation({
    mutationFn: (mentorId: number) => apiClient.post('/mentorship-requests', { mentor_id: mentorId, message: 'I would like to connect!' }),
    onSuccess: () => { toast.success('Request sent!'); queryClient.invalidateQueries({ queryKey: ['mentors'] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const allUsers = Array.isArray(users?.data) ? users.data : [];
  const mentorList = Array.isArray(mentors?.data) ? mentors.data : [];
  const storyList = Array.isArray(stories?.data) ? stories.data : [];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Alumni Network" description="Connect with alumni, find mentors, and share your success story." />

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="mentors">Mentorship</TabsTrigger>
          <TabsTrigger value="stories">Success Stories</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'directory' && (
        <>
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name, batch, or skills..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.filter((u: any) => u.id !== 1).slice(0, 12).map((user: any) => (
              <Card key={user.id} className="p-4 flex items-center gap-4">
                <Avatar className="w-12 h-12"><AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.round ? `Round ${user.round}` : user.email}</p>
                  {user.batch && <Badge variant="outline" className="text-[10px] mt-1">Batch {user.batch}</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'mentors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentorList.map((mentor: any) => (
            <Card key={mentor.id} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12"><AvatarFallback className="text-xs">{getInitials(mentor.name || mentor.user?.name)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{mentor.name || mentor.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{mentor.skills?.slice(0, 3).join(', ') || 'Mentor'}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => mentorReq.mutate(mentor.id || mentor.user_id)} disabled={mentorReq.isPending}>
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Request
                </Button>
              </div>
            </Card>
          ))}
          {!mentorList.length && <div className="col-span-2"><EmptyState icon={<GraduationCap className="w-6 h-6" />} title="No mentors yet" description="Mentors will appear here when they offer mentorship." /></div>}
        </div>
      )}

      {tab === 'stories' && (
        <div className="space-y-4">
          {storyList.map((story: any) => (
            <Card key={story.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0"><Star className="w-4 h-4 text-amber-600" /></div>
                <div>
                  <h3 className="font-semibold">{story.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">by {story.user?.name || 'Anonymous'} {story.company ? `at ${story.company}` : ''}</p>
                  <p className="text-sm whitespace-pre-wrap">{story.story}</p>
                </div>
              </div>
            </Card>
          ))}
          {!storyList.length && <EmptyState icon={<Star className="w-6 h-6" />} title="No stories yet" description="Be the first to share your success story!" />}
        </div>
      )}
    </div>
  );
}
