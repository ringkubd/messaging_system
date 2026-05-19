<?php

namespace App\Events;

use App\Models\Comment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Comment $comment) {}

    public function broadcastOn(): array
    {
        $channels = [new Channel('feed')];
        if ($this->comment->post && $this->comment->post->community_id) {
            $channels[] = new PrivateChannel('community.' . $this->comment->post->community_id);
        }
        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'comment.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->comment->id,
            'post_id' => $this->comment->post_id,
            'user_id' => $this->comment->user_id,
            'body' => $this->comment->body,
            'media' => $this->comment->media,
            'created_at' => optional($this->comment->created_at)->toISOString(),
            'author' => $this->comment->author ? [
                'id' => $this->comment->author->id,
                'name' => $this->comment->author->name,
            ] : null,
        ];
    }
}
