<?php

namespace App\Policies;

use App\Models\LiveStream;
use App\Models\User;

class LiveStreamPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, LiveStream $liveStream): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, LiveStream $liveStream): bool
    {
        return $user->id === $liveStream->created_by || $user->isAdmin();
    }

    public function delete(User $user, LiveStream $liveStream): bool
    {
        return $user->id === $liveStream->created_by || $user->isAdmin();
    }

    public function start(User $user, LiveStream $liveStream): bool
    {
        return $user->id === $liveStream->created_by;
    }

    public function end(User $user, LiveStream $liveStream): bool
    {
        return $user->id === $liveStream->created_by || $user->isAdmin();
    }
}
