<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function __construct(
        protected GamificationService $gamificationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $period = in_array($request->input('period'), ['weekly', 'monthly', 'all'], true)
            ? $request->input('period')
            : 'all';

        $limit = min((int) $request->input('limit', 20), 100);

        $leaderboard = $this->gamificationService->getLeaderboard($period, $limit);

        $currentUser = $request->user();
        $currentUserRank = null;

        if ($currentUser) {
            $orderColumn = match ($period) {
                'weekly' => 'weekly_points',
                'monthly' => 'monthly_points',
                default => 'points',
            };

            $rank = User::query()
                ->where($orderColumn, '>', $currentUser->{$orderColumn} ?? 0)
                ->count() + 1;

            $currentUserRank = $rank;
        }

        return response()->json([
            'data' => $leaderboard,
            'current_user_rank' => $currentUserRank,
        ]);
    }
}
