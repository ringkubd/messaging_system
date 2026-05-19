<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupTypingUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $groupId,
        public int $userId,
        public string $userName,
        public bool $isTyping
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('group.' . $this->groupId)];
    }

    public function broadcastAs(): string
    {
        return 'group.typing.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'group_id' => $this->groupId,
            'user_id' => $this->userId,
            'user_name' => $this->userName,
            'is_typing' => $this->isTyping,
        ];
    }
}
