<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Job extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'company_id',
        'description',
        'type',
        'location',
        'salary_range',
        'requirements',
        'responsibilities',
        'skills_required',
        'deadline',
        'max_applications',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'skills_required' => 'array',
            'deadline' => 'date',
            'max_applications' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
