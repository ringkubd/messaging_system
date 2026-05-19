<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::query()
            ->published()
            ->with('createdBy:id,name')
            ->latest('is_pinned')
            ->latest('published_at');

        if ($type = $request->get('type')) {
            $query->ofType($type);
        }

        $user = $request->user();
        $audience = match (true) {
            $user->isAdmin() => null,
            $user->role === 'user' && ($user->round || $user->batch) => 'students',
            default => 'all',
        };

        if ($audience) {
            $query->forAudience($audience);
        }

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    public function featured(): JsonResponse
    {
        $announcements = Announcement::query()
            ->published()
            ->pinned()
            ->with('createdBy:id,name')
            ->latest('published_at')
            ->get();

        return response()->json($announcements);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        if (!$announcement->published_at) {
            abort(404);
        }

        return response()->json($announcement->load('createdBy:id,name'));
    }
}
