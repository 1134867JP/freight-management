<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
        $instance = auth()->user()->company?->whatsappInstance;

        $configured = filled(config('services.evolution.base_url'))
            && filled(config('services.evolution.api_key'));

        return Inertia::render('Admin/WhatsApp/Index', [
            'configured' => $configured,
            'instance'   => $instance ? $this->serializeInstance($instance) : null,
        ]);
    }

    public function sync(EvolutionInstanceManager $manager): RedirectResponse
    {
        $instance = auth()->user()->company?->whatsappInstance;

        abort_unless($instance, 404);

        try {
            $state = $manager->sync($instance);
        } catch (\Throwable $exception) {
            return redirect()->route('admin.whatsapp')->with('error', $exception->getMessage());
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
            return redirect()->route('admin.whatsapp')->with('error', $exception->getMessage());
        }

        $this->persistInstanceState($instance, $state);

        return redirect()->route('admin.whatsapp')->with('success', 'Estado da instância atualizado.');
    }

    private function persistInstanceState(WhatsAppInstance $instance, array $state): void
    {
        $settings = $instance->settings ?? [];

        $settings['connection_state']   = $state['connection_state'] ?? 'unknown';
        $settings['qr_code']            = $state['qr_code'] ?? ($settings['qr_code'] ?? null);
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

        return [
            'id'               => $instance->id,
            'instance_name'    => $instance->instance_name,
            'is_active'        => $instance->is_active,
            'connection_state' => $settings['connection_state'] ?? 'not_configured',
            'connected'        => $settings['connected'] ?? false,
            'qr_code'          => $settings['qr_code'] ?? null,
            'last_synced_at'   => $settings['last_synced_at'] ?? null,
        ];
    }
}
