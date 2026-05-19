<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Community;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\GroupMessage;
use App\Models\Message;
use App\Models\Post;
use App\Models\Reaction;
use App\Models\Report;
use App\Models\Scholarship;
use App\Models\User;
use App\Models\Batch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $totalUsers = User::query()->count();
        $newToday = User::query()->whereDate('created_at', today())->count();
        $newWeek = User::query()->where('created_at', '>=', now()->subWeek())->count();
        $newMonth = User::query()->where('created_at', '>=', now()->subMonth())->count();

        $byRole = User::query()->selectRaw('role, count(*) as count')
            ->groupBy('role')->pluck('count', 'role');

        $byBatch = User::query()->selectRaw("CONCAT(COALESCE(round,''),'-',COALESCE(batch,'')) as batch_label, count(*) as count")
            ->whereNotNull('batch')
            ->groupBy('round', 'batch')
            ->orderBy('round')->orderBy('batch')
            ->get()->pluck('count', 'batch_label');

        $activeUsers = User::query()
            ->where(function ($q) {
                $q->whereHas('sentMessages', fn ($q) => $q->where('created_at', '>=', now()->subDays(7)))
                  ->orWhereHas('sentGroupMessages', fn ($q) => $q->where('created_at', '>=', now()->subDays(7)));
            })
            ->count();

        $totalPosts = Post::query()->count();
        $postsToday = Post::query()->whereDate('created_at', today())->count();
        $postsWeek = Post::query()->where('created_at', '>=', now()->subWeek())->count();
        $totalComments = Comment::query()->count();
        $commentsToday = Comment::query()->whereDate('created_at', today())->count();
        $totalReactions = Reaction::query()->count();
        $totalMessages = Message::query()->count() + GroupMessage::query()->count();

        $totalEvents = Event::query()->count();
        $upcomingEvents = Event::query()->where('start_date', '>=', now())->count();
        $totalRegistrations = EventRegistration::query()->count();
        $totalAttended = EventRegistration::query()->whereNotNull('checked_in_at')->count();
        $attendanceRate = $totalRegistrations > 0 ? round(($totalAttended / $totalRegistrations) * 100) : 0;

        $totalScholarships = Scholarship::query()->count();
        $activeBatches = Batch::query()->where('status', 'active')->count();

        $studentsPerBatch = User::query()->selectRaw("CONCAT('R', COALESCE(round,''), ' B', COALESCE(batch,'')) as batch_label, count(*) as count")
            ->whereNotNull('round')->whereNotNull('batch')
            ->groupBy('round', 'batch')
            ->orderBy('round')->orderBy('batch')
            ->get()->pluck('count', 'batch_label');

        $activity = $this->buildActivityData();

        $recentActivity = $this->buildRecentActivity();

        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'new_today' => $newToday,
                'new_week' => $newWeek,
                'new_month' => $newMonth,
                'by_role' => $byRole,
                'by_batch' => $byBatch,
                'active_users' => $activeUsers,
            ],
            'engagement' => [
                'posts' => $totalPosts,
                'posts_today' => $postsToday,
                'posts_week' => $postsWeek,
                'comments' => $totalComments,
                'comments_today' => $commentsToday,
                'reactions' => $totalReactions,
                'messages' => $totalMessages,
            ],
            'events' => [
                'total' => $totalEvents,
                'upcoming' => $upcomingEvents,
                'registrations' => $totalRegistrations,
                'attended' => $totalAttended,
                'attendance_rate' => $attendanceRate,
            ],
            'scholarships' => [
                'total' => $totalScholarships,
                'active_batches' => $activeBatches,
                'students_per_batch' => $studentsPerBatch,
            ],
            'activity' => $activity,
            'recent_activity' => $recentActivity,
        ]);
    }

    public function charts(): JsonResponse
    {
        return response()->json($this->buildActivityData());
    }

    private function buildActivityData(): array
    {
        $activity = [];
        $startDate = now()->subDays(29)->startOfDay();

        for ($i = 0; $i < 30; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dateStr = $date->format('Y-m-d');

            $postsCount = Post::query()->whereDate('created_at', $date)->count();
            $commentsCount = Comment::query()->whereDate('created_at', $date)->count();
            $registrationsCount = EventRegistration::query()->whereDate('created_at', $date)->count();

            $activity[] = [
                'date' => $dateStr,
                'posts' => $postsCount,
                'comments' => $commentsCount,
                'registrations' => $registrationsCount,
            ];
        }

        return $activity;
    }

    private function buildRecentActivity(): array
    {
        $recentUsers = User::query()->latest()->take(5)->get()->map(fn ($u) => [
            'type' => 'user_registered',
            'description' => "{$u->name} joined the platform",
            'user' => ['name' => $u->name, 'avatar' => $u->avatar],
            'created_at' => $u->created_at->toISOString(),
        ]);

        $recentPosts = Post::query()->with('author:id,name,avatar')->latest()->take(5)->get()->map(fn ($p) => [
            'type' => 'post_created',
            'description' => ($p->author?->name ?? 'Someone') . ' created a post',
            'user' => ['name' => $p->author?->name ?? 'Unknown', 'avatar' => $p->author?->avatar],
            'created_at' => $p->created_at->toISOString(),
        ]);

        $recentComments = Comment::query()->with('author:id,name,avatar')->latest()->take(5)->get()->map(fn ($c) => [
            'type' => 'comment_created',
            'description' => ($c->author?->name ?? 'Someone') . ' commented on a post',
            'user' => ['name' => $c->author?->name ?? 'Unknown', 'avatar' => $c->author?->avatar],
            'created_at' => $c->created_at->toISOString(),
        ]);

        $recentRegistrations = EventRegistration::query()->with('user:id,name,avatar', 'event:id,title')->latest()->take(5)->get()->map(fn ($r) => [
            'type' => 'event_registered',
            'description' => ($r->user?->name ?? 'Someone') . ' registered for ' . ($r->event?->title ?? 'an event'),
            'user' => ['name' => $r->user?->name ?? 'Unknown', 'avatar' => $r->user?->avatar],
            'created_at' => $r->created_at->toISOString(),
        ]);

        $merged = collect()
            ->concat($recentUsers)
            ->concat($recentPosts)
            ->concat($recentComments)
            ->concat($recentRegistrations)
            ->sortByDesc('created_at')
            ->take(10)
            ->values()
            ->toArray();

        return $merged;
    }
}
