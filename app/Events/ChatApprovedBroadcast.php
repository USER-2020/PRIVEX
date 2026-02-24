<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatApprovedBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Chat $chat)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('user.'.$this->chat->user_id);
    }

    public function broadcastAs(): string
    {
        return 'chat.approved';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chat->id,
            'ends_at' => $this->chat->ends_at?->toIso8601String(),
        ];
    }
}
