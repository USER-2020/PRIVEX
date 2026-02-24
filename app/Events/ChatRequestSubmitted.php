<?php

namespace App\Events;

use App\Models\ChatRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatRequestSubmitted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChatRequest $chatRequest)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('admin.chat-requests');
    }

    public function broadcastAs(): string
    {
        return 'chat.request';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->chatRequest->id,
            'display_name' => $this->chatRequest->display_name,
            'photo_path' => $this->chatRequest->photo_path,
            'created_at' => $this->chatRequest->created_at?->toIso8601String(),
        ];
    }
}
