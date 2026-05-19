<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'chat_message_in_app',
        'group_message_in_app',
        'friend_request_in_app',
        'post_interaction_in_app',
        'chat_message_email',
        'group_message_email',
        'friend_request_email',
        'post_interaction_email',
    ];

    protected $casts = [
        'chat_message_in_app' => 'boolean',
        'group_message_in_app' => 'boolean',
        'friend_request_in_app' => 'boolean',
        'post_interaction_in_app' => 'boolean',
        'chat_message_email' => 'boolean',
        'group_message_email' => 'boolean',
        'friend_request_email' => 'boolean',
        'post_interaction_email' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
