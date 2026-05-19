<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $fillable = [
        'gender',
        'date_of_birth',
        'blood_group',
        'linkedin_url',
        'github_url',
        'portfolio_url',
        'experience',
        'certifications',
        'projects',
        'skills',
    ];

    protected $casts = [
        'experience' => 'array',
        'certifications' => 'array',
        'projects' => 'array',
        'skills' => 'array',
        'date_of_birth' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
