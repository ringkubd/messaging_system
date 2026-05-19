<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
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
            'body' => ['required', 'string', 'max:5000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        if (! empty($data['parent_id'])) {
            $parentInPost = $post->comments()->where('id', $data['parent_id'])->exists();
            abort_unless($parentInPost, 422, 'parent_id must belong to the selected post.');
        }

        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $request->user()->id,
            'parent_id' => $data['parent_id'] ?? null,
            'body' => $data['body'],
        ]);

        return response()->json($comment->load('author:id,name,email'), 201);
    }
}
