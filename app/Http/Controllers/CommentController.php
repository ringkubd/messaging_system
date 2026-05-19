<?php

namespace App\Http\Controllers;

use App\Events\CommentCreated;
use App\Jobs\AIModerateContent;
use App\Models\Comment;
use App\Models\Post;
use App\Services\FileUploadService;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        $comments = $post->comments()
            ->whereNull('parent_id')
            ->with(['author:id,name,email', 'replies.author:id,name,email'])
            ->withCount('reactions')
            ->latest('id')
            ->paginate(30);

        return response()->json($comments);
    }

    public function store(Request $request, Post $post): JsonResponse
    {
        $this->authorize('comment', $post);

        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:5120'],
        ]);

        if (! empty($data['parent_id'])) {
            $parentInPost = $post->comments()->where('id', $data['parent_id'])->exists();
            abort_unless($parentInPost, 422, 'parent_id must belong to the selected post.');
        }

        $media = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $upload = FileUploadService::upload($file, 'comments');
                if ($upload) {
                    $media[] = $upload;
                }
            }
        }

        if (! $data['body'] && count($media) === 0) {
            return response()->json(['message' => 'Write something or attach an image.'], 422);
        }

        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'parent_id' => $data['parent_id'] ?? null,
            'body' => $data['body'] ?? null,
            'media' => $media ?: null,
        ]);

        $comment->load(['author:id,name,email', 'post:id,community_id']);

        broadcast(new CommentCreated($comment))->toOthers();

        app(GamificationService::class)->awardPoints($request->user(), 'comment_created');

        AIModerateContent::dispatch('comment', $comment->id);

        return response()->json($comment, 201);
    }

    public function update(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
        ]);

        if (! isset($data['body']) || trim((string) $data['body']) === '') {
            return response()->json(['message' => 'Comment cannot be empty.'], 422);
        }

        $comment->update([
            'body' => trim((string) $data['body']),
        ]);

        $comment->load(['author:id,name,email']);

        return response()->json($comment);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}
