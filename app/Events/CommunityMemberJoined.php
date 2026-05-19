<?php

namespace App\Events;

use App\Models\Community;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommunityMemberJoined implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Community $community,
        public int $userId,
        public string $userName,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('community.' . $this->community->id)];
    }

    public function broadcastAs(): string
    {
        return 'community.member.joined';
    }

    public function broadcastWith(): array
    {
        return [
            'community_id' => $this->community->id,
            'user_id' => $this->userId,
            'user_name' => $this->userName,
        ];
    }
}
