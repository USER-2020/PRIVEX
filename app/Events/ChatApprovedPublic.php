<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatApprovedPublic implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $token, public string $endsAt)
    {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('public-approval.'.$this->token);
    }

    public function broadcastAs(): string
    {
        return 'chat.approved';
    }

    public function broadcastWith(): array
    {
        return [
            'token' => $this->token,
            'ends_at' => $this->endsAt,
        ];
    }
}
