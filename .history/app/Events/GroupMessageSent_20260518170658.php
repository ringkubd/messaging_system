<?php

namespace App\Events;

use App\Models\GroupMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public GroupMessage $message)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('group.' . $this->message->chat_group_id)];
    }

    public function broadcastAs(): string
    {
        return 'group.message.sent';
    }

    public function broadcastWith(): array
    {
        $message = $this->message->load('sender:id,name');

        return [
            'id' => $message->id,
            'chat_group_id' => $message->chat_group_id,
            'sender' => $message->sender,
            'body' => $message->body,
            'message_type' => $message->message_type,
            'metadata' => $message->metadata,
            'created_at' => optional($message->created_at)->toISOString(),
        ];
    }
}
