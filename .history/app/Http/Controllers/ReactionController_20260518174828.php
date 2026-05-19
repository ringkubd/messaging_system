<?php

namespace App\Http\Controllers;

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

        $reaction = $post->reactions()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['type' => $data['type']]
        );

        return response()->json($reaction, 201);
    }

    public function reactToComment(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('react', $comment);

        $data = $request->validate([
            'type' => ['required', 'string', Rule::in(['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'])],
        ]);

        $reaction = $comment->reactions()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['type' => $data['type']]
        );

        return response()->json($reaction, 201);
    }
}
