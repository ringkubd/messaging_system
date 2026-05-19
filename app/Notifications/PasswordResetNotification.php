<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class PasswordResetNotification extends ResetPassword
{
    public function toMail(object $notifiable): MailMessage
    {
        $url = url(config('app.url') . '/reset-password?token=' . $this->token . '&email=' . $notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('Reset Your Password — IsDB-BISEW Connect')
            ->view('emails.password-reset', [
                'url' => $url,
                'user' => $notifiable,
                'expire' => config('auth.passwords.' . config('auth.defaults.passwords') . '.expire', 60),
            ]);
    }
}
