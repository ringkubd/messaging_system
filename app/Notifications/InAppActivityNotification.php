<?php

namespace App\Notifications;

use App\Models\NotificationPreference;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InAppActivityNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $type,
        public readonly string $actorName,
        public readonly string $actionUrl,
        private readonly array $payload = [],
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        $preference = $notifiable->notificationPreference;

        if ($preference && $this->userWantsEmail($preference)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->getSubject())
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line($this->getIntro())
            ->action('View Details', $this->actionUrl)
            ->line('Thank you for using IsDB-BISEW Connect!');
    }

    public function toArray(object $notifiable): array
    {
        return array_merge($this->payload, [
            'kind' => $this->type,
            'actor_name' => $this->actorName,
            'url' => $this->actionUrl,
        ]);
    }

    private function userWantsEmail(NotificationPreference $preference): bool
    {
        return match ($this->type) {
            'new_message', 'conversation_message' => $preference->chat_message_email,
            'group_message' => $preference->group_message_email,
            'friend_request', 'friend_accepted' => $preference->friend_request_email,
            'post_like', 'post_comment', 'post_interaction', 'community_join' => $preference->post_interaction_email,
            default => true,
        };
    }

    private function getSubject(): string
    {
        return match ($this->type) {
            'post_like' => $this->actorName . ' liked your post — IsDB-BISEW Connect',
            'post_comment' => $this->actorName . ' commented on your post — IsDB-BISEW Connect',
            'friend_request' => $this->actorName . ' sent you a friend request — IsDB-BISEW Connect',
            'friend_accepted' => $this->actorName . ' accepted your friend request — IsDB-BISEW Connect',
            'new_message', 'conversation_message' => $this->actorName . ' sent you a message — IsDB-BISEW Connect',
            'group_message' => $this->actorName . ' sent a message in a group — IsDB-BISEW Connect',
            'community_join' => $this->actorName . ' joined your community — IsDB-BISEW Connect',
            'group_invite' => $this->actorName . ' invited you to a group — IsDB-BISEW Connect',
            default => 'Notification — IsDB-BISEW Connect',
        };
    }

    private function getIntro(): string
    {
        return match ($this->type) {
            'post_like' => $this->actorName . ' liked your post.',
            'post_comment' => $this->actorName . ' commented on your post.',
            'friend_request' => $this->actorName . ' sent you a friend request.',
            'friend_accepted' => $this->actorName . ' accepted your friend request.',
            'new_message', 'conversation_message' => 'You have a new message from ' . $this->actorName . '.',
            'group_message' => $this->actorName . ' sent a message in a group you are in.',
            'community_join' => $this->actorName . ' joined your community.',
            'group_invite' => $this->actorName . ' invited you to join a group.',
            default => 'You have a new notification on IsDB-BISEW Connect.',
        };
    }
}
