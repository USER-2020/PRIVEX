<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChatMessage $message)
    {
    }

    public function broadcastOn(): Channel
    {
        $token = $this->message->chat?->public_token ?? (string) $this->message->chat_id;
        return new Channel('public-chat.'.$token);
    }

    public function broadcastAs(): string
    {
        return 'chat.message';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'chat_id' => $this->message->chat_id,
            'user_id' => $this->message->user_id,
            'body' => $this->message->body,
            'sender_name' => $this->message->sender_name,
            'sender_role' => $this->message->sender_role,
            'attachment_path' => $this->message->attachment_path,
            'attachment_name' => $this->message->attachment_name,
            'attachment_mime' => $this->message->attachment_mime,
            'attachment_size' => $this->message->attachment_size,
            'attachment_type' => $this->message->attachment_type,
            'created_at' => $this->message->created_at?->toIso8601String(),
        ];
    }
}
