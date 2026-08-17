<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppInstance;
use App\Support\WhatsAppPhone;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use RuntimeException;

class EvolutionApiClient
{
    public function __construct(private readonly HttpFactory $http) {}

    public function isReadyForSending(?WhatsAppInstance $instance = null): bool
    {
        return $this->readinessIssues($instance) === [];
    }

    public function readinessIssues(?WhatsAppInstance $instance = null): array
    {
        $issues = [];

        if ($instance) {
            if (! $instance->is_active) {
                $issues[] = 'company_instance_inactive';
            }
        } elseif (! $this->isEnabled()) {
            $issues[] = 'global_evolution_disabled';
        }

        if (blank($this->baseUrl($instance))) {
            $issues[] = 'missing_base_url';
        }

        if (blank($this->apiKey($instance))) {
            $issues[] = 'missing_api_key';
        }

        if (blank($this->instance($instance))) {
            $issues[] = 'missing_instance_name';
        }

        return $issues;
    }

    public function sendText(string $number, string $text, ?WhatsAppInstance $instance = null): array
    {
        $issues = $this->readinessIssues($instance);

        if ($issues !== []) {
            throw new RuntimeException(
                'Evolution API não está configurada para envio: '.implode(', ', $issues),
            );
        }

        $strPhone = WhatsAppPhone::normalize($number);

        if (! WhatsAppPhone::isValid($strPhone)) {
            throw new RuntimeException('Número de WhatsApp inválido para envio.');
        }

        $objResponse = $this->newRequest($instance)
            ->post('/message/sendText/'.rawurlencode($this->instance($instance)), [
                'number' => $strPhone,
                'text' => trim($text),
            ]);

        try {
            $objResponse->throw();
        } catch (RequestException $exception) {
            throw new RuntimeException(
                'Falha ao enviar mensagem pela Evolution API: '.$exception->getMessage(),
                previous: $exception,
            );
        }

        return $objResponse->json() ?? [];
    }

    private function newRequest(?WhatsAppInstance $instance = null)
    {
        return $this->http
            ->baseUrl($this->baseUrl($instance))
            ->acceptJson()
            ->asJson()
            ->timeout($this->timeout())
            ->withHeaders([
                'apikey' => $this->apiKey($instance),
            ]);
    }

    private function isEnabled(): bool
    {
        return (bool) config('services.evolution.enabled', false);
    }

    private function baseUrl(?WhatsAppInstance $instance = null): string
    {
        return rtrim((string) ($instance?->base_url ?: config('services.evolution.base_url', '')), '/');
    }

    private function apiKey(?WhatsAppInstance $instance = null): string
    {
        return (string) ($instance?->api_key ?: config('services.evolution.api_key', ''));
    }

    private function instance(?WhatsAppInstance $instance = null): string
    {
        return (string) ($instance?->instance_name ?: config('services.evolution.instance', ''));
    }

    private function timeout(): int
    {
        return (int) config('services.evolution.timeout', 10);
    }
}
