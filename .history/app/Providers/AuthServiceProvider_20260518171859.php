<?php

namespace App\Providers;

use App\Models\ChatGroup;
use App\Models\Comment;
use App\Models\Community;
use App\Models\Conversation;
use App\Models\Post;
use App\Models\Report;
use App\Policies\ChatGroupPolicy;
use App\Policies\CommentPolicy;
use App\Policies\CommunityPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\PostPolicy;
use App\Policies\ReportPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Conversation::class => ConversationPolicy::class,
        ChatGroup::class => ChatGroupPolicy::class,
        Community::class => CommunityPolicy::class,
        Post::class => PostPolicy::class,
        Comment::class => CommentPolicy::class,
        Report::class => ReportPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
