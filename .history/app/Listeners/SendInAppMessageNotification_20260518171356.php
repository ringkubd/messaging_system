<?php

namespace App\Listeners;

use App\Events\ConversationMessageSent;
use App\Events\GroupMessageSent;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\InAppActivityNotification;

class SendInAppMessageNotification
{
    public function handle(ConversationMessageSent|GroupMessageSent $event): void
    {
        if ($event instanceof ConversationMessageSent) {
            $this->notifyConversationParticipants($event);
            return;
        }

        $this->notifyGroupMembers($event);
    }

    private function notifyConversationParticipants(ConversationMessageSent $event): void
    {
        $message = $event->message;

        $recipientIds = $message->conversation
            ->participants()
            ->where('users.id', '!=', $message->sender_id)
            ->pluck('users.id');

        $recipients = User::query()->whereIn('id', $recipientIds)->get();

        foreach ($recipients as $recipient) {
            $preference = NotificationPreference::query()->firstOrCreate([
                'user_id' => $recipient->id,
            ], [
                'chat_message_in_app' => true,
                'group_message_in_app' => true,
                'friend_request_in_app' => true,
                'post_interaction_in_app' => true,
            ]);

            if (! $preference->chat_message_in_app) {
                continue;
            }

            $recipient->notify(new InAppActivityNotification([
                'kind' => 'conversation_message',
                'conversation_id' => $message->conversation_id,
                'message_id' => $message->id,
                'sender_id' => $message->sender_id,
                'body_preview' => mb_substr($message->body, 0, 140),
            ]));
        }
    }

    private function notifyGroupMembers(GroupMessageSent $event): void
    {
        $message = $event->message;

        $recipientIds = $message->group
            ->members()
            ->where('users.id', '!=', $message->sender_id)
            ->pluck('users.id');

        $recipients = User::query()->whereIn('id', $recipientIds)->get();

        foreach ($recipients as $recipient) {
            $preference = NotificationPreference::query()->firstOrCreate([
                'user_id' => $recipient->id,
            ], [
                'chat_message_in_app' => true,
                'group_message_in_app' => true,
                'friend_request_in_app' => true,
                'post_interaction_in_app' => true,
            ]);

            if (! $preference->group_message_in_app) {
                continue;
            }

            $recipient->notify(new InAppActivityNotification([
                'kind' => 'group_message',
                'group_id' => $message->chat_group_id,
                'message_id' => $message->id,
                'sender_id' => $message->sender_id,
                'body_preview' => mb_substr($message->body, 0, 140),
            ]));
        }
    }
}
