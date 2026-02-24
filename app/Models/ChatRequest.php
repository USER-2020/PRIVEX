<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ChatRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'display_name',
        'email',
        'photo_path',
        'photo_deleted_at',
        'public_token',
        'status',
        'approved_at',
        'rejected_at',
        'expires_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'expires_at' => 'datetime',
        'photo_deleted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chat(): HasOne
    {
        return $this->hasOne(Chat::class);
    }
}
