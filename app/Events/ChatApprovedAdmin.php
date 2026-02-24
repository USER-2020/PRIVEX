<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatApprovedAdmin implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Chat $chat)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('admin.chat-requests');
    }

    public function broadcastAs(): string
    {
        return 'chat.approved';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chat->id,
            'request_id' => $this->chat->chat_request_id,
            'user_name' => $this->chat->user?->name ?? $this->chat->chatRequest?->display_name ?? 'Usuario',
            'ends_at' => $this->chat->ends_at?->toIso8601String(),
            'started_at' => $this->chat->started_at?->toIso8601String(),
        ];
    }
}
