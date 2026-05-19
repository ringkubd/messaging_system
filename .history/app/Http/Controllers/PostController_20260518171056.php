<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Post::query()
            ->with(['author:id,name,email', 'community:id,name,slug'])
            ->withCount(['comments', 'reactions'])
            ->latest('id');

        if ($request->filled('community_id')) {
            $query->where('community_id', (int) $request->input('community_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
            'community_id' => ['nullable', 'integer', 'exists:communities,id'],
            'media' => ['nullable', 'array'],
        ]);

        $post = Post::create([
            'user_id' => $request->user()->id,
            'community_id' => $data['community_id'] ?? null,
            'body' => $data['body'],
            'media' => $data['media'] ?? null,
        ]);

        return response()->json($post->load(['author:id,name,email', 'community:id,name,slug']), 201);
    }

    public function show(Post $post): JsonResponse
    {
        return response()->json($post->load(['author:id,name,email', 'community:id,name,slug']));
    }
}
