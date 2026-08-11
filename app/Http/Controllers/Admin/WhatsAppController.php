<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppCommand;
use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionInstanceManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppController extends Controller
{
    public function show(): Response
    {
        $company = auth()->user()->company;
        $instance = $company?->whatsappInstance;

        $configured = filled(config('services.evolution.base_url'))
            && filled(config('services.evolution.api_key'));

        if ($company) {
            WhatsAppCommand::query()
                ->where('company_id', $company->id)
                ->where('status', WhatsAppCommand::STATUS_PENDING_CONFIRMATION)
                ->where('expires_at', '<=', now())
                ->update(['status' => WhatsAppCommand::STATUS_EXPIRED]);
        }

        $commands = $company
            ? WhatsAppCommand::query()
                ->where('company_id', $company->id)
                ->with(['user:id,name', 'client:id,name', 'timeslot:id'])
                ->latest('id')
                ->limit(25)
                ->get()
                ->map(fn (WhatsAppCommand $command): array => [
                    'id' => $command->id,
                    'protocol' => $command->protocol(),
                    'message' => $command->message,
                    'intent' => $command->intent,
                    'status' => $command->status,
                    'sender_name' => $command->user?->name,
                    'client_name' => $command->client?->name
                        ?? ($command->parsed_payload['client_name'] ?? null),
                    'timeslot_id' => $command->timeslot_id,
                    'start_time' => $command->parsed_payload['start_time'] ?? null,
                    'capacity' => $command->parsed_payload['capacity'] ?? null,
                    'error_message' => $command->error_message,
                    'created_at' => $command->created_at?->toIso8601String(),
                ])
            : collect();

        $webhookUrl = $this->botWebhookUrl();

        return Inertia::render('Admin/WhatsApp/Index', [
            'configured' => $configured,
            'instance'   => $instance ? $this->serializeInstance($instance) : null,
            'bot' => [
                'enabled' => (bool) config('services.evolution.bot.enabled'),
                'configured' => filled(config('services.evolution.bot.webhook_secret'))
                    && filter_var($webhookUrl, FILTER_VALIDATE_URL),
                'confirmation_ttl_minutes' => (int) config('services.evolution.bot.confirmation_ttl_minutes', 10),
                'timeslot_duration_minutes' => (int) config('services.evolution.bot.timeslot_duration_minutes', 60),
            ],
            'commands' => $commands,
        ]);
    }

    public function sync(EvolutionInstanceManager $manager): RedirectResponse
    {
        $company = auth()->user()->company;

        abort_unless($company, 404);

        $instance = $company->whatsappInstance;

        if (! $instance) {
            $instance = $company->whatsappInstance()->create([
                'instance_name' => $company->slug,
                'is_default'    => true,
                'is_active'     => true,
            ]);
        }

        try {
            $state = $manager->sync($instance);
        } catch (\Throwable $exception) {
            return redirect()->route('admin.whatsapp')
                ->with('error', $exception->getMessage())
                ->with('error_action', $this->is403Error($exception) ? 'delete_instance' : 'retry');
        }

        $this->persistInstanceState($instance, $state);

        return redirect()->route('admin.whatsapp')->with(
            $state['connected'] ? 'success' : 'info',
            $state['connected']
                ? 'Instância conectada com sucesso.'
                : 'QR Code atualizado. Escaneie pelo WhatsApp para concluir a conexão.',
        );
    }

    public function refresh(EvolutionInstanceManager $manager): RedirectResponse
    {
        $instance = auth()->user()->company?->whatsappInstance;

        abort_unless($instance, 404);

        try {
            $state = $manager->connectionState($instance);
        } catch (\Throwable $exception) {
            return redirect()->route('admin.whatsapp')
                ->with('error', $exception->getMessage())
                ->with('error_action', $this->is403Error($exception) ? 'delete_instance' : 'retry');
        }

        $this->persistInstanceState($instance, $state);

        return redirect()->route('admin.whatsapp')->with('success', 'Estado da instância atualizado.');
    }

    public function destroy(EvolutionInstanceManager $manager): RedirectResponse
    {
        $instance = auth()->user()->company?->whatsappInstance;

        abort_unless($instance, 404);

        if (($instance->settings['connected'] ?? false) === true) {
            return redirect()
                ->route('admin.whatsapp')
                ->with('error', 'Não é possível excluir enquanto a instância estiver conectada.');
        }

        try {
            $manager->delete($instance);
        } catch (\Throwable $exception) {
            return redirect()
                ->route('admin.whatsapp')
                ->with('error', 'Falha ao excluir a instância: '.$exception->getMessage());
        }

        $instance->delete();

        return redirect()
            ->route('admin.whatsapp')
            ->with('success', 'Instância excluída com sucesso.');
    }

    private function is403Error(\Throwable $exception): bool
    {
        if ($exception instanceof \Illuminate\Http\Client\RequestException) {
            return $exception->response->status() === 403;
        }

        if ($prev = $exception->getPrevious()) {
            return $this->is403Error($prev);
        }

        return false;
    }

    private function persistInstanceState(WhatsAppInstance $instance, array $state): void
    {
        $settings = $instance->settings ?? [];

        $settings['connection_state']   = $state['connection_state'] ?? 'unknown';
        // sync() always includes 'qr_code'; refresh (connectionState) never does.
        // Use array_key_exists so a null QR from sync clears the stale code instead of preserving it.
        $settings['qr_code'] = array_key_exists('qr_code', $state)
            ? $state['qr_code']
            : ($settings['qr_code'] ?? null);
        $settings['connected']          = $state['connected'] ?? false;
        $settings['last_synced_at']     = Carbon::now()->toIso8601String();
        $settings['last_sync_response'] = $state['last_sync_response'] ?? null;

        if (($state['connected'] ?? false) === true) {
            $settings['qr_code'] = null;
        }

        $instance->update(['settings' => $settings]);
    }

    private function serializeInstance(WhatsAppInstance $instance): array
    {
        $settings = $instance->settings ?? [];
        $secret = (string) config('services.evolution.bot.webhook_secret', '');
        $storedHash = $settings['bot_webhook_secret_hash'] ?? null;
        $webhookMatchesConfig = $secret !== ''
            && is_string($storedHash)
            && hash_equals($storedHash, hash('sha256', $secret))
            && ($settings['bot_webhook_url'] ?? null) === $this->botWebhookUrl();

        return [
            'id'               => $instance->id,
            'instance_name'    => $instance->instance_name,
            'is_active'        => $instance->is_active,
            'connection_state' => $settings['connection_state'] ?? 'not_configured',
            'connected'        => $settings['connected'] ?? false,
            'qr_code'          => $settings['qr_code'] ?? null,
            'last_synced_at'   => $settings['last_synced_at'] ?? null,
            'bot_webhook_configured_at' => $settings['bot_webhook_configured_at'] ?? null,
            'bot_webhook_matches_config' => $webhookMatchesConfig,
        ];
    }

    private function botWebhookUrl(): string
    {
        $url = trim((string) config('services.evolution.bot.webhook_url', ''));

        return $url !== ''
            ? $url
            : rtrim((string) config('app.url'), '/').'/api/webhooks/evolution';
    }
}
