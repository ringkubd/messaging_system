<?php

namespace App\Http\Controllers;

use App\Events\CommunityMemberJoined;
use App\Models\Friendship;
use App\Models\Community;
use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Notifications\InAppActivityNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class CommunityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $communities = Community::query()
            ->withCount('members')
            ->withExists(['members as is_member' => function ($query) use ($user) {
                $query->where('users.id', $user->id);
            }])
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->input('tag'), function ($query, $tag) {
                $query->whereJsonContains('tags', $tag);
            })
            ->latest('id')
            ->paginate(20);

        return response()->json($communities);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Community::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_private' => ['nullable', 'boolean'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:30'],
        ]);

        $community = DB::transaction(function () use ($request, $data) {
            $baseSlug = Str::slug($data['name']);
            $slug = $baseSlug;
            $counter = 1;

            while (Community::query()->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            $community = Community::create([
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'owner_id' => $request->user()->id,
                'is_private' => $data['is_private'] ?? false,
                'tags' => $data['tags'] ?? null,
            ]);

            $community->members()->attach([
                $request->user()->id => ['role' => 'owner', 'joined_at' => now()],
            ]);

            return $community;
        });

        return response()->json($community->load('owner:id,name,email'), 201);
    }

    public function show(Community $community): JsonResponse
    {
        $this->authorize('view', $community);

        return response()->json($community->load(['owner:id,name,email', 'members:id,name,email']));
    }

    public function join(Request $request, Community $community): JsonResponse
    {
        $this->authorize('join', $community);

        $user = $request->user();

        $community->members()->syncWithoutDetaching([
            $user->id => ['role' => 'member', 'joined_at' => now()],
        ]);

        app(GamificationService::class)->awardPoints($user, 'group_joined');

        broadcast(new CommunityMemberJoined($community, $user->id, $user->name))->toOthers();

        $owner = $community->owner;
        if ($owner && $owner->id !== $user->id) {
            $owner->notify(new InAppActivityNotification(
                type: 'community_join',
                actorName: $user->name,
                actionUrl: '/communities/' . $community->id,
                payload: [
                    'actor_id' => $user->id,
                    'community_id' => $community->id,
                    'community_name' => $community->name,
                    'body_preview' => "{$user->name} joined {$community->name}",
                ],
            ));
        }

        return response()->json(['status' => 'ok']);
    }

    public function leave(Request $request, Community $community): JsonResponse
    {
        $this->authorize('leave', $community);

        $community->members()->detach($request->user()->id);

        return response()->json(['status' => 'ok']);
    }

    public function invite(Request $request, Community $community): JsonResponse
    {
        $this->authorize('manage', $community);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $invitee = User::query()->findOrFail((int) $data['user_id']);
        $inviter = $request->user();

        if ($invitee->id === $inviter->id) {
            return response()->json([
                'message' => 'You are already a member of your own community.',
            ], 422);
        }

        if ($inviter->hasBlockRelationWith($invitee->id)) {
            return response()->json([
                'message' => 'Invite is not allowed because one user blocked the other.',
            ], 422);
        }

        $areFriends = Friendship::query()
            ->where('status', Friendship::STATUS_ACCEPTED)
            ->where(function ($query) use ($inviter, $invitee) {
                $query->where('requester_id', $inviter->id)
                    ->where('addressee_id', $invitee->id);
            })
            ->orWhere(function ($query) use ($inviter, $invitee) {
                $query->where('requester_id', $invitee->id)
                    ->where('addressee_id', $inviter->id)
                    ->where('status', Friendship::STATUS_ACCEPTED);
            })
            ->exists();

        if (! $areFriends) {
            return response()->json([
                'message' => 'You can only invite accepted friends.',
            ], 422);
        }

        $community->members()->syncWithoutDetaching([
            $invitee->id => ['role' => 'member', 'joined_at' => now()],
        ]);

        return response()->json([
            'status' => 'ok',
            'community_id' => $community->id,
            'user_id' => $invitee->id,
        ]);
    }
}
