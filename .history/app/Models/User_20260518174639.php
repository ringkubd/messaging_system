<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\ChatGroup;
use App\Models\Comment;
use App\Models\Community;
use App\Models\Conversation;
use App\Models\Friendship;
use App\Models\NotificationPreference;
use App\Models\Post;
use App\Models\Reaction;
use App\Models\Report;
use App\Models\UserBlock;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
        'round',
        'batch',
        'course',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_admin' => 'boolean',
    ];

    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_user')
            ->withPivot(['last_read_message_id', 'joined_at', 'left_at', 'muted_until', 'role'])
            ->withTimestamps();
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(ChatGroup::class, 'chat_group_user')
            ->withPivot(['role', 'joined_at', 'muted_until'])
            ->withTimestamps();
    }

    public function sentGroupMessages(): HasMany
    {
        return $this->hasMany(GroupMessage::class, 'sender_id');
    }

    public function sentFriendRequests(): HasMany
    {
        return $this->hasMany(Friendship::class, 'requester_id');
    }

    public function receivedFriendRequests(): HasMany
    {
        return $this->hasMany(Friendship::class, 'addressee_id');
    }

    public function communities(): BelongsToMany
    {
        return $this->belongsToMany(Community::class, 'community_user')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    public function ownedCommunities(): HasMany
    {
        return $this->hasMany(Community::class, 'owner_id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(Reaction::class);
    }

    public function notificationPreference(): HasOne
    {
        return $this->hasOne(NotificationPreference::class);
    }

    public function reportsFiled(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function reportsReviewed(): HasMany
    {
        return $this->hasMany(Report::class, 'reviewed_by');
    }

    public function blocksInitiated(): HasMany
    {
        return $this->hasMany(UserBlock::class, 'blocker_id');
    }

    public function blocksReceived(): HasMany
    {
        return $this->hasMany(UserBlock::class, 'blocked_id');
    }

    public function hasBlockRelationWith(int $otherUserId): bool
    {
        return UserBlock::query()
            ->where(function ($query) use ($otherUserId) {
                $query->where('blocker_id', $this->id)->where('blocked_id', $otherUserId);
            })
            ->orWhere(function ($query) use ($otherUserId) {
                $query->where('blocker_id', $otherUserId)->where('blocked_id', $this->id);
            })
            ->exists();
    }
}
