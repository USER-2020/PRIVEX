<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $password
    ) {
    }

    public function build(): self
    {
        return $this->subject('Bienvenido a Privex')
            ->view('emails.welcome-user')
            ->with([
                'user' => $this->user,
                'password' => $this->password,
                'loginUrl' => url('/login'),
            ]);
    }
}
