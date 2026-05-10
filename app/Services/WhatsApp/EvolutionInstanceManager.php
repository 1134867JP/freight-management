<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppInstance;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
use RuntimeException;

class EvolutionInstanceManager
{
    public function __construct(
        private readonly HttpFactory $http,
    ) {}

    public function isReady(WhatsAppInstance $instance): bool
    {
        return $instance->is_active
            && filled($instance->instance_name)
            && filled($instance->base_url)
            && filled($instance->api_key);
    }

    public function sync(WhatsAppInstance $instance): array
    {
        if (! $this->isReady($instance)) {
            throw new RuntimeException('Configure base URL, API Key e nome técnico antes de conectar a instância.');
        }

        $this->ensureExists($instance);

        $connectResponse = $this->request($instance)
            ->get('/instance/connect/'.rawurlencode($instance->instance_name));

        try {
            $connectResponse->throw();
        } catch (RequestException $exception) {
            throw new RuntimeException(
                'Falha ao iniciar a conexão da instância na Evolution: '.$exception->getMessage(),
                previous: $exception,
            );
        }

        $connectionPayload = $this->fetchConnectionStatePayload($instance);
        $qrCode = $this->extractQrCode($connectResponse->json() ?? $connectResponse->body());
        $state = $this->extractConnectionState($connectionPayload) ?? 'unknown';

        return [
            'connection_state' => $state,
            'qr_code' => $state === 'open' ? null : $qrCode,
            'connected' => $state === 'open',
            'last_sync_response' => [
                'connect' => $connectResponse->json() ?? $connectResponse->body(),
                'connection' => $connectionPayload,
            ],
        ];
    }

    public function connectionState(WhatsAppInstance $instance): array
    {
        if (! $this->isReady($instance)) {
            throw new RuntimeException('Configure base URL, API Key e nome técnico antes de consultar a instância.');
        }

        $payload = $this->fetchConnectionStatePayload($instance);
        $state = $this->extractConnectionState($payload) ?? 'unknown';

        return [
            'connection_state' => $state,
            'connected' => $state === 'open',
            'last_sync_response' => [
                'connection' => $payload,
            ],
        ];
    }

    public function logout(WhatsAppInstance $instance): void
    {
        if (! $this->isReady($instance)) {
            return;
        }

        $response = $this->request($instance)
            ->delete('/instance/logout/'.rawurlencode($instance->instance_name));

        if ($response->failed() && $response->status() !== 404) {
            $response->throw();
        }
    }

    public function delete(WhatsAppInstance $instance): void
    {
        if (! $this->isReady($instance)) {
            return;
        }

        // Tentar realizar logout antes para evitar que a sessão fique presa
        try {
            $this->logout($instance);
        } catch (\Exception $e) {
            // Ignora erro no logout para tentar excluir a instância
        }

        $response = $this->request($instance)
            ->delete('/instance/delete/'.rawurlencode($instance->instance_name));

        if ($response->failed() && $response->status() !== 404) {
            $response->throw();
        }
    }

    private function ensureExists(WhatsAppInstance $instance): void
    {
        $response = $this->request($instance)->post('/instance/create', [
            'instanceName' => $instance->instance_name,
            'integration' => 'WHATSAPP-BAILEYS',
            'qrcode' => true,
        ]);

        if ($response->successful()) {
            return;
        }

        if (in_array($response->status(), [400, 409, 422], true)) {
            return;
        }

        // Evolution API returns 403 with "already in use" when the instance name exists
        if ($response->status() === 403) {
            $messages = Arr::get($response->json() ?? [], 'response.message', []);
            foreach ((array) $messages as $msg) {
                if (str_contains(strtolower((string) $msg), 'already in use')) {
                    return;
                }
            }
        }

        try {
            $response->throw();
        } catch (RequestException $exception) {
            throw new RuntimeException(
                'Falha ao criar/verificar a instância na Evolution: '.$exception->getMessage(),
                previous: $exception,
            );
        }
    }

    private function fetchConnectionStatePayload(WhatsAppInstance $instance): mixed
    {
        $response = $this->request($instance)
            ->get('/instance/connectionState/'.rawurlencode($instance->instance_name));

        try {
            $response->throw();
        } catch (RequestException $exception) {
            throw new RuntimeException(
                'Falha ao consultar o estado da instância na Evolution: '.$exception->getMessage(),
                previous: $exception,
            );
        }

        return $response->json() ?? $response->body();
    }

    private function request(WhatsAppInstance $instance)
    {
        return $this->http
            ->baseUrl(rtrim((string) $instance->base_url, '/'))
            ->acceptJson()
            ->asJson()
            ->retry(2, 400)
            ->timeout(20)
            ->withHeaders([
                'apikey' => (string) $instance->api_key,
            ]);
    }

    private function extractConnectionState(mixed $payload): ?string
    {
        if (is_string($payload)) {
            return $this->normalizeState($payload);
        }

        if (! is_array($payload)) {
            return null;
        }

        foreach (['instance.state', 'state', 'status', 'connectionState', 'instance.connectionStatus'] as $path) {
            $value = Arr::get($payload, $path);

            if (! is_string($value)) {
                continue;
            }

            return $this->normalizeState($value);
        }

        foreach ($payload as $value) {
            $state = $this->extractConnectionState($value);

            if ($state !== null) {
                return $state;
            }
        }

        return null;
    }

    private function extractQrCode(mixed $payload): ?string
    {
        if (is_string($payload)) {
            $value = trim($payload);

            if ($value === '') {
                return null;
            }

            if (str_starts_with($value, 'data:image/')) {
                return $value;
            }

            if (preg_match('/^[A-Za-z0-9+\/=\r\n]+$/', $value) === 1 && strlen($value) > 100) {
                return 'data:image/png;base64,'.preg_replace('/\s+/', '', $value);
            }

            return null;
        }

        if (! is_array($payload)) {
            return null;
        }

        foreach (['base64', 'qrcode.base64', 'qrcode', 'qr', 'qrCode', 'code'] as $path) {
            $value = Arr::get($payload, $path);
            $qrCode = $this->extractQrCode($value);

            if ($qrCode) {
                return $qrCode;
            }
        }

        foreach ($payload as $value) {
            $qrCode = $this->extractQrCode($value);

            if ($qrCode) {
                return $qrCode;
            }
        }

        return null;
    }

    private function normalizeState(string $value): string
    {
        $normalized = strtolower(trim($value));

        return match ($normalized) {
            'open', 'connected' => 'open',
            'close', 'closed', 'disconnected' => 'closed',
            default => $normalized,
        };
    }
}
