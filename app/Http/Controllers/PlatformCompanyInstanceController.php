<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionInstanceManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlatformCompanyInstanceController extends Controller
{
    public function edit(Company $company): Response
    {
        $instance = $company->whatsappInstance;

        return Inertia::render('Platform/CompanyInstance', [
            'company' => ['id' => $company->id, 'name' => $company->name, 'slug' => $company->slug],
            'instance' => $instance ? [
                'id'            => $instance->id,
                'name'          => $instance->name,
                'instance_name' => $instance->instance_name,
                'base_url'      => $instance->base_url,
                'api_key_masked' => $instance->maskedApiKey(),
                'api_key_configured' => filled($instance->api_key),
                'is_active'     => $instance->is_active,
                'settings'      => $instance->settings,
            ] : null,
        ]);
    }

    public function update(Request $request, Company $company): RedirectResponse
    {
        $validated = $request->validate([
            'instance_label'    => ['required', 'string', 'max:255'],
            'instance_name'     => [
                'required',
                'string',
                'max:255',
                Rule::unique('whatsapp_instances', 'instance_name')
                    ->ignore($company->whatsappInstance?->id),
            ],
            'instance_base_url' => ['required', 'url', 'max:500'],
            'instance_api_key'  => ['required', 'string', 'max:500'],
            'instance_is_active' => ['boolean'],
        ]);

        $company->whatsappInstance()->updateOrCreate(
            ['company_id' => $company->id],
            [
                'name'          => $validated['instance_label'],
                'instance_name' => $validated['instance_name'],
                'base_url'      => $validated['instance_base_url'],
                'api_key'       => $validated['instance_api_key'],
                'is_default'    => true,
                'is_active'     => $validated['instance_is_active'] ?? true,
            ],
        );

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
                ->with('error', \App\Support\UserFacingError::message($exception));
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

    public function destroy(Company $company, EvolutionInstanceManager $manager): RedirectResponse
    {
        $instance = $company->whatsappInstance;

        if ($instance) {
            try {
                $manager->delete($instance);
            } catch (\Throwable $exception) {
                return redirect()
                    ->route('platform.companies.instance.edit', $company)
                    ->with('error', \App\Support\UserFacingError::message($exception));
            }

            $instance->delete();
        }

        return redirect()
            ->route('platform.companies.index')
            ->with('success', 'Instância do WhatsApp excluída com sucesso.');
    }

    private function persistInstanceState(WhatsAppInstance $instance, array $state): void
    {
        $settings = $instance->settings ?? [];

        $settings['connection_state']   = $state['connection_state'] ?? 'unknown';
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
}
