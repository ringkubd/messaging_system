<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CallRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_sid', 'name', 'type', 'created_by',
        'status', 'max_participants', 'started_at', 'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'max_participants' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (CallRoom $room) {
            if (!$room->room_sid) {
                $room->room_sid = (string) Str::uuid();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(RoomParticipant::class, 'room_id');
    }

    public function activeParticipants(): HasMany
    {
        return $this->hasMany(RoomParticipant::class, 'room_id')->where('status', 'joined');
    }
}
