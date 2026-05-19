<?php

namespace App\Events;

use App\Models\Reaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReactionCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Reaction $reaction) {}

    public function broadcastOn(): array
    {
        $channels = [new Channel('feed')];
        $reactable = $this->reaction->reactable;
        if ($reactable && $this->reaction->reactable_type === 'App\\Models\\Post' && $reactable->community_id) {
            $channels[] = new PrivateChannel('community.' . $reactable->community_id);
        }
        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'reaction.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->reaction->id,
            'reactable_id' => $this->reaction->reactable_id,
            'reactable_type' => $this->reaction->reactable_type,
            'user_id' => $this->reaction->user_id,
            'type' => $this->reaction->type,
            'created_at' => optional($this->reaction->created_at)->toISOString(),
        ];
    }
}
