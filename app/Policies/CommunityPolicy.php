<?php

namespace App\Policies;

use App\Models\Community;
use App\Models\User;

class CommunityPolicy
{
    public function view(User $user, Community $community): bool
    {
        if (! $community->is_private) {
            return true;
        }

        return $community->members()->where('users.id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->id > 0;
    }

    public function join(User $user, Community $community): bool
    {
        if (! $community->is_private) {
            return true;
        }

        return $community->owner_id === $user->id;
    }

    public function leave(User $user, Community $community): bool
    {
        // Owner cannot leave; they must transfer ownership or delete
        if ($community->owner_id === $user->id) {
            return false;
        }

        return $community->members()->where('users.id', $user->id)->exists();
    }

    public function manage(User $user, Community $community): bool
    {
        if ($community->owner_id === $user->id) {
            return true;
        }

        return $community->members()
            ->where('users.id', $user->id)
            ->wherePivotIn('role', ['owner', 'admin'])
            ->exists();
    }
}
