<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Services\WhatsApp\EvolutionInstanceManager;
use Illuminate\Http\RedirectResponse;

class PlatformCompanyInstanceController extends Controller
{
    public function destroy(Company $company, EvolutionInstanceManager $manager): RedirectResponse
    {
        $instance = $company->whatsappInstance;

        if ($instance) {
            try {
                $manager->delete($instance);
            } catch (\Throwable $exception) {
                // Ignore API failure; still delete local record
            }

            $instance->delete();
        }

        return redirect()
            ->route('platform.companies.index')
            ->with('success', 'Instância do WhatsApp excluída com sucesso.');
    }
}
