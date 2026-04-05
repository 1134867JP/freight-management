<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendEmailNotificationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(
        public readonly string $email,
        public readonly string $subject,
        public readonly string $body,
        public readonly array $context = [],
    ) {}

    public function backoff(): array
    {
        return [10, 60, 180];
    }

    public function handle(): void
    {
        Mail::html($this->body, function ($message) {
            $message->to($this->email)->subject($this->subject);
        });
    }

    public function failed(Throwable $exception): void
    {
        Log::error('Falha ao enviar e-mail de notificação.', [
            ...$this->context,
            'email' => $this->email,
            'error' => $exception->getMessage(),
        ]);
    }
}
