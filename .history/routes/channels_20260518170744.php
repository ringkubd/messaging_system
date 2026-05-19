<?php

use App\Models\ChatGroup;
use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return Conversation::query()
        ->whereKey($conversationId)
        ->whereHas('participants', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })
        ->exists();
});

Broadcast::channel('presence-conversation.{conversationId}', function ($user, $conversationId) {
    $isParticipant = Conversation::query()
        ->whereKey($conversationId)
        ->whereHas('participants', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })
        ->exists();

    if (! $isParticipant) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name];
});

Broadcast::channel('group.{groupId}', function ($user, $groupId) {
    return ChatGroup::query()
        ->whereKey($groupId)
        ->whereHas('members', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })
        ->exists();
});

Broadcast::channel('presence-group.{groupId}', function ($user, $groupId) {
    $isMember = ChatGroup::query()
        ->whereKey($groupId)
        ->whereHas('members', function ($query) use ($user) {
            $query->where('users.id', $user->id);
        })
        ->exists();

    if (! $isMember) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name];
});
