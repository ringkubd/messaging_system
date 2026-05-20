'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { ListSkeleton } from '@/_components/shared/loading-skeleton';
import { BookOpen, Search, Download, Star, Upload, FileText, Video, FileCode, File, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatTimeAgo, getInitials } from '@/_lib/utils';

const typeIcons: Record<string, any> = { pdf: FileText, video: Video, source_code: FileCode, template: File, default: File };
const typeLabels: Record<string, string> = { pdf: 'PDF', video: 'Video', source_code: 'Source Code', template: 'Template', document: 'Document', ebook: 'E-Book', other: 'Other' };

const resourceTypes = ['', 'pdf', 'video', 'document', 'ebook', 'source_code', 'template'];

export default function ResourcesPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['resources', typeFilter, search],
    queryFn: () => apiClient.get(`/resources?type=${typeFilter}&search=${search}`).then(r => r.data),
  });

  const resources = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Resource Library" description="Notes, templates, code samples, and learning materials.">
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"><Upload className="w-4 h-4 mr-1" />Upload Resource</DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Upload Resource</DialogTitle></DialogHeader>
            <UploadResourceForm onSuccess={() => { setUploadOpen(false); queryClient.invalidateQueries({ queryKey: ['resources'] }); }} />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="">All</TabsTrigger>
            {resourceTypes.filter(Boolean).map(t => <TabsTrigger key={t} value={t} className="capitalize">{typeLabels[t] || t}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? <ListSkeleton /> : !resources.length ? (
        <EmptyState icon={<BookOpen className="w-6 h-6" />} title="No resources yet" description="Upload study materials to help your batchmates." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource: any) => {
            const Icon = typeIcons[resource.type] || typeIcons.default;
            return (
              <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{resource.title}</h3>
                    <p className="text-xs text-muted-foreground">{resource.category?.name || typeLabels[resource.type] || resource.type}</p>
                  </div>
                </div>
                {resource.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{resource.description}</p>}
                {(resource.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(resource.tags || []).slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" />{resource.download_count || 0}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{resource.avg_rating ? resource.avg_rating.toFixed(1) : '—'}</span>
                  <span>{formatTimeAgo(resource.created_at)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UploadResourceForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', type: 'document', file: null as File | null });
  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type', form.type);
      if (form.file) fd.append('file', form.file);
      return apiClient.post('/resources', fd);
    },
    onSuccess: () => { toast.success('Uploaded!'); onSuccess(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Upload failed'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <Input placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
      <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v || 'document' }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {resourceTypes.filter(Boolean).map(t => <SelectItem key={t} value={t} className="capitalize">{typeLabels[t] || t}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer" onClick={() => document.getElementById('file-input')?.click()}>
        <ArrowUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, video, images, up to 50MB</p>
        <input id="file-input" type="file" className="hidden" onChange={e => setForm(p => ({ ...p, file: e.target.files?.[0] || null }))} />
      </div>
      {form.file && <p className="text-sm text-emerald-600">Selected: {form.file.name}</p>}
      <Button type="submit" className="w-full" disabled={mutation.isPending || !form.file}>{mutation.isPending ? 'Uploading...' : 'Upload'}</Button>
    </form>
  );
}
