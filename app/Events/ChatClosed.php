<?php

namespace App\Events;

use App\Models\Chat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatClosed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Chat $chat)
    {
    }

    public function broadcastOn(): Channel
    {
        $token = $this->chat->public_token ?? (string) $this->chat->id;
        return new Channel('public-chat.'.$token);
    }

    public function broadcastAs(): string
    {
        return 'chat.closed';
    }

    public function broadcastWith(): array
    {
        return [
            'chat_id' => $this->chat->id,
            'status' => $this->chat->status,
        ];
    }
}
