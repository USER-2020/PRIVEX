<?php

namespace App\Notifications;

use App\Models\Chat;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ChatApproved extends Notification
{
    use Queueable;

    public function __construct(private readonly Chat $chat)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Chat aprobado')
            ->greeting('Hola '.$notifiable->name)
            ->line('Tu solicitud fue aprobada. El chat esta activo por 24 horas.')
            ->action('Entrar al chat', url('/chat'))
            ->line('Fin del chat: '.$this->chat->ends_at?->toDateTimeString());
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'chat_id' => $this->chat->id,
            'ends_at' => $this->chat->ends_at?->toDateTimeString(),
        ];
    }
}
