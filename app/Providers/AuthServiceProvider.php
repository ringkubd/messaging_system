<?php

namespace App\Providers;

use App\Models\ChatGroup;
use App\Models\Comment;
use App\Models\Community;
use App\Models\Conversation;
use App\Models\LiveStream;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Policies\ChatGroupPolicy;
use App\Policies\CommentPolicy;
use App\Policies\CommunityPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\LiveStreamPolicy;
use App\Policies\PostPolicy;
use App\Policies\ReportPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

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
        LiveStream::class => LiveStreamPolicy::class,
        Post::class => PostPolicy::class,
        Comment::class => CommentPolicy::class,
        Report::class => ReportPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        Gate::define('admin.access', fn (User $user) => $user->isAdmin());
        Gate::define('users.view', fn (User $user) => $user->hasPermission('users.view'));
        Gate::define('users.manage', fn (User $user) => $user->hasPermission('users.warn'));
        Gate::define('content.moderate', fn (User $user) => $user->hasPermission('content.moderate'));
        Gate::define('reports.view', fn (User $user) => $user->hasPermission('reports.view'));
        Gate::define('reports.manage', fn (User $user) => $user->hasPermission('reports.manage'));
        Gate::define('audit.view', fn (User $user) => $user->hasPermission('audit.view'));
    }
}
