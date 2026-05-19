<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            [
                'name' => 'First Post',
                'slug' => 'first-post',
                'description' => 'Make your first post on the platform',
                'icon' => '📝',
                'category' => 'social',
                'criteria' => ['type' => 'post_count', 'value' => 1],
                'points' => 10,
                'level' => 1,
            ],
            [
                'name' => 'Social Butterfly',
                'slug' => 'social-butterfly',
                'description' => 'Make 5 posts on the platform',
                'icon' => '🦋',
                'category' => 'social',
                'criteria' => ['type' => 'post_count', 'value' => 5],
                'points' => 20,
                'level' => 1,
            ],
            [
                'name' => 'Commentator',
                'slug' => 'commentator',
                'description' => 'Make 10 comments on posts',
                'icon' => '💬',
                'category' => 'social',
                'criteria' => ['type' => 'comment_count', 'value' => 10],
                'points' => 15,
                'level' => 1,
            ],
            [
                'name' => 'Popular',
                'slug' => 'popular',
                'description' => 'Receive 50 total reactions on your content',
                'icon' => '⭐',
                'category' => 'social',
                'criteria' => ['type' => 'reactions_received', 'value' => 50],
                'points' => 30,
                'level' => 2,
            ],
            [
                'name' => 'Networker',
                'slug' => 'networker',
                'description' => 'Join 3 communities',
                'icon' => '🤝',
                'category' => 'community',
                'criteria' => ['type' => 'group_count', 'value' => 3],
                'points' => 15,
                'level' => 1,
            ],
            [
                'name' => 'Event Goer',
                'slug' => 'event-goer',
                'description' => 'Attend 5 events',
                'icon' => '📅',
                'category' => 'community',
                'criteria' => ['type' => 'event_count', 'value' => 5],
                'points' => 40,
                'level' => 2,
            ],
            [
                'name' => 'Job Seeker',
                'slug' => 'job-seeker',
                'description' => 'Apply to 3 jobs',
                'icon' => '💼',
                'category' => 'career',
                'criteria' => ['type' => 'job_application_count', 'value' => 3],
                'points' => 20,
                'level' => 1,
            ],
            [
                'name' => 'Scholar',
                'slug' => 'scholar',
                'description' => 'Complete your profile 100%',
                'icon' => '🎓',
                'category' => 'learning',
                'criteria' => ['type' => 'profile_complete', 'value' => 100],
                'points' => 50,
                'level' => 3,
            ],
            [
                'name' => 'Helping Hand',
                'slug' => 'helping-hand',
                'description' => 'Get 10 likes on your comments',
                'icon' => '✋',
                'category' => 'community',
                'criteria' => ['type' => 'comment_likes', 'value' => 10],
                'points' => 25,
                'level' => 2,
            ],
            [
                'name' => 'Veteran',
                'slug' => 'veteran',
                'description' => 'Be a member for 1 year',
                'icon' => '🏆',
                'category' => 'community',
                'criteria' => ['type' => 'member_days', 'value' => 365],
                'points' => 100,
                'level' => 3,
            ],
        ];

        foreach ($badges as $badge) {
            Badge::create($badge);
        }
    }
}
