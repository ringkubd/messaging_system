<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserBlockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $blocks = UserBlock::query()
            ->where('blocker_id', $request->user()->id)
            ->with('blocked:id,name,email')
            ->latest('id')
            ->paginate(20);

        return response()->json($blocks);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$request->user()->id])],
            'reason' => ['nullable', 'string', 'max:120'],
        ]);

        $block = UserBlock::query()->updateOrCreate(
            [
                'blocker_id' => $request->user()->id,
                'blocked_id' => (int) $data['user_id'],
            ],
            [
                'reason' => $data['reason'] ?? null,
            ]
        );

        return response()->json($block->load('blocked:id,name,email'), 201);
    }

    public function destroy(Request $request, User $blockedUser): JsonResponse
    {
        UserBlock::query()
            ->where('blocker_id', $request->user()->id)
            ->where('blocked_id', $blockedUser->id)
            ->delete();

        return response()->json(['status' => 'ok']);
    }
}
