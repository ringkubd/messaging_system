<?php

namespace App\Models;

use App\Models\CallRoom;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id', 'user_id', 'participant_sid', 'status',
        'mic_enabled', 'camera_enabled', 'screen_shared',
        'joined_at', 'left_at',
    ];

    protected $casts = [
        'mic_enabled' => 'boolean',
        'camera_enabled' => 'boolean',
        'screen_shared' => 'boolean',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(CallRoom::class, 'room_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
