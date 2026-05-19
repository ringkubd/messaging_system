<?php

namespace App\Policies;

use App\Models\ChatGroup;
use App\Models\User;

class ChatGroupPolicy
{
    public function view(User $user, ChatGroup $group): bool
    {
        return $group->members()->where('users.id', $user->id)->exists();
    }

    public function update(User $user, ChatGroup $group): bool
    {
        return $this->view($user, $group);
    }

    public function addMember(User $user, ChatGroup $group): bool
    {
        return $group->members()
            ->where('users.id', $user->id)
            ->wherePivotIn('role', ['owner', 'admin'])
            ->exists();
    }
}
