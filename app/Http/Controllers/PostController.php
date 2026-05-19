<?php

namespace App\Http\Controllers;

use App\Events\CommunityPostCreated;
use App\Events\PostCreated;
use App\Jobs\AIAutoTagContent;
use App\Jobs\AIModerateContent;
use App\Models\Post;
use App\Models\Community;
use App\Services\FeedRankingService;
use App\Services\FileUploadService;
use App\Services\GamificationService;
use App\Support\Idempotency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $sort = in_array($request->input('sort'), ['smart', 'latest', 'popular'], true)
            ? $request->input('sort')
            : config('feed.default_sort', 'smart');

        $query = Post::query()
            ->where(function ($q) use ($user) {
                $q->visible()
                  ->orWhere('user_id', $user->id);
            })
            ->with(['author:id,name,email', 'community:id,name,slug'])
            ->withCount([
                'reactions',
                'reactions as likes_count' => fn ($q) => $q->where('type', 'like'),
                'reactions as loves_count' => fn ($q) => $q->where('type', 'love'),
                'reactions as cares_count' => fn ($q) => $q->where('type', 'care'),
                'reactions as hahas_count' => fn ($q) => $q->where('type', 'haha'),
                'reactions as wows_count' => fn ($q) => $q->where('type', 'wow'),
                'reactions as sads_count' => fn ($q) => $q->where('type', 'sad'),
                'reactions as angries_count' => fn ($q) => $q->where('type', 'angry'),
            ]);

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

        $friendCheck = "EXISTS (SELECT 1 FROM friendships WHERE status = 'accepted' AND ((requester_id = {$user->id} AND addressee_id = posts.user_id) OR (addressee_id = {$user->id} AND requester_id = posts.user_id)))";

        $query->addSelect([
            'is_from_friend' => DB::raw("CASE WHEN {$friendCheck} THEN 1 ELSE 0 END"),
        ]);

        app(FeedRankingService::class)->rank($query, $user->id, $sort);

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
                'tags' => ['nullable', 'array'],
                'tags.*' => ['string', 'max:50'],
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
                'tags' => $data['tags'] ?? null,
            ]);

            $post->load(['author:id,name,email', 'community:id,name,slug']);

            broadcast(new PostCreated($post))->toOthers();

            if ($post->community_id) {
            broadcast(new CommunityPostCreated($post))->toOthers();
            }

            AIAutoTagContent::dispatch('post', $post->id);
            app(GamificationService::class)->awardPoints($request->user(), 'post_created');

            AIModerateContent::dispatch('post', $post->id);

            return response()->json($post, 201);
        });
    }

    public function show(Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        return response()->json($post->load(['author:id,name,email', 'community:id,name,slug']));
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);

        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:10000'],
            'media' => ['nullable', 'array'],
            'images' => ['nullable', 'array'],
            'images.*' => ['image', 'max:5120'],
        ]);

        $hasBody = isset($data['body']) && trim((string) $data['body']) !== '';
        $hasInlineMedia = ! empty($data['media']);
        $hasUploadedImages = $request->hasFile('images');

        if (! $hasBody && ! $hasInlineMedia && ! $hasUploadedImages) {
            return response()->json([
                'message' => 'Write something or attach media before updating.',
            ], 422);
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

        $post->update([
            'body' => $hasBody ? trim((string) $data['body']) : '',
            'media' => $media ?: null,
        ]);

        $post->load(['author:id,name,email', 'community:id,name,slug']);

        return response()->json($post);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }
}
