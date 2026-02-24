<?php

use App\Models\Chat;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('chat.{chatId}', function ($user, $chatId) {
    $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

    if ($isAdmin) {
        return Chat::query()
            ->where('id', $chatId)
            ->where('status', 'active')
            ->exists();
    }

    return Chat::query()
        ->where('id', $chatId)
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->exists();
});

Broadcast::channel('admin.chat-requests', function ($user) {
    return method_exists($user, 'hasRole') && $user->hasRole('admin');
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
