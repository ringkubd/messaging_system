<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Post $post) {}

    public function broadcastOn(): array
    {
        return [new Channel('feed')];
    }

    public function broadcastAs(): string
    {
        return 'post.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->post->id,
            'user_id' => $this->post->user_id,
            'body' => $this->post->body,
            'media' => $this->post->media,
            'community_id' => $this->post->community_id,
            'created_at' => optional($this->post->created_at)->toISOString(),
            'author' => $this->post->author ? [
                'id' => $this->post->author->id,
                'name' => $this->post->author->name,
                'email' => $this->post->author->email,
            ] : null,
        ];
    }
}
