<?php

namespace App\Services\WhatsApp;

use App\Actions\Timeslot\CreateTimeslot;
use App\Models\Timeslot;
use App\Models\User;
use App\Models\WhatsAppCommand;
use App\Models\WhatsAppInstance;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TimeslotWhatsAppBot
{
    public function __construct(
        private readonly TimeslotCommandParser $parser,
        private readonly CreateTimeslot $createTimeslot,
        private readonly YmsConversationalManager $conversationalManager,
    ) {}

    public function handle(WhatsAppInstance $instance, array $message): ?array
    {
        $instance->loadMissing('company');

        if (! $instance->is_active || ! $instance->company?->is_active) {
            return null;
        }

        $user = $this->resolveAuthorizedUser($instance, $message['sender_phone']);

        // Números não autorizados são silenciosamente ignorados para não transformar
        // o número operacional da empresa em um bot público.
        if (! $user) {
            return null;
        }

        $canCreateTimeslots = $user->hasPermission(User::PERMISSION_CREATE_TIMESLOTS_VIA_WHATSAPP);
        $canUseAssistant = $this->conversationalManager->isEnabled()
            && $user->hasPermission(User::PERMISSION_USE_YMS_ASSISTANT);

        if (! $canCreateTimeslots && ! $canUseAssistant) {
            return null;
        }

        $text = trim((string) $message['text']);
        $normalized = $this->normalizeCommand($text);

        if (preg_match('/^confirmar\b/u', $normalized) === 1) {
            return $canCreateTimeslots ? $this->confirm($instance, $user, $message) : null;
        }

        if (preg_match('/^cancelar\b/u', $normalized) === 1) {
            return $canCreateTimeslots ? $this->cancel($instance, $user, $message) : null;
        }

        if (in_array($normalized, ['ajuda', 'help', 'menu'], true)) {
            return $this->help($instance, $user, $message);
        }

        if ($this->looksLikeTimeslotCreation($normalized)) {
            if (! $canCreateTimeslots) {
                return null;
            }

            if (mb_strlen($text) > 2000) {
                return $this->reject(
                    $instance,
                    $user,
                    $message,
                    'create_timeslot',
                    'A mensagem é muito longa. '.$this->parser->example(),
                );
            }

            return $this->startCreation($instance, $user, $message);
        }

        if ($canUseAssistant) {
            return $this->conversationalManager->handle($instance, $user, $message);
        }

        if (str_contains($normalized, 'cota') && $canCreateTimeslots) {
            return $this->reject(
                $instance,
                $user,
                $message,
                'create_timeslot',
                'Não consegui identificar uma criação de cota. '.$this->parser->example(),
            );
        }

        return null;
    }

    private function startCreation(WhatsAppInstance $instance, User $user, array $message): ?array
    {
        $result = $this->parser->parse($message['text']);

        if (! $result['valid']) {
            return $this->reject(
                $instance,
                $user,
                $message,
                'create_timeslot',
                $result['error'],
            );
        }

        $clientResolution = $this->resolveClient($instance->company_id, $result['data']['client_name']);

        if ($clientResolution['client'] === null) {
            return $this->reject(
                $instance,
                $user,
                $message,
                'create_timeslot',
                $clientResolution['error'],
                $result['data'],
            );
        }

        /** @var User $client */
        $client = $clientResolution['client'];
        $parsed = [
            ...$result['data'],
            'client_id' => $client->id,
            'client_name' => $client->name,
        ];

        $duplicate = $this->findDuplicateTimeslot($instance->company_id, $client->id, $parsed);

        if ($duplicate) {
            return $this->reject(
                $instance,
                $user,
                $message,
                'create_timeslot',
                "Já existe uma cota equivalente (#{$duplicate->id}) para esse cliente e horário.",
                $parsed,
                $client,
            );
        }

        return DB::transaction(function () use ($instance, $user, $client, $message, $parsed): ?array {
            if ($this->messageWasHandled($instance->id, $message['external_message_id'])) {
                return null;
            }

            WhatsAppCommand::query()
                ->where('whatsapp_instance_id', $instance->id)
                ->where('sender_phone', $message['sender_phone'])
                ->where('status', WhatsAppCommand::STATUS_PENDING_CONFIRMATION)
                ->lockForUpdate()
                ->update([
                    'status' => WhatsAppCommand::STATUS_CANCELLED,
                    'error_message' => 'Substituído por um novo comando antes da confirmação.',
                ]);

            $ttl = (int) config('services.evolution.bot.confirmation_ttl_minutes', 10);
            $command = WhatsAppCommand::create([
                'company_id' => $instance->company_id,
                'whatsapp_instance_id' => $instance->id,
                'user_id' => $user->id,
                'client_id' => $client->id,
                'external_message_id' => $message['external_message_id'],
                'sender_phone' => $message['sender_phone'],
                'message' => $message['text'],
                'intent' => 'create_timeslot',
                'parsed_payload' => $parsed,
                'status' => WhatsAppCommand::STATUS_PENDING_CONFIRMATION,
                'expires_at' => now()->addMinutes($ttl),
            ]);

            $replyText = implode("\n", [
                'Entendi o pedido:',
                "• {$parsed['capacity']} cotas",
                "• Cliente: {$client->name}",
                '• Data: '.$this->dateLabel($parsed['start_time']),
                '• Horário: '.$this->timeRangeLabel($parsed['start_time'], $parsed['end_time']),
                '• Operação: '.$this->operationLabel($parsed['operation_type']),
                '',
                "Responda CONFIRMAR em até {$ttl} minutos ou CANCELAR.",
                'Protocolo: '.$command->protocol(),
            ]);

            $command->update(['response_message' => $replyText]);

            return $this->reply($command, $replyText);
        });
    }

    private function confirm(WhatsAppInstance $instance, User $user, array $message): ?array
    {
        return DB::transaction(function () use ($instance, $user, $message): ?array {
            if ($this->messageWasHandled($instance->id, $message['external_message_id'])) {
                return null;
            }

            $command = WhatsAppCommand::query()
                ->where('whatsapp_instance_id', $instance->id)
                ->where('sender_phone', $message['sender_phone'])
                ->where('user_id', $user->id)
                ->where('status', WhatsAppCommand::STATUS_PENDING_CONFIRMATION)
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $command) {
                return $this->recordStandaloneReply(
                    $instance,
                    $user,
                    $message,
                    'confirm_timeslot',
                    WhatsAppCommand::STATUS_REJECTED,
                    'Não há nenhum pedido aguardando confirmação. '.$this->parser->example(),
                );
            }

            if (! $command->expires_at || $command->expires_at->lessThanOrEqualTo(now())) {
                $replyText = 'Esse pedido expirou. Envie a solicitação novamente. '.$this->parser->example();
                $command->update([
                    'confirmation_message_id' => $message['external_message_id'],
                    'status' => WhatsAppCommand::STATUS_EXPIRED,
                    'response_message' => $replyText,
                    'error_message' => 'Confirmação recebida após o prazo.',
                ]);

                return $this->reply($command, $replyText);
            }

            $parsed = $command->parsed_payload ?? [];
            $client = $command->client;

            if (
                ! isset($parsed['start_time'])
                || CarbonImmutable::parse($parsed['start_time'])->lessThanOrEqualTo(now())
            ) {
                return $this->failPendingCommand(
                    $command,
                    $message['external_message_id'],
                    'O horário solicitado já passou. Nenhuma cota foi criada.',
                );
            }

            if (! $client || $client->role !== User::ROLE_CLIENT || $client->company_id !== $instance->company_id) {
                return $this->failPendingCommand(
                    $command,
                    $message['external_message_id'],
                    'O cliente não está mais disponível. Nenhuma cota foi criada.',
                );
            }

            $duplicate = $this->findDuplicateTimeslot($instance->company_id, $client->id, $parsed);

            if ($duplicate) {
                return $this->failPendingCommand(
                    $command,
                    $message['external_message_id'],
                    "Já existe uma cota equivalente (#{$duplicate->id}). Nenhuma duplicata foi criada.",
                );
            }

            $guard = Auth::guard();
            $previousUser = $guard->user();
            $guard->setUser($user);

            try {
                $timeslot = $this->createTimeslot->executeViaWhatsApp($user, [
                    'start_time' => $parsed['start_time'],
                    'end_time' => $parsed['end_time'],
                    'operation_type' => $parsed['operation_type'],
                    'capacity' => $parsed['capacity'],
                    'description' => 'Criada pelo bot do WhatsApp · '.$command->protocol(),
                    'modelo' => Timeslot::MODELO_ABERTA,
                ], [$client->id]);
            } catch (AuthorizationException|ValidationException $exception) {
                return $this->failPendingCommand(
                    $command,
                    $message['external_message_id'],
                    'Não foi possível criar a cota: '.$exception->getMessage(),
                );
            } finally {
                if ($previousUser) {
                    $guard->setUser($previousUser);
                } else {
                    $guard->forgetUser();
                }
            }

            $replyText = implode("\n", [
                'Cota criada com sucesso.',
                "Cliente: {$client->name}",
                "Capacidade: {$parsed['capacity']}",
                'Horário: '.$this->dateLabel($parsed['start_time']).' · '.$this->timeRangeLabel($parsed['start_time'], $parsed['end_time']),
                "Cota #{$timeslot->id}",
                'Protocolo: '.$command->protocol(),
            ]);

            $command->update([
                'timeslot_id' => $timeslot->id,
                'confirmation_message_id' => $message['external_message_id'],
                'status' => WhatsAppCommand::STATUS_EXECUTED,
                'confirmed_at' => now(),
                'executed_at' => now(),
                'response_message' => $replyText,
                'error_message' => null,
            ]);

            return $this->reply($command, $replyText);
        });
    }

    private function cancel(WhatsAppInstance $instance, User $user, array $message): ?array
    {
        return DB::transaction(function () use ($instance, $user, $message): ?array {
            if ($this->messageWasHandled($instance->id, $message['external_message_id'])) {
                return null;
            }

            $command = WhatsAppCommand::query()
                ->where('whatsapp_instance_id', $instance->id)
                ->where('sender_phone', $message['sender_phone'])
                ->where('user_id', $user->id)
                ->where('status', WhatsAppCommand::STATUS_PENDING_CONFIRMATION)
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $command) {
                return $this->recordStandaloneReply(
                    $instance,
                    $user,
                    $message,
                    'cancel_timeslot',
                    WhatsAppCommand::STATUS_REJECTED,
                    'Não há nenhum pedido aguardando confirmação.',
                );
            }

            $replyText = 'Pedido cancelado. Nenhuma cota foi criada. Protocolo: '.$command->protocol();
            $command->update([
                'confirmation_message_id' => $message['external_message_id'],
                'status' => WhatsAppCommand::STATUS_CANCELLED,
                'response_message' => $replyText,
            ]);

            return $this->reply($command, $replyText);
        });
    }

    private function help(WhatsAppInstance $instance, User $user, array $message): ?array
    {
        return DB::transaction(function () use ($instance, $user, $message): ?array {
            if ($this->messageWasHandled($instance->id, $message['external_message_id'])) {
                return null;
            }

            $lines = [];

            if ($user->hasPermission(User::PERMISSION_CREATE_TIMESLOTS_VIA_WHATSAPP)) {
                $lines = [
                    'Para criar uma cota, envie:',
                    '10 cotas | Cliente X | amanhã | 10:00',
                    'Depois, responda CONFIRMAR ou CANCELAR.',
                ];
            }

            if (
                $this->conversationalManager->isEnabled()
                && $user->hasPermission(User::PERMISSION_USE_YMS_ASSISTANT)
            ) {
                $lines = [
                    ...$lines,
                    ...($lines === [] ? [] : ['']),
                    'Consultas disponíveis:',
                    '• Quantas cotas ainda temos hoje?',
                    '• Quantos veículos estão no pátio?',
                    '• Quais veículos estão atrasados?',
                    '• Quais docas estão livres?',
                    '• Faça um resumo da operação de hoje.',
                ];
            }

            return $this->recordStandaloneReply(
                $instance,
                $user,
                $message,
                'help',
                WhatsAppCommand::STATUS_EXECUTED,
                implode("\n", $lines),
            );
        });
    }

    private function reject(
        WhatsAppInstance $instance,
        User $user,
        array $message,
        string $intent,
        string $replyText,
        ?array $parsed = null,
        ?User $client = null,
    ): ?array {
        return DB::transaction(function () use (
            $instance,
            $user,
            $message,
            $intent,
            $replyText,
            $parsed,
            $client,
        ): ?array {
            if ($this->messageWasHandled($instance->id, $message['external_message_id'])) {
                return null;
            }

            $command = WhatsAppCommand::create([
                'company_id' => $instance->company_id,
                'whatsapp_instance_id' => $instance->id,
                'user_id' => $user->id,
                'client_id' => $client?->id,
                'external_message_id' => $message['external_message_id'],
                'sender_phone' => $message['sender_phone'],
                'message' => mb_substr($message['text'], 0, 2000),
                'intent' => $intent,
                'parsed_payload' => $parsed,
                'status' => WhatsAppCommand::STATUS_REJECTED,
                'response_message' => $replyText,
                'error_message' => $replyText,
            ]);

            return $this->reply($command, $replyText);
        });
    }

    private function recordStandaloneReply(
        WhatsAppInstance $instance,
        User $user,
        array $message,
        string $intent,
        string $status,
        string $replyText,
    ): array {
        $command = WhatsAppCommand::create([
            'company_id' => $instance->company_id,
            'whatsapp_instance_id' => $instance->id,
            'user_id' => $user->id,
            'external_message_id' => $message['external_message_id'],
            'sender_phone' => $message['sender_phone'],
            'message' => mb_substr($message['text'], 0, 2000),
            'intent' => $intent,
            'status' => $status,
            'response_message' => $replyText,
            'executed_at' => $status === WhatsAppCommand::STATUS_EXECUTED ? now() : null,
        ]);

        return $this->reply($command, $replyText);
    }

    private function failPendingCommand(
        WhatsAppCommand $command,
        string $confirmationMessageId,
        string $replyText,
    ): array {
        $command->update([
            'confirmation_message_id' => $confirmationMessageId,
            'status' => WhatsAppCommand::STATUS_FAILED,
            'response_message' => $replyText,
            'error_message' => $replyText,
        ]);

        return $this->reply($command, $replyText);
    }

    private function resolveAuthorizedUser(WhatsAppInstance $instance, string $phone): ?User
    {
        $matches = User::query()
            ->where('company_id', $instance->company_id)
            ->whereIn('role', [User::ROLE_COMPANY_ADMIN, User::ROLE_COMPANY_EMPLOYEE])
            ->whereNotNull('whatsapp_phone')
            ->get()
            ->filter(fn (User $user) => $user->routeWhatsAppPhone() === $phone)
            ->values();

        return $matches->count() === 1 ? $matches->first() : null;
    }

    private function resolveClient(int $companyId, string $name): array
    {
        $clients = User::query()
            ->where('company_id', $companyId)
            ->where('role', User::ROLE_CLIENT)
            ->orderBy('name')
            ->get();

        $needle = $this->normalizeClientName($name);

        if ($needle === '') {
            return [
                'client' => null,
                'error' => 'Informe o nome completo do cliente.',
            ];
        }

        $exact = $clients->filter(
            fn (User $client) => $this->normalizeClientName($client->name) === $needle,
        )->values();

        if ($exact->count() === 1) {
            return ['client' => $exact->first(), 'error' => null];
        }

        if ($exact->count() > 1) {
            return [
                'client' => null,
                'error' => 'Encontrei mais de um cliente com esse nome: '
                    .$exact->take(5)->pluck('name')->implode(', ')
                    .'. Verifique os cadastros duplicados.',
            ];
        }

        $similar = mb_strlen($needle) >= 3
            ? $clients->filter(function (User $client) use ($needle): bool {
                $candidate = $this->normalizeClientName($client->name);

                return str_contains($candidate, $needle) || str_contains($needle, $candidate);
            })->values()
            : collect();

        if ($similar->count() === 1) {
            return ['client' => $similar->first(), 'error' => null];
        }

        if ($similar->count() > 1) {
            return [
                'client' => null,
                'error' => 'Encontrei mais de um cliente: '.$similar->take(5)->pluck('name')->implode(', ').'. Informe o nome completo.',
            ];
        }

        return [
            'client' => null,
            'error' => "Não encontrei o cliente \"{$name}\" nesta empresa.",
        ];
    }

    private function findDuplicateTimeslot(int $companyId, int $clientId, array $parsed): ?Timeslot
    {
        if (! isset($parsed['start_time'], $parsed['end_time'], $parsed['capacity'], $parsed['operation_type'])) {
            return null;
        }

        return Timeslot::query()
            ->where('company_id', $companyId)
            ->where('start_time', CarbonImmutable::parse($parsed['start_time']))
            ->where('end_time', CarbonImmutable::parse($parsed['end_time']))
            ->where('capacity', (int) $parsed['capacity'])
            ->where('operation_type', $parsed['operation_type'])
            ->where('status', '!=', Timeslot::STATUS_CLOSED)
            ->whereHas('clients', fn ($query) => $query->where('users.id', $clientId))
            ->first();
    }

    private function messageWasHandled(int $instanceId, string $externalMessageId): bool
    {
        return WhatsAppCommand::query()
            ->where('whatsapp_instance_id', $instanceId)
            ->where(function ($query) use ($externalMessageId): void {
                $query->where('external_message_id', $externalMessageId)
                    ->orWhere('confirmation_message_id', $externalMessageId);
            })
            ->exists();
    }

    private function reply(WhatsAppCommand $command, string $text): array
    {
        return [
            'phone' => $command->sender_phone,
            'text' => $text,
            'company_id' => $command->company_id,
            'context' => [
                'event' => 'whatsapp_timeslot_bot_reply',
                'whatsapp_command_id' => $command->id,
                'intent' => $command->intent,
                'status' => $command->status,
            ],
        ];
    }

    private function normalizeCommand(string $value): string
    {
        return Str::of(Str::ascii(mb_strtolower($value)))
            ->squish()
            ->trim(" \t\n\r\0\x0B.!?")
            ->toString();
    }

    private function looksLikeTimeslotCreation(string $normalized): bool
    {
        if (! str_contains($normalized, 'cota')) {
            return false;
        }

        return preg_match('/\b\d{1,4}\s+cotas?\b/u', $normalized) === 1
            || preg_match('/\b(?:criar|crie|abrir|abra|adicionar|adicione|gerar)\b.*\bcotas?\b/u', $normalized) === 1;
    }

    private function normalizeClientName(string $value): string
    {
        $value = Str::ascii(mb_strtolower($value));
        $value = preg_replace('/[^a-z0-9]+/', ' ', $value) ?? $value;
        $value = preg_replace('/^cliente\s+/', '', trim($value)) ?? trim($value);

        return Str::of($value)->squish()->toString();
    }

    private function dateLabel(string $value): string
    {
        return CarbonImmutable::parse($value)->setTimezone(config('app.timezone'))->format('d/m/Y');
    }

    private function timeRangeLabel(string $start, string $end): string
    {
        $timezone = config('app.timezone');

        return CarbonImmutable::parse($start)->setTimezone($timezone)->format('H:i')
            .'–'.CarbonImmutable::parse($end)->setTimezone($timezone)->format('H:i');
    }

    private function operationLabel(string $operationType): string
    {
        return match ($operationType) {
            'load' => 'Carga',
            'unload' => 'Descarga',
            default => 'Carga e descarga',
        };
    }
}
