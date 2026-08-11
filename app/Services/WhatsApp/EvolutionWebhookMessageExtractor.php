<?php

namespace App\Services\WhatsApp;

use App\Support\WhatsAppPhone;
use Illuminate\Support\Arr;

class EvolutionWebhookMessageExtractor
{
    public function extract(array $payload): ?array
    {
        $event = strtoupper(str_replace(['.', '-'], '_', (string) ($payload['event'] ?? '')));

        if ($event !== 'MESSAGES_UPSERT') {
            return null;
        }

        $instanceName = trim((string) ($payload['instance'] ?? ''));
        $data = $this->normalizeData($payload['data'] ?? null);

        if ($instanceName === '' || $data === null || $this->isFromMe(Arr::get($data, 'key.fromMe'))) {
            return null;
        }

        $remoteJid = (string) Arr::get($data, 'key.remoteJid', '');

        if ($this->isGroupOrBroadcast($remoteJid)) {
            return null;
        }

        $senderPhone = $this->extractSenderPhone($payload, $data, $remoteJid);
        $text = $this->extractText($data);

        if (! WhatsAppPhone::isValid($senderPhone) || $text === null) {
            return null;
        }

        $externalMessageId = trim((string) Arr::get($data, 'key.id', ''));

        if ($externalMessageId === '') {
            $externalMessageId = hash('sha256', implode('|', [
                $instanceName,
                $senderPhone,
                (string) ($payload['date_time'] ?? Arr::get($data, 'messageTimestamp', '')),
                $text,
            ]));
        }

        if (strlen($externalMessageId) > 191) {
            $externalMessageId = hash('sha256', $externalMessageId);
        }

        return [
            'instance_name' => $instanceName,
            'external_message_id' => $externalMessageId,
            'sender_phone' => $senderPhone,
            'text' => trim($text),
        ];
    }

    private function normalizeData(mixed $data): ?array
    {
        if (! is_array($data)) {
            return null;
        }

        if (isset($data['messages'][0]) && is_array($data['messages'][0])) {
            return $data['messages'][0];
        }

        if (array_is_list($data)) {
            return isset($data[0]) && is_array($data[0]) ? $data[0] : null;
        }

        return $data;
    }

    private function isFromMe(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 'true';
    }

    private function isGroupOrBroadcast(string $jid): bool
    {
        return str_ends_with($jid, '@g.us') || str_ends_with($jid, '@broadcast');
    }

    private function extractSenderPhone(array $payload, array $data, string $remoteJid): ?string
    {
        $candidates = [
            Arr::get($data, 'key.senderPn'),
            Arr::get($data, 'senderPn'),
            $payload['sender'] ?? null,
            $remoteJid,
        ];

        foreach ($candidates as $candidate) {
            if (! is_string($candidate) || $candidate === '' || str_contains($candidate, '@lid')) {
                continue;
            }

            $phone = WhatsAppPhone::normalize($candidate);

            if (WhatsAppPhone::isValid($phone)) {
                return $phone;
            }
        }

        return null;
    }

    private function extractText(array $data): ?string
    {
        $paths = [
            'message.conversation',
            'message.extendedTextMessage.text',
            'message.ephemeralMessage.message.conversation',
            'message.ephemeralMessage.message.extendedTextMessage.text',
            'message.viewOnceMessage.message.conversation',
            'message.viewOnceMessage.message.extendedTextMessage.text',
            'message.imageMessage.caption',
            'message.videoMessage.caption',
        ];

        foreach ($paths as $path) {
            $value = Arr::get($data, $path);

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }
}
