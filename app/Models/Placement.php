<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Placement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'company_id',
        'position',
        'offer_date',
        'joining_date',
        'salary',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'offer_date' => 'date',
            'joining_date' => 'date',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
