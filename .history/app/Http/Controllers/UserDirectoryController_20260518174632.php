<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $userId = $request->user()->id;

        $blockedIds = UserBlock::query()
            ->where('blocker_id', $userId)
            ->pluck('blocked_id')
            ->merge(
                UserBlock::query()
                    ->where('blocked_id', $userId)
                    ->pluck('blocker_id')
            )
            ->unique()
            ->values();

        $users = User::query()
            ->select(['id', 'name', 'email', 'round', 'batch', 'course'])
            ->where('id', '!=', $userId)
            ->whereNotIn('id', $blockedIds)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('round', 'like', '%' . $search . '%')
                        ->orWhere('batch', 'like', '%' . $search . '%')
                        ->orWhere('course', 'like', '%' . $search . '%');
                });
            })
            ->orderBy('name')
            ->paginate(20);

        return response()->json($users);
    }
}
