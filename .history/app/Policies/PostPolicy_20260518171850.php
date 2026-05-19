<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        $community = $post->community;

        if (! $community || ! $community->is_private) {
            return true;
        }

        return $community->members()->where('users.id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->id > 0;
    }

    public function react(User $user, Post $post): bool
    {
        return $this->view($user, $post);
    }

    public function comment(User $user, Post $post): bool
    {
        return $this->view($user, $post);
    }
}
