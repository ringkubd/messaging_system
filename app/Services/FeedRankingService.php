<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class FeedRankingService
{
    public function rank(Builder $query, int $userId, string $sort = 'smart'): Builder
    {
        return match ($sort) {
            'popular' => $this->applyPopularSort($query),
            'smart' => $this->applySmartSort($query, $userId),
            default => $this->applyLatestSort($query),
        };
    }

    private function applyLatestSort(Builder $query): Builder
    {
        return $query->latest('id');
    }

    private function applyPopularSort(Builder $query): Builder
    {
        $reactionWeight = config('feed.ranking.weights.reaction', 1);
        $commentWeight = config('feed.ranking.weights.comment', 1);

        return $query->orderByRaw("
            (
                (SELECT COALESCE(COUNT(*), 0) FROM reactions
                 WHERE reactions.reactable_type = 'App\\\\Models\\\\Post'
                 AND reactions.reactable_id = posts.id) * {$reactionWeight}
                +
                (SELECT COALESCE(COUNT(*), 0) FROM comments
                 WHERE comments.post_id = posts.id) * {$commentWeight}
            ) DESC
        ");
    }

    private function applySmartSort(Builder $query, int $userId): Builder
    {
        $reactionWeight = config('feed.ranking.weights.reaction', 2);
        $commentWeight = config('feed.ranking.weights.comment', 3);
        $recency24h = config('feed.ranking.bonuses.recency_24h', 10);
        $recency7d = config('feed.ranking.bonuses.recency_7d', 5);
        $friendBonus = config('feed.ranking.bonuses.friend', 3);
        $communityBonus = config('feed.ranking.bonuses.community', 2);

        $oneDayAgo = Carbon::now()->subDay()->toDateTimeString();
        $sevenDaysAgo = Carbon::now()->subDays(7)->toDateTimeString();

        $friendCheck = "EXISTS (SELECT 1 FROM friendships WHERE status = 'accepted' AND ((requester_id = {$userId} AND addressee_id = posts.user_id) OR (addressee_id = {$userId} AND requester_id = posts.user_id)))";

        $communityCheck = "EXISTS (SELECT 1 FROM community_user WHERE user_id = {$userId} AND community_id = posts.community_id)";

        $scoreExpr = "
            (SELECT COALESCE(COUNT(*), 0) FROM reactions
             WHERE reactions.reactable_type = 'App\\\\Models\\\\Post'
             AND reactions.reactable_id = posts.id) * {$reactionWeight}
            +
            (SELECT COALESCE(COUNT(*), 0) FROM comments
             WHERE comments.post_id = posts.id) * {$commentWeight}
            +
            CASE
                WHEN posts.created_at >= ? THEN {$recency24h}
                WHEN posts.created_at >= ? THEN {$recency7d}
                ELSE 0
            END
            +
            CASE WHEN {$friendCheck} THEN {$friendBonus} ELSE 0 END
            +
            CASE WHEN {$communityCheck} THEN {$communityBonus} ELSE 0 END
        ";

        $query->orderByRaw("{$scoreExpr} DESC, posts.created_at DESC");
        $query->addBinding([$oneDayAgo, $sevenDaysAgo], 'order');

        return $query;
    }
}
