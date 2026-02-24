<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ChatEventNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $subject,
        private readonly string $message,
        private readonly string $actionText,
        private readonly string $actionUrl
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name = null;
        if (method_exists($notifiable, 'getAttribute')) {
            $name = $notifiable->getAttribute('name');
        } elseif (property_exists($notifiable, 'name')) {
            $name = $notifiable->name;
        }
        $greeting = $name ? 'Hola '.$name : 'Hola';

        return (new MailMessage())
            ->subject($this->subject)
            ->greeting($greeting)
            ->line($this->message)
            ->action($this->actionText, $this->actionUrl);
    }
}
