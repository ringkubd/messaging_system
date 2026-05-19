<?php

namespace App\Models;

use App\Models\User;
use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class LiveStream extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'stream_key',
        'rtmp_url',
        'hls_url',
        'status',
        'scheduled_at',
        'started_at',
        'ended_at',
        'max_viewers',
        'thumbnail_url',
        'event_id',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'max_viewers' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (LiveStream $liveStream) {
            if (!$liveStream->stream_key) {
                $liveStream->stream_key = (string) Str::uuid();
            }
            if (!$liveStream->rtmp_url) {
                $rtmpUrl = config('livestream.rtmp_server') . '/live/' . $liveStream->stream_key;
                $liveStream->rtmp_url = $rtmpUrl;
            }
            if (!$liveStream->hls_url) {
                $hlsUrl = config('livestream.hls_server') . '/' . $liveStream->stream_key . '.m3u8';
                $liveStream->hls_url = $hlsUrl;
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeLive($query)
    {
        return $query->where('status', 'live');
    }

    public function scopeEnded($query)
    {
        return $query->where('status', 'ended');
    }

    public function scopePublished($query)
    {
        return $query->whereIn('status', ['scheduled', 'live']);
    }
}
