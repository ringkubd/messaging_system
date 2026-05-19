<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversation.' . $this->message->conversation_id)];
    }

    public function broadcastAs(): string
    {
        return 'conversation.message.sent';
    }

    public function broadcastWith(): array
    {
        $message = $this->message->load('sender:id,name');

        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender' => $message->sender,
            'body' => $message->body,
            'message_type' => $message->message_type,
            'metadata' => $message->metadata,
            'created_at' => optional($message->created_at)->toISOString(),
        ];
    }
}
