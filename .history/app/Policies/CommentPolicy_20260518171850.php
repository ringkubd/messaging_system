<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;

class CommentPolicy
{
    public function view(User $user, Comment $comment): bool
    {
        return $comment->post ? $comment->post->can('view', $comment->post) : false;
    }

    public function react(User $user, Comment $comment): bool
    {
        $post = $comment->post;

        if (! $post) {
            return false;
        }

        $community = $post->community;

        if (! $community || ! $community->is_private) {
            return true;
        }

        return $community->members()->where('users.id', $user->id)->exists();
    }
}
