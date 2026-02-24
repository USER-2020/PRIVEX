<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatQueueUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $token, public int $position)
    {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('public-approval.'.$this->token);
    }

    public function broadcastAs(): string
    {
        return 'chat.queue';
    }

    public function broadcastWith(): array
    {
        return [
            'position' => $this->position,
        ];
    }
}
