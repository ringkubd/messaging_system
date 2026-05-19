<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function queue(Request $request): JsonResponse
    {
        $type = $request->get('type');

        $flaggedPosts = collect();
        $flaggedComments = collect();

        if (!$type || $type === 'posts') {
            $flaggedPosts = Post::query()
                ->where('moderation_status', 'flagged')
                ->with(['author:id,name,email'])
                ->latest('moderated_at')
                ->get()
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'type' => 'post',
                    'body' => $post->body,
                    'author' => $post->author,
                    'reason' => $post->moderation_reason,
                    'moderated_at' => $post->moderated_at?->toISOString(),
                    'created_at' => $post->created_at->toISOString(),
                ]);
        }

        if (!$type || $type === 'comments') {
            $flaggedComments = Comment::query()
                ->where('moderation_status', 'flagged')
                ->with(['author:id,name,email'])
                ->latest('moderated_at')
                ->get()
                ->map(fn (Comment $comment) => [
                    'id' => $comment->id,
                    'type' => 'comment',
                    'body' => $comment->body,
                    'author' => $comment->author,
                    'reason' => $comment->moderation_reason,
                    'moderated_at' => $comment->moderated_at?->toISOString(),
                    'created_at' => $comment->created_at->toISOString(),
                ]);
        }

        $items = $flaggedPosts->concat($flaggedComments)->sortByDesc('moderated_at')->values();

        return response()->json($items);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $model = null;
        $type = $request->get('type', 'post');

        if ($type === 'post') {
            $model = Post::query()->with(['author:id,name,email'])->find((int) $id);
        } else {
            $model = Comment::query()->with(['author:id,name,email'])->find((int) $id);
        }

        if (!$model) {
            return response()->json(['message' => 'Content not found.'], 404);
        }

        return response()->json([
            'id' => $model->id,
            'type' => $type,
            'body' => $model->body,
            'author' => $model->author,
            'moderation_status' => $model->moderation_status,
            'moderation_reason' => $model->moderation_reason,
            'moderated_at' => $model->moderated_at?->toISOString(),
            'created_at' => $model->created_at->toISOString(),
        ]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $type = $request->get('type', 'post');

        $model = $type === 'post'
            ? Post::query()->find((int) $id)
            : Comment::query()->find((int) $id);

        if (!$model) {
            return response()->json(['message' => 'Content not found.'], 404);
        }

        $model->update([
            'moderation_status' => 'approved',
            'moderated_at' => now(),
        ]);

        AuditLog::log(
            $request->user(),
            'moderation.approve',
            $type,
            $model->id,
            ['moderation_status' => 'approved']
        );

        return response()->json(['message' => 'Content approved.']);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $type = $request->get('type', 'post');

        $model = $type === 'post'
            ? Post::query()->find((int) $id)
            : Comment::query()->find((int) $id);

        if (!$model) {
            return response()->json(['message' => 'Content not found.'], 404);
        }

        $model->update([
            'moderation_status' => 'rejected',
            'moderation_reason' => $data['reason'],
            'moderated_at' => now(),
        ]);

        AuditLog::log(
            $request->user(),
            'moderation.reject',
            $type,
            $model->id,
            ['moderation_status' => 'rejected', 'reason' => $data['reason']]
        );

        return response()->json(['message' => 'Content rejected.']);
    }

    public function stats(): JsonResponse
    {
        $totalReviewedToday = Post::query()->whereNotNull('moderated_at')
            ->whereDate('moderated_at', today())
            ->count()
            + Comment::query()->whereNotNull('moderated_at')
                ->whereDate('moderated_at', today())
                ->count();

        $totalFlagged = Post::query()->where('moderation_status', 'flagged')->count()
            + Comment::query()->where('moderation_status', 'flagged')->count();

        $totalApproved = Post::query()->where('moderation_status', 'approved')->count()
            + Comment::query()->where('moderation_status', 'approved')->count();

        $totalProcessed = $totalFlagged + $totalApproved;
        $flagRate = $totalProcessed > 0 ? round(($totalFlagged / $totalProcessed) * 100, 1) : 0;

        $flaggedPosts = Post::query()->where('moderation_status', 'flagged')->count();
        $flaggedComments = Comment::query()->where('moderation_status', 'flagged')->count();

        $topReasons = Post::query()
            ->whereNotNull('moderation_reason')
            ->selectRaw('moderation_reason, COUNT(*) as count')
            ->groupBy('moderation_reason')
            ->orderByDesc('count')
            ->take(5)
            ->get()
            ->map(fn ($item) => ['reason' => $item->moderation_reason, 'count' => $item->count]);

        return response()->json([
            'total_reviewed_today' => $totalReviewedToday,
            'total_flagged' => $totalFlagged,
            'total_approved' => $totalApproved,
            'flag_rate' => $flagRate,
            'flagged_posts' => $flaggedPosts,
            'flagged_comments' => $flaggedComments,
            'top_reasons' => $topReasons,
        ]);
    }
}
