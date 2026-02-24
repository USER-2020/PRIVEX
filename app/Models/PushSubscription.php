<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PushSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'public_token',
        'channel',
        'platform',
        'endpoint',
        'subscription',
    ];

    protected $casts = [
        'subscription' => 'array',
    ];
}
