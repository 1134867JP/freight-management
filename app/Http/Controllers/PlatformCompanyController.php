<?php

namespace App\Http\Controllers;

use App\Http\Requests\Platform\StoreCompanyRequest;
use App\Http\Requests\Platform\UpdateCompanyRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlatformCompanyController extends Controller
{
    public function index(): Response
    {
        $companies = Company::query()
            ->with([
                'whatsappInstance',
                'users' => fn ($query) => $query
                    ->where('role', User::ROLE_COMPANY_ADMIN)
                    ->orderBy('id'),
            ])
            ->withCount([
                'users as company_admins_count' => fn ($query) => $query->where('role', User::ROLE_COMPANY_ADMIN),
                'users as clients_count' => fn ($query) => $query->where('role', User::ROLE_CLIENT),
                'timeslots',
                'timeslots as active_timeslots_count' => fn ($query) => $query->active(),
                'freights',
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Company $company) => $this->toPlatformPayload($company));

        return Inertia::render('Platform/Companies', [
            'summary' => [
                'companies_count' => $companies->count(),
                'active_companies_count' => $companies->where('is_active', true)->count(),
                'instances_ready_count' => $companies->filter(
                    fn (array $company) => $company['whatsapp_instance'] && $company['whatsapp_instance']['has_api_key'],
                )->count(),
                'clients_count' => $companies->sum('stats.clients_count'),
            ],
            'companies' => $companies->values(),
        ]);
    }

    public function store(StoreCompanyRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $validated = $request->validated();
            $slug = $this->makeUniqueSlug($validated['company_name'], $validated['company_slug'] ?? null);

            $company = Company::create([
                'name'        => $validated['company_name'],
                'slug'        => $slug,
                'is_active'   => $validated['company_is_active'],
                'uses_queues' => $validated['uses_queues'],
                'uses_docks'  => $validated['uses_docks'],
            ]);

            $this->syncCompanyLogo(
                $company,
                $request->file('logo'),
                $validated['remove_logo'] ?? false,
            );
            $this->syncCompanyAdmin($company, $validated);
        });

        return redirect()
            ->route('platform.dashboard')
            ->with('success', 'Empresa criada com sucesso.');
    }

    public function update(UpdateCompanyRequest $request, Company $company): RedirectResponse
    {
        DB::transaction(function () use ($request, $company): void {
            $validated = $request->validated();
            $slug = $this->makeUniqueSlug($validated['company_name'], $validated['company_slug'] ?? null, $company);

            $company->update([
                'name'        => $validated['company_name'],
                'slug'        => $slug,
                'is_active'   => $validated['company_is_active'],
                'uses_queues' => $validated['uses_queues'],
                'uses_docks'  => $validated['uses_docks'],
            ]);

            $this->syncCompanyLogo(
                $company,
                $request->file('logo'),
                $validated['remove_logo'] ?? false,
            );
            $this->syncCompanyAdmin($company, $validated);
        });

        return redirect()
            ->route('platform.dashboard')
            ->with('success', 'Empresa atualizada com sucesso.');
    }

    public function destroy(Company $company): RedirectResponse
    {
        $activeTimeslotsCount = $company->timeslots()->active()->count();

        if ($activeTimeslotsCount > 0) {
            $label = $activeTimeslotsCount === 1 ? 'cota ativa' : 'cotas ativas';

            return redirect()
                ->route('platform.dashboard')
                ->with('error', "A empresa não pode ser excluída porque possui {$activeTimeslotsCount} {$label}.");
        }

        $logoPath = $company->logo_path;

        DB::transaction(function () use ($company): void {
            $company->delete();
        });

        if (filled($logoPath)) {
            Storage::disk('public')->delete($logoPath);
        }

        return redirect()
            ->route('platform.dashboard')
            ->with('success', 'Empresa excluída com sucesso.');
    }

    private function syncCompanyLogo(Company $company, ?UploadedFile $logo, bool $removeLogo): void
    {
        if ($removeLogo && filled($company->logo_path)) {
            Storage::disk('public')->delete($company->logo_path);
            $company->logo_path = null;
        }

        if ($logo) {
            if (filled($company->logo_path)) {
                Storage::disk('public')->delete($company->logo_path);
            }

            $company->logo_path = $logo->store('company-logos', 'public');
        }

        $company->save();
    }

    private function syncCompanyAdmin(Company $company, array $validated): void
    {
        $admin = $company->users()
            ->where('role', User::ROLE_COMPANY_ADMIN)
            ->orderBy('id')
            ->first();

        if (! $admin && blank($validated['admin_password'] ?? null)) {
            throw ValidationException::withMessages([
                'admin_password' => 'Informe uma senha para criar o admin da empresa.',
            ]);
        }

        $payload = [
            'company_id' => $company->id,
            'name' => $validated['admin_name'],
            'email' => $validated['admin_email'],
            'whatsapp_phone' => $validated['admin_whatsapp_phone'] ?: null,
            'role' => User::ROLE_COMPANY_ADMIN,
        ];

        if (filled($validated['admin_password'] ?? null)) {
            $payload['password'] = Hash::make($validated['admin_password']);
        }

        if ($admin) {
            $admin->update($payload);

            return;
        }

        User::create($payload);
    }

    private function toPlatformPayload(Company $company): array
    {
        $admin = $company->users
            ->firstWhere('role', User::ROLE_COMPANY_ADMIN);
        $instance = $company->whatsappInstance;

        return [
            'id'          => $company->id,
            'name'        => $company->name,
            'slug'        => $company->slug,
            'is_active'   => $company->is_active,
            'uses_queues' => $company->uses_queues,
            'uses_docks'  => $company->uses_docks,
            'logo_url' => $company->logo_url,
            'admin' => $admin ? [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'whatsapp_phone' => $admin->whatsapp_phone,
            ] : null,
            'stats' => [
                'company_admins_count' => $company->company_admins_count,
                'clients_count' => $company->clients_count,
                'timeslots_count' => $company->timeslots_count,
                'active_timeslots_count' => $company->active_timeslots_count,
                'freights_count' => $company->freights_count,
            ],
            'can_delete' => $company->active_timeslots_count === 0,
            'whatsapp_instance' => $instance ? [
                'id' => $instance->id,
                'label' => $instance->name,
                'instance_name' => $instance->instance_name,
                'base_url' => $instance->base_url,
                'is_active' => $instance->is_active,
                'has_api_key' => filled($instance->api_key),
                'connection_state' => $instance->settings['connection_state'] ?? 'not_configured',
                'connected' => $instance->settings['connected'] ?? false,
                'last_synced_at' => $instance->settings['last_synced_at'] ?? null,
            ] : null,
        ];
    }

    private function makeUniqueSlug(string $name, ?string $slug = null, ?Company $ignore = null): string
    {
        $baseSlug = Str::slug($slug ?: $name);

        if ($baseSlug === '') {
            $baseSlug = 'empresa';
        }

        $candidate = $baseSlug;
        $counter = 2;

        while (
            Company::query()
                ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $candidate;
    }
}
