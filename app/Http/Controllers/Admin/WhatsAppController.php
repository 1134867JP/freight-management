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
