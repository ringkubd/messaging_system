<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    protected array $actionPoints = [
        'post_created' => 10,
        'comment_created' => 5,
        'reaction_received' => 2,
        'login_streak' => 3,
        'group_joined' => 15,
        'event_attended' => 20,
        'job_applied' => 10,
    ];

    public function awardPoints(User $user, string $action, ?int $points = null): void
    {
        $points = $points ?? ($this->actionPoints[$action] ?? 0);

        if ($points <= 0) {
            return;
        }

        $user->increment('points', $points);
        $user->increment('weekly_points', $points);
        $user->increment('monthly_points', $points);

        $this->checkAndAwardBadges($user);
    }

    public function checkAndAwardBadges(User $user): void
    {
        $badges = Badge::all();

        foreach ($badges as $badge) {
            if ($user->badges()->where('badge_id', $badge->id)->exists()) {
                continue;
            }

            $criteria = $badge->criteria;
            $type = $criteria['type'] ?? null;
            $value = $criteria['value'] ?? 0;

            if ($this->meetsCriteria($user, $type, $value)) {
                $user->badges()->attach($badge->id, ['awarded_at' => now()]);
            }
        }
    }

    protected function meetsCriteria(User $user, string $type, int $value): bool
    {
        return match ($type) {
            'post_count' => $user->posts()->count() >= $value,
            'comment_count' => $user->comments()->count() >= $value,
            'reactions_received' => $this->getTotalReactionsReceived($user) >= $value,
            'group_count' => $user->communities()->count() >= $value,
            'event_count' => $this->getAttendedEventCount($user) >= $value,
            'job_application_count' => $user->jobApplications()->count() >= $value,
            'profile_complete' => $this->isProfileComplete($user) >= $value,
            'comment_likes' => $this->getCommentLikes($user) >= $value,
            'member_days' => $user->created_at?->diffInDays(now()) >= $value,
            default => false,
        };
    }

    protected function getTotalReactionsReceived(User $user): int
    {
        $postIds = $user->posts()->pluck('id');
        $commentIds = $user->comments()->pluck('id');

        $postReactions = DB::table('reactions')
            ->where('reactable_type', 'App\Models\Post')
            ->whereIn('reactable_id', $postIds)
            ->count();

        $commentReactions = DB::table('reactions')
            ->where('reactable_type', 'App\Models\Comment')
            ->whereIn('reactable_id', $commentIds)
            ->count();

        return $postReactions + $commentReactions;
    }

    protected function getAttendedEventCount(User $user): int
    {
        return $user->eventRegistrations()
            ->where('status', 'attended')
            ->count();
    }

    protected function getCommentLikes(User $user): int
    {
        $commentIds = $user->comments()->pluck('id');

        return DB::table('reactions')
            ->where('reactable_type', 'App\Models\Comment')
            ->whereIn('reactable_id', $commentIds)
            ->where('type', 'like')
            ->count();
    }

    protected function isProfileComplete(User $user): int
    {
        $profile = $user->profile;

        $fields = [
            'name' => !empty($user->name),
            'email' => !empty($user->email),
            'bio' => !empty($user->bio),
            'phone' => !empty($user->phone),
            'address' => !empty($user->address),
            'round' => !empty($user->round),
            'batch' => !empty($user->batch),
            'course' => !empty($user->course),
            'avatar' => !empty($user->avatar),
            'linkedin' => !empty($profile->linkedin_url),
            'github' => !empty($profile->github_url),
            'skills' => !empty($profile->skills),
            'experience' => !empty($profile->experience),
        ];

        $completed = count(array_filter($fields));
        $total = count($fields);

        return (int) round(($completed / $total) * 100);
    }

    public function getLeaderboard(string $period = 'all', int $limit = 20)
    {
        $orderColumn = match ($period) {
            'weekly' => 'weekly_points',
            'monthly' => 'monthly_points',
            default => 'points',
        };

        return User::query()
            ->select(['id', 'name', 'email', 'avatar', 'round', 'batch', 'points', 'weekly_points', 'monthly_points'])
            ->withCount('badges')
            ->orderByDesc($orderColumn)
            ->limit($limit)
            ->get();
    }
}
