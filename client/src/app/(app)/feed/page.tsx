'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { useFeedStore } from '@/_stores/feed-store';
import { PageHeader } from '@/_components/shared/page-header';
import { EmptyState } from '@/_components/shared/empty-state';
import { ListSkeleton } from '@/_components/shared/loading-skeleton';
import { formatTimeAgo } from '@/_lib/utils';
import { FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FeedPage() {
  const { sort, setSort, composerOpen, toggleComposer } = useFeedStore();

  const { data, isLoading } = useQuery({
    queryKey: ['feed', sort],
    queryFn: () => apiClient.get(`/posts?sort=${sort}`).then((r) => r.data),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Feed" description="Stay connected with your community." />

      <div className="mb-4 p-4 rounded-xl border bg-card">
        <button onClick={toggleComposer} className="flex items-center gap-3 w-full text-left">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-muted-foreground text-sm">What's on your mind?</span>
        </button>
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <span>📷</span> Photo
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <span>🎥</span> Video
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <span>📄</span> Document
          </button>
        </div>
      </div>

      <div className="mb-4">
        <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
          <TabsList>
            <TabsTrigger value="smart">Smart</TabsTrigger>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : !data?.data?.length ? (
        <EmptyState icon={<MessageSquare className="w-6 h-6" />} title="No posts yet" description="Be the first to share something with the community." />
      ) : (
        <div className="space-y-4">
          {data.data.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(post.user_reaction === 'like');
  const [likesCount, setLikesCount] = useState(post.likes_count || post.reactions_count);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {post.author?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{post.author?.name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
        </div>
        {post.is_from_friend && (
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">Friend</span>
        )}
      </div>

      {post.body && <p className="text-sm whitespace-pre-wrap">{post.body}</p>}

      {post.media?.length > 0 && (
        <div className="rounded-lg overflow-hidden bg-muted">
          <img src={post.media[0]} alt="" className="w-full h-64 object-cover" />
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t">
        <button onClick={() => { setLiked(!liked); setLikesCount((c: number) => liked ? c - 1 : c + 1); }}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}>
          {liked ? '❤️' : '🤍'} <span>{likesCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          💬 <span>{post.comments_count || 0}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
          🔄 <span>{0}</span>
        </button>
      </div>
    </div>
  );
}
