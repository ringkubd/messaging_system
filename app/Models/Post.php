<?php

namespace App\Models;

use App\Models\Comment;
use App\Models\Community;
use App\Models\Reaction;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'community_id',
        'body',
        'media',
        'tags',
        'moderation_status',
        'moderation_reason',
        'moderated_at',
    ];

    protected $casts = [
        'media' => 'array',
        'tags' => 'array',
        'moderated_at' => 'datetime',
    ];

    public function scopeVisible($query)
    {
        return $query->whereIn('moderation_status', ['approved', 'pending']);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function reactions(): MorphMany
    {
        return $this->morphMany(Reaction::class, 'reactable');
    }
}
