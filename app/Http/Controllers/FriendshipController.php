<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FriendshipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $friendships = Friendship::query()
            ->where(function ($query) use ($user) {
                $query->where('requester_id', $user->id)
                    ->orWhere('addressee_id', $user->id);
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->with(['requester:id,name,email,round,batch,course', 'addressee:id,name,email,round,batch,course'])
            ->latest('id')
            ->paginate(20);

        return response()->json($friendships);
    }

    public function accepted(Request $request): JsonResponse
    {
        $user = $request->user();

        $friendships = Friendship::query()
            ->where('status', Friendship::STATUS_ACCEPTED)
            ->where(function ($query) use ($user) {
                $query->where('requester_id', $user->id)
                    ->orWhere('addressee_id', $user->id);
            })
            ->with(['requester:id,name,email,round,batch,course', 'addressee:id,name,email,round,batch,course'])
            ->latest('id')
            ->get();

        $friends = $friendships->map(function (Friendship $friendship) use ($user) {
            $other = $friendship->requester_id === $user->id ? $friendship->addressee : $friendship->requester;
            return [
                'friendship_id' => $friendship->id,
                'user' => $other,
            ];
        });

        return response()->json($friends);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$request->user()->id])],
        ]);

        $requesterId = $request->user()->id;
        $addresseeId = (int) $data['user_id'];

        $hasBlock = UserBlock::query()
            ->where(function ($query) use ($requesterId, $addresseeId) {
                $query->where('blocker_id', $requesterId)
                    ->where('blocked_id', $addresseeId);
            })
            ->orWhere(function ($query) use ($requesterId, $addresseeId) {
                $query->where('blocker_id', $addresseeId)
                    ->where('blocked_id', $requesterId);
            })
            ->exists();

        if ($hasBlock) {
            return response()->json([
                'message' => 'Friend request is not allowed because one user blocked the other.',
            ], 422);
        }

        $existing = Friendship::query()
            ->where(function ($query) use ($requesterId, $addresseeId) {
                $query->where('requester_id', $requesterId)
                    ->where('addressee_id', $addresseeId);
            })
            ->orWhere(function ($query) use ($requesterId, $addresseeId) {
                $query->where('requester_id', $addresseeId)
                    ->where('addressee_id', $requesterId);
            })
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'A friendship request already exists between these users.',
                'friendship' => $existing,
            ], 422);
        }

        $friendship = Friendship::create([
            'requester_id' => $requesterId,
            'addressee_id' => $addresseeId,
            'status' => Friendship::STATUS_PENDING,
        ]);

        return response()->json($friendship->load(['requester:id,name,email', 'addressee:id,name,email']), 201);
    }

    public function respond(Request $request, Friendship $friendship): JsonResponse
    {
        abort_unless($friendship->addressee_id === $request->user()->id, 403, 'Only the receiver can respond.');
        abort_unless($friendship->status === Friendship::STATUS_PENDING, 422, 'This request is no longer pending.');

        $data = $request->validate([
            'status' => ['required', 'in:' . Friendship::STATUS_ACCEPTED . ',' . Friendship::STATUS_REJECTED],
        ]);

        $friendship->update([
            'status' => $data['status'],
            'responded_at' => now(),
        ]);

        return response()->json($friendship->fresh()->load(['requester:id,name,email', 'addressee:id,name,email']));
    }

    public function destroy(Request $request, Friendship $friendship): JsonResponse
    {
        abort_unless(
            $friendship->requester_id === $request->user()->id || $friendship->addressee_id === $request->user()->id,
            403,
            'You are not part of this friendship.'
        );

        $friendship->delete();

        return response()->json(['status' => 'ok']);
    }
}
