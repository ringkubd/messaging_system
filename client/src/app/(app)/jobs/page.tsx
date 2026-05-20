'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { ListSkeleton } from '@/_components/shared/loading-skeleton';
import { Briefcase, MapPin, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function JobsPage() {
  const [tab, setTab] = useState('browse');
  const { data, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.get('/jobs').then(r => r.data),
  });

  const jobs = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Jobs" description="Find your next opportunity.">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="matching">Matching</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="relative mb-6">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search jobs by title, company, or skills..." />
      </div>

      {isLoading ? <ListSkeleton /> : !jobs.length ? (
        <EmptyState icon={<Briefcase className="w-6 h-6" />} title="No jobs available" description="Check back later for new opportunities." />
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <Card key={job.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company?.name || 'Unknown Company'}</p>
                    </div>
                    {job.match_score != null && (
                      <Badge className={job.match_score >= 80 ? 'bg-emerald-500' : job.match_score >= 50 ? 'bg-amber-500' : 'bg-muted-foreground'}>
                        {job.match_score}% match
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.type?.replace('_', ' ')}</span>
                    {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                    {job.salary_range && <span className="flex items-center gap-1">{job.salary_range}</span>}
                    {job.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                  </div>
                  {job.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.skills_required.slice(0, 5).map((skill: string) => (
                        <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{skill}</span>
                      ))}
                      {job.skills_required.length > 5 && <span className="text-[10px] text-muted-foreground">+{job.skills_required.length - 5} more</span>}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
