<?php

namespace App\Http\Controllers;

use App\Events\ReactionCreated;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReactionController extends Controller
{
    public function reactToPost(Request $request, Post $post): JsonResponse
    {
        $this->authorize('react', $post);

        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'])],
        ]);

        $existing = $post->reactions()->where('user_id', $request->user()->id)->first();

        if ($existing && $existing->type === $data['type']) {
            $existing->delete();
            return response()->json(['id' => $existing->id, 'reactable_id' => $post->id, 'reactable_type' => 'App\\Models\\Post', 'action' => 'removed', 'type' => $data['type']]);
        }

        $reaction = $post->reactions()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['type' => $data['type']]
        );

        $reaction->load('reactable:id,community_id');
        broadcast(new ReactionCreated($reaction))->toOthers();

        return response()->json(['id' => $reaction->id, 'reactable_id' => $post->id, 'reactable_type' => 'App\\Models\\Post', 'action' => 'created', 'type' => $data['type']], 201);
    }

    public function unreactToPost(Request $request, Post $post): JsonResponse
    {
        $this->authorize('react', $post);

        $existing = $post->reactions()->where('user_id', $request->user()->id)->first();
        if ($existing) {
            $existing->delete();
        }

        return response()->json(['status' => 'ok']);
    }

    public function reactToComment(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('react', $comment);

        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'])],
        ]);

        $existing = $comment->reactions()->where('user_id', $request->user()->id)->first();

        if ($existing && $existing->type === $data['type']) {
            $existing->delete();
            return response()->json(['id' => $existing->id, 'reactable_id' => $comment->id, 'reactable_type' => 'App\\Models\\Comment', 'action' => 'removed', 'type' => $data['type']]);
        }

        $reaction = $comment->reactions()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['type' => $data['type']]
        );

        $reaction->load('reactable:id,community_id');
        broadcast(new ReactionCreated($reaction))->toOthers();

        return response()->json(['id' => $reaction->id, 'reactable_id' => $comment->id, 'reactable_type' => 'App\\Models\\Comment', 'action' => 'created', 'type' => $data['type']], 201);
    }

    public function unreactToComment(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('react', $comment);

        $existing = $comment->reactions()->where('user_id', $request->user()->id)->first();
        if ($existing) {
            $existing->delete();
        }

        return response()->json(['status' => 'ok']);
    }
}
