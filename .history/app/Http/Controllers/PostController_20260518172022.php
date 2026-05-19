<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Community;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Post::query()
            ->with(['author:id,name,email', 'community:id,name,slug'])
            ->withCount(['comments', 'reactions'])
            ->latest('id');

        $query->where(function ($visibilityQuery) use ($user) {
            $visibilityQuery->whereNull('community_id')
                ->orWhereHas('community', function ($communityQuery) use ($user) {
                    $communityQuery->where('is_private', false)
                        ->orWhereHas('members', function ($memberQuery) use ($user) {
                            $memberQuery->where('users.id', $user->id);
                        });
                });
        });

        if ($request->filled('community_id')) {
            $query->where('community_id', (int) $request->input('community_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Post::class);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
            'community_id' => ['nullable', 'integer', 'exists:communities,id'],
            'media' => ['nullable', 'array'],
        ]);

        if (! empty($data['community_id'])) {
            $community = Community::query()->findOrFail((int) $data['community_id']);
            $this->authorize('view', $community);
        }

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
        $this->authorize('view', $post);

        return response()->json($post->load(['author:id,name,email', 'community:id,name,slug']));
    }
}
