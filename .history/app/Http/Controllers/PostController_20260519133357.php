<?php

namespace App\Http\Controllers;

use App\Events\CommunityPostCreated;
use App\Events\PostCreated;
use App\Models\Post;
use App\Models\Community;
use App\Services\FileUploadService;
use App\Support\Idempotency;
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
        return Idempotency::rememberJsonResponse($request, 'post-create', function () use ($request) {
            $this->authorize('create', Post::class);

            $data = $request->validate([
                'body' => ['nullable', 'string', 'max:10000'],
                'community_id' => ['nullable', 'integer', 'exists:communities,id'],
                'media' => ['nullable', 'array'],
                'images' => ['nullable', 'array'],
                'images.*' => ['image', 'max:5120'],
            ]);

            $hasBody = isset($data['body']) && trim((string) $data['body']) !== '';
            $hasInlineMedia = ! empty($data['media']);
            $hasUploadedImages = $request->hasFile('images');

            if (! $hasBody && ! $hasInlineMedia && ! $hasUploadedImages) {
                return response()->json([
                    'message' => 'Write something or attach media before posting.',
                ], 422);
            }

            if (! empty($data['community_id'])) {
                $community = Community::query()->findOrFail((int) $data['community_id']);
                $this->authorize('view', $community);
            }

            $media = $data['media'] ?? [];

            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $file) {
                    $upload = FileUploadService::upload($file, 'posts');
                    if ($upload) {
                        $media[] = $upload;
                    }
                }
            }

            $post = Post::create([
                'user_id' => $request->user()->id,
                'community_id' => $data['community_id'] ?? null,
                'body' => $hasBody ? trim((string) $data['body']) : '',
                'media' => $media ?: null,
            ]);

            $post->load(['author:id,name,email', 'community:id,name,slug']);

            broadcast(new PostCreated($post))->toOthers();

            if ($post->community_id) {
                broadcast(new CommunityPostCreated($post))->toOthers();
            }

            return response()->json($post, 201);
        });
    }

    public function show(Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        return response()->json($post->load(['author:id,name,email', 'community:id,name,slug']));
    }
}
