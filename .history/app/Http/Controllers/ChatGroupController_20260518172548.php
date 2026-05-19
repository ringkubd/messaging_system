<?php

namespace App\Http\Controllers;

use App\Models\ChatGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ChatGroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groups = $request->user()
            ->groups()
            ->with('owner:id,name,email')
            ->latest('chat_groups.id')
            ->paginate(20);

        return response()->json($groups);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_private' => ['nullable', 'boolean'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['integer', 'exists:users,id', Rule::notIn([$request->user()->id])],
        ]);

        $group = DB::transaction(function () use ($request, $data) {
            $group = ChatGroup::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'owner_id' => $request->user()->id,
                'is_private' => $data['is_private'] ?? false,
            ]);

            $memberIds = collect($data['member_ids'] ?? [])->unique()->values();

            $group->members()->attach([
                $request->user()->id => ['role' => 'owner', 'joined_at' => now()],
            ]);

            foreach ($memberIds as $memberId) {
                $group->members()->syncWithoutDetaching([
                    $memberId => ['role' => 'member', 'joined_at' => now()],
                ]);
            }

            return $group;
        });

        return response()->json($group->load(['owner:id,name,email', 'members:id,name,email']), 201);
    }

    public function show(Request $request, ChatGroup $group): JsonResponse
    {
        $this->authorize('view', $group);

        return response()->json($group->load(['owner:id,name,email', 'members:id,name,email']));
    }

    public function addMember(Request $request, ChatGroup $group): JsonResponse
    {
        $this->authorize('addMember', $group);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role' => ['nullable', 'string', 'in:member,admin'],
        ]);

        $group->members()->syncWithoutDetaching([
            $data['user_id'] => [
                'role' => $data['role'] ?? 'member',
                'joined_at' => now(),
            ],
        ]);

        return response()->json(['status' => 'ok']);
    }

    public function mute(Request $request, ChatGroup $group): JsonResponse
    {
        $this->authorize('view', $group);

        $data = $request->validate([
            'minutes' => ['nullable', 'integer', 'min:1', 'max:43200'],
        ]);

        $minutes = $data['minutes'] ?? 60;
        $mutedUntil = now()->addMinutes($minutes);

        $group->members()->updateExistingPivot($request->user()->id, [
            'muted_until' => $mutedUntil,
        ]);

        return response()->json([
            'status' => 'ok',
            'group_id' => $group->id,
            'muted_until' => $mutedUntil->toISOString(),
        ]);
    }
}
