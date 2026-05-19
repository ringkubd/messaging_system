<?php

namespace App\Http\Controllers;

use App\Models\Badge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BadgeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $badges = Badge::query()
            ->withCount(['users' => function ($query) {
                $query->where('user_id', request()->user()->id);
            }])
            ->get();

        return response()->json($badges);
    }

    public function userBadges(Request $request): JsonResponse
    {
        $badges = $request->user()->badges()
            ->withPivot('awarded_at')
            ->get();

        return response()->json($badges);
    }

    public function userPoints(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'points' => $user->points ?? 0,
            'weekly_points' => $user->weekly_points ?? 0,
            'monthly_points' => $user->monthly_points ?? 0,
            'badges_count' => $user->badges()->count(),
        ]);
    }
}
