<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable)
    {
        $url = config('app.url') . '/verify-email?id=' . $notifiable->getKey() . '&hash=' . sha1($notifiable->getEmailForVerification());

        return (new MailMessage)
            ->subject('Verify Your Email — IsDB-BISEW Connect')
            ->view('emails.verify-email', [
                'url' => $url,
                'user' => $notifiable,
            ]);
    }
}
