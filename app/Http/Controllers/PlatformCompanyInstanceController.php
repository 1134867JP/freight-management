<?php

namespace App\Http\Controllers;

use App\Http\Requests\Platform\UpdateCompanyInstanceRequest;
use App\Models\Company;
use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionInstanceManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PlatformCompanyInstanceController extends Controller
{
    public function edit(Company $company): Response
    {
        $company->loadMissing(['settings', 'whatsappInstance']);

        return Inertia::render('Platform/CompanyInstance', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'is_active' => $company->is_active,
                'logo_url' => $company->settings?->logo_url,
            ],
            'instance' => $this->serializeInstance($company->whatsappInstance),
        ]);
    }

    public function update(UpdateCompanyInstanceRequest $request, Company $company): RedirectResponse
    {
        $validated = $request->validated();
        $instance = $company->whatsappInstance()->first();

        $payload = [
            'name' => $validated['instance_label'],
            'instance_name' => $validated['instance_name'],
            'base_url' => $validated['instance_base_url'],
            'is_default' => true,
            'is_active' => $validated['instance_is_active'],
            'settings' => $instance?->settings ?? [],
        ];

        if ($validated['clear_instance_api_key'] ?? false) {
            $payload['api_key'] = null;
        } elseif (filled($validated['instance_api_key'] ?? null)) {
            $payload['api_key'] = $validated['instance_api_key'];
        } elseif (! $instance) {
            $payload['api_key'] = null;
        }

        $company->whatsappInstance()->updateOrCreate([], $payload);

        return redirect()
            ->route('platform.companies.instance.edit', $company)
            ->with('success', 'Configuração da instância salva com sucesso.');
    }

    public function sync(Company $company, EvolutionInstanceManager $manager): RedirectResponse
    {
        $instance = $company->whatsappInstance;

        abort_unless($instance, 404);

        try {
            $state = $manager->sync($instance);
        } catch (\Throwable $exception) {
            return redirect()
                ->route('platform.companies.instance.edit', $company)
                ->with('error', $exception->getMessage());
        }

        $this->persistInstanceState($instance, $state);

        return redirect()
            ->route('platform.companies.instance.edit', $company)
            ->with(
                $state['connected'] ? 'success' : 'info',
                $state['connected']
                    ? 'Instância conectada com sucesso.'
                    : 'QR Code atualizado. Escaneie pelo WhatsApp para concluir a conexão.',
            );
    }

    public function refresh(Company $company, EvolutionInstanceManager $manager): RedirectResponse
    {
        $instance = $company->whatsappInstance;

        abort_unless($instance, 404);

        try {
            $state = $manager->connectionState($instance);
        } catch (\Throwable $exception) {
            return redirect()
                ->route('platform.companies.instance.edit', $company)
                ->with('error', $exception->getMessage());
        }

        $this->persistInstanceState($instance, $state);

        return redirect()
            ->route('platform.companies.instance.edit', $company)
            ->with('success', 'Estado da instância atualizado.');
    }

    private function persistInstanceState(WhatsAppInstance $instance, array $state): void
    {
        $settings = $instance->settings ?? [];

        $settings['connection_state'] = $state['connection_state'] ?? 'unknown';
        $settings['qr_code'] = $state['qr_code'] ?? ($settings['qr_code'] ?? null);
        $settings['connected'] = $state['connected'] ?? false;
        $settings['last_synced_at'] = Carbon::now()->toIso8601String();
        $settings['last_sync_response'] = $state['last_sync_response'] ?? null;

        if (($state['connected'] ?? false) === true) {
            $settings['qr_code'] = null;
        }

        $instance->update([
            'settings' => $settings,
        ]);
    }

    private function serializeInstance(?WhatsAppInstance $instance): ?array
    {
        if (! $instance) {
            return null;
        }

        $settings = $instance->settings ?? [];

        return [
            'id' => $instance->id,
            'label' => $instance->name,
            'instance_name' => $instance->instance_name,
            'base_url' => $instance->base_url,
            'is_active' => $instance->is_active,
            'has_api_key' => filled($instance->api_key),
            'connection_state' => $settings['connection_state'] ?? 'not_configured',
            'connected' => $settings['connected'] ?? false,
            'qr_code' => $settings['qr_code'] ?? null,
            'last_synced_at' => $settings['last_synced_at'] ?? null,
        ];
    }
}
