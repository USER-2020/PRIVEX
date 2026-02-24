<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'chat_request_id',
        'user_id',
        'display_name',
        'status',
        'closed_reason',
        'ended_at',
        'photo_path',
        'photo_deleted_at',
    ];

    protected $casts = [
        'ended_at' => 'datetime',
        'photo_deleted_at' => 'datetime',
    ];

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function chatRequest(): BelongsTo
    {
        return $this->belongsTo(ChatRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
