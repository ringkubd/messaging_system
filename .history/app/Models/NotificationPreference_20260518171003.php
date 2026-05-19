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
    ];

    protected $casts = [
        'chat_message_in_app' => 'boolean',
        'group_message_in_app' => 'boolean',
        'friend_request_in_app' => 'boolean',
        'post_interaction_in_app' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
