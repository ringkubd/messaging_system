<?php

namespace App\Models;

use App\Models\ResourceCategory;
use App\Models\ResourceRating;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Resource extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'type',
        'file_url',
        'file_size',
        'file_type',
        'category_id',
        'tags',
        'user_id',
        'download_count',
        'avg_rating',
        'ratings_count',
        'status',
        'ai_category',
        'ai_category_approved',
    ];

    protected $casts = [
        'tags' => 'array',
        'file_size' => 'integer',
        'download_count' => 'integer',
        'avg_rating' => 'float',
        'ratings_count' => 'integer',
        'ai_category_approved' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ResourceCategory::class, 'category_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(ResourceRating::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeInCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('tags', 'like', "%{$term}%");
        });
    }
}
