<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
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
use App\Models\UserProfile;
use App\Models\Badge;
use App\Models\EventRegistration;
use App\Models\JobApplication;
use App\Models\MentorshipRequest;
use App\Models\SuccessStory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, \Illuminate\Auth\MustVerifyEmail;

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_MODERATOR = 'moderator';
    public const ROLE_USER = 'user';

    public const ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_MODERATOR,
        self::ROLE_USER,
    ];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'round',
        'batch',
        'course',
        'bio',
        'phone',
        'address',
        'avatar',
        'suspended_until',
        'points',
        'weekly_points',
        'monthly_points',
        'last_points_reset_at',
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
        'suspended_until' => 'datetime',
        'points' => 'integer',
        'weekly_points' => 'integer',
        'monthly_points' => 'integer',
        'last_points_reset_at' => 'datetime',
    ];

    protected $appends = [
        'is_admin',
        'posts_count',
        'comments_count',
        'profile',
    ];

    public function getIsAdminAttribute(): bool
    {
        return $this->isAdmin();
    }

    public function getPostsCountAttribute(): int
    {
        return $this->posts()->count();
    }

    public function getCommentsCountAttribute(): int
    {
        return $this->comments()->count();
    }

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

    public function userProfile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function getProfileAttribute(): UserProfile
    {
        return $this->userProfile()->firstOrCreate();
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

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isModerator(): bool
    {
        return $this->role === self::ROLE_MODERATOR;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_MODERATOR], true);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $permissions = [
            self::ROLE_MODERATOR => [
                'admin.access',
                'users.view',
                'users.warn',
                'users.suspend',
                'content.moderate',
                'reports.view',
                'reports.manage',
                'audit.view',
            ],
            self::ROLE_USER => [],
        ];

        return in_array($permission, $permissions[$this->role] ?? [], true);
    }

    public function mentorshipRequestsAsMentor(): HasMany
    {
        return $this->hasMany(MentorshipRequest::class, 'mentor_id');
    }

    public function mentorshipRequestsAsMentee(): HasMany
    {
        return $this->hasMany(MentorshipRequest::class, 'mentee_id');
    }

    public function successStories(): HasMany
    {
        return $this->hasMany(SuccessStory::class);
    }

    public function approvedSuccessStories(): HasMany
    {
        return $this->hasMany(SuccessStory::class, 'approved_by');
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('awarded_at')
            ->withTimestamps();
    }

    public function jobApplications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function eventRegistrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function isSuspended(): bool
    {
        return $this->suspended_until !== null && $this->suspended_until->isFuture();
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\PasswordResetNotification($token));
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new \App\Notifications\VerifyEmailNotification);
    }
}
