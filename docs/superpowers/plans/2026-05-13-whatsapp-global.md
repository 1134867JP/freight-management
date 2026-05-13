# WhatsApp Global Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Evolution API credentials to global `.env` config, auto-create WhatsAppInstance on company creation, and give company admins their own page to connect WhatsApp via QR code.

**Architecture:** Global `EVOLUTION_BASE_URL` and `EVOLUTION_API_KEY` replace per-company credentials. Each company auto-gets one `WhatsAppInstance` (keyed by slug) on creation. Platform admin UI is simplified to delete-only. A new `Admin\WhatsAppController` handles QR/sync per company.

**Tech Stack:** Laravel 12, Inertia.js, React (JSX), Evolution API, Tailwind CSS

---

### Task 1: Migration — drop legacy columns from whatsapp_instances

**Files:**
- Create: `database/migrations/2026_05_13_000002_drop_legacy_columns_from_whatsapp_instances.php`

- [ ] **Step 1: Create the migration file**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $columns = ['name', 'base_url', 'api_key'];
            $existing = array_values(array_filter($columns, fn ($col) => Schema::hasColumn('whatsapp_instances', $col)));
            if ($existing) {
                $table->dropColumn($existing);
            }
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_instances', function (Blueprint $table) {
            $table->string('name')->nullable();
            $table->string('base_url')->nullable();
            $table->text('api_key')->nullable();
        });
    }
};
```

- [ ] **Step 2: Run the migration**

Run: `php artisan migrate`

Expected: "Migrating: 2026_05_13_000002_drop_legacy_columns_from_whatsapp_instances" then "Migrated".

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_05_13_000002_drop_legacy_columns_from_whatsapp_instances.php
git commit -m "feat: drop name/base_url/api_key from whatsapp_instances (global config)"
```

---

### Task 2: Update WhatsAppInstance model

**Files:**
- Modify: `app/Models/WhatsAppInstance.php`

- [ ] **Step 1: Remove legacy fields from $fillable**

Replace the current `$fillable` array with:
```php
protected $fillable = [
    'company_id',
    'instance_name',
    'is_default',
    'is_active',
    'settings',
];
```

- [ ] **Step 2: Commit**

```bash
git add app/Models/WhatsAppInstance.php
git commit -m "feat: remove legacy fillable fields from WhatsAppInstance model"
```

---

### Task 3: EvolutionInstanceManager — use global config

**Files:**
- Modify: `app/Services/WhatsApp/EvolutionInstanceManager.php`

- [ ] **Step 1: Replace `isReady()` to check global config**

Replace:
```php
public function isReady(WhatsAppInstance $instance): bool
{
    return $instance->is_active
        && filled($instance->instance_name)
        && filled($instance->base_url)
        && filled($instance->api_key);
}
```

With:
```php
public function isReady(WhatsAppInstance $instance): bool
{
    return $instance->is_active
        && filled($instance->instance_name)
        && filled(config('services.evolution.base_url'))
        && filled(config('services.evolution.api_key'));
}
```

- [ ] **Step 2: Replace `request()` to use global config**

Replace:
```php
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
```

With:
```php
private function request(WhatsAppInstance $instance)
{
    return $this->http
        ->baseUrl(rtrim(config('services.evolution.base_url', ''), '/'))
        ->acceptJson()
        ->asJson()
        ->retry(2, 400)
        ->timeout(20)
        ->withHeaders([
            'apikey' => config('services.evolution.api_key', ''),
        ]);
}
```

- [ ] **Step 3: Update error messages in sync() and connectionState()**

In `sync()`, replace the `isReady` error message:
```php
throw new RuntimeException('Instância não configurada. Verifique a configuração global da Evolution.');
```

In `connectionState()`, replace the `isReady` error message:
```php
throw new RuntimeException('Instância não configurada. Verifique a configuração global da Evolution.');
```

- [ ] **Step 4: Commit**

```bash
git add app/Services/WhatsApp/EvolutionInstanceManager.php
git commit -m "feat: EvolutionInstanceManager reads global config instead of per-instance credentials"
```

---

### Task 4: PlatformCompanyController — auto-create instance + update payload

**Files:**
- Modify: `app/Http/Controllers/PlatformCompanyController.php`

- [ ] **Step 1: Add WhatsAppInstance import**

Add to the use-imports block at top of file:
```php
use App\Models\WhatsAppInstance;
```

- [ ] **Step 2: Auto-create WhatsAppInstance inside store() transaction**

Inside the `DB::transaction(function () use ($request): void {` closure in `store()`, after the `$this->syncCompanyAdmin($company, $validated);` call, add:
```php
WhatsAppInstance::firstOrCreate(
    ['company_id' => $company->id],
    [
        'instance_name' => $slug,
        'is_default'    => true,
        'is_active'     => true,
    ]
);
```

- [ ] **Step 3: Update instances_ready_count in index()**

In `index()`, replace:
```php
'instances_ready_count' => $companies->filter(
    fn (array $company) => $company['whatsapp_instance'] && $company['whatsapp_instance']['has_api_key'],
)->count(),
```

With:
```php
'instances_ready_count' => $companies->filter(
    fn (array $company) => ($company['whatsapp_instance']['connected'] ?? false) === true,
)->count(),
```

- [ ] **Step 4: Simplify toPlatformPayload() whatsapp_instance block**

In `toPlatformPayload()`, replace the entire `whatsapp_instance` key:
```php
'whatsapp_instance' => $instance ? [
    'id'               => $instance->id,
    'instance_name'    => $instance->instance_name,
    'is_active'        => $instance->is_active,
    'connection_state' => $instance->settings['connection_state'] ?? 'not_configured',
    'connected'        => $instance->settings['connected'] ?? false,
    'last_synced_at'   => $instance->settings['last_synced_at'] ?? null,
] : null,
```

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/PlatformCompanyController.php
git commit -m "feat: auto-create WhatsAppInstance on company creation, simplify instance payload"
```

---

### Task 5: Slim down PlatformCompanyInstanceController

**Files:**
- Modify: `app/Http/Controllers/PlatformCompanyInstanceController.php`
- Delete: `app/Http/Requests/Platform/UpdateCompanyInstanceRequest.php`

- [ ] **Step 1: Replace the entire controller with destroy-only version**

Overwrite `app/Http/Controllers/PlatformCompanyInstanceController.php` with:
```php
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
```

- [ ] **Step 2: Delete the now-unused UpdateCompanyInstanceRequest**

```bash
git rm app/Http/Requests/Platform/UpdateCompanyInstanceRequest.php
```

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/PlatformCompanyInstanceController.php
git commit -m "feat: slim down PlatformCompanyInstanceController to destroy-only"
```

---

### Task 6: Update routes

**Files:**
- Modify: `routes/web.php`

- [ ] **Step 1: Add Admin\WhatsAppController import**

Add to the top imports of `routes/web.php`:
```php
use App\Http\Controllers\Admin\WhatsAppController;
```

- [ ] **Step 2: Remove 4 platform instance routes (keep destroy)**

In the `platform_admin` middleware group, remove these 4 lines:
```php
Route::get('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'edit'])->name('platform.companies.instance.edit');
Route::patch('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'update'])->name('platform.companies.instance.update');
Route::post('/companies/{company}/instance/sync', [PlatformCompanyInstanceController::class, 'sync'])->name('platform.companies.instance.sync');
Route::post('/companies/{company}/instance/refresh', [PlatformCompanyInstanceController::class, 'refresh'])->name('platform.companies.instance.refresh');
```

Leave the destroy route intact:
```php
Route::delete('/companies/{company}/instance', [PlatformCompanyInstanceController::class, 'destroy'])->name('platform.companies.instance.destroy');
```

- [ ] **Step 3: Add 3 admin WhatsApp routes**

Inside the `Route::middleware('admin')->prefix('admin')` group, add before the closing `});`:
```php
// WhatsApp
Route::get('/whatsapp', [WhatsAppController::class, 'show'])->name('admin.whatsapp');
Route::post('/whatsapp/sync', [WhatsAppController::class, 'sync'])->name('admin.whatsapp.sync');
Route::post('/whatsapp/refresh', [WhatsAppController::class, 'refresh'])->name('admin.whatsapp.refresh');
```

- [ ] **Step 4: Verify route list**

Run: `php artisan route:list --name=admin.whatsapp`

Expected: 3 rows (GET, POST /admin/whatsapp/sync, POST /admin/whatsapp/refresh).

- [ ] **Step 5: Commit**

```bash
git add routes/web.php
git commit -m "feat: add admin whatsapp routes, remove platform instance edit/update/sync/refresh"
```

---

### Task 7: New Admin\WhatsAppController

**Files:**
- Create: `app/Http/Controllers/Admin/WhatsAppController.php`

- [ ] **Step 1: Create the controller**

```php
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
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Controllers/Admin/WhatsAppController.php
git commit -m "feat: add Admin\\WhatsAppController with show/sync/refresh"
```

---

### Task 8: New Admin/WhatsApp/Index.jsx

**Files:**
- Create: `resources/js/Pages/Admin/WhatsApp/Index.jsx`

- [ ] **Step 1: Create the directory and file**

Create `resources/js/Pages/Admin/WhatsApp/Index.jsx`:

```jsx
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, router } from '@inertiajs/react';

export default function Index({ configured, instance }) {
  const handleSync = () => {
    router.post(route('admin.whatsapp.sync'), {}, { preserveScroll: true });
  };

  const handleRefresh = () => {
    router.post(route('admin.whatsapp.refresh'), {}, { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="WhatsApp"
          subtitle="Conecte o WhatsApp da sua empresa escaneando o QR Code."
        />
      }
    >
      <Head title="WhatsApp" />

      <div className="py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          {!configured ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Evolution API não configurado no servidor. Entre em contato com o administrador da
                plataforma.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                      Estado da conexão
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-gray-100">
                      {formatState(instance?.connection_state)}
                    </p>
                    {instance?.last_synced_at && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        Última sincronização:{' '}
                        {new Date(instance.last_synced_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <ConnectionBadge connected={instance?.connected} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSync}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Gerar QR Code
                  </button>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Atualizar estado
                  </button>
                </div>
              </section>

              {instance?.qr_code && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    QR Code
                  </p>
                  <div className="flex justify-center">
                    <div className="w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-600">
                      <img
                        src={instance.qr_code}
                        alt="QR Code WhatsApp"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-center text-sm text-slate-500 dark:text-gray-400">
                    Abra o WhatsApp no celular e escaneie o código acima.
                  </p>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function ConnectionBadge({ connected }) {
  if (connected) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Conectado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
      Desconectado
    </span>
  );
}

function formatState(value) {
  const map = {
    open: 'Conectado',
    closed: 'Desconectado',
    connecting: 'Conectando',
    not_configured: 'Não configurado',
    unknown: 'Aguardando',
  };
  return map[value] || value || 'Aguardando';
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/Pages/Admin/WhatsApp/Index.jsx
git commit -m "feat: add Admin/WhatsApp/Index.jsx page with QR/status/connect UI"
```

---

### Task 9: AuthenticatedLayout — Configurações section + WhatsApp icon

**Files:**
- Modify: `resources/js/Layouts/AuthenticatedLayout.jsx`

- [ ] **Step 1: Add `whatsapp` to MenuIcon objPaths**

In `MenuIcon`, add `whatsapp` entry after the `driver` entry (around line 488):
```js
driver:
  'M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 13a7 7 0 0 1 14 0',
whatsapp:
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z',
```

- [ ] **Step 2: Add "Configurações" section to admin menuSections**

The admin `menuSections` ends at line 109 with `];` (after the "Dados" block). Add the Configurações section before that closing `];`:

```js
        {
          section: 'Configurações',
          items: [
            {
              label: 'WhatsApp',
              href: route('admin.whatsapp'),
              active: route().current('admin.whatsapp*'),
              icon: 'whatsapp',
            },
          ],
        },
```

- [ ] **Step 3: Commit**

```bash
git add resources/js/Layouts/AuthenticatedLayout.jsx
git commit -m "feat: add WhatsApp to admin sidebar under Configurações, add whatsapp MenuIcon"
```

---

### Task 10: Companies.jsx — remove link, update instance section, delete CompanyInstance.jsx

**Files:**
- Modify: `resources/js/Pages/Platform/Companies.jsx`
- Delete: `resources/js/Pages/Platform/CompanyInstance.jsx`

- [ ] **Step 1: Remove "Instância / QR Code" Link from company card header**

Remove these lines (around line 206–211):
```jsx
<Link
  href={route('platform.companies.instance.edit', company.id)}
  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
>
  Instância / QR Code
</Link>
```

- [ ] **Step 2: Remove `Link` from the import (no longer used)**

Change line 7 from:
```js
import { Head, Link, router, useForm } from '@inertiajs/react';
```
to:
```js
import { Head, router, useForm } from '@inertiajs/react';
```

- [ ] **Step 3: Add deleteInstance helper function**

Inside the `Companies` component function, after the `deleteCompany` function, add:
```js
const deleteInstance = (companyId) => {
  if (confirm('Excluir instância WhatsApp desta empresa? Esta ação remove a conexão no provedor.')) {
    router.delete(route('platform.companies.instance.destroy', companyId), {
      preserveScroll: true,
    });
  }
};
```

- [ ] **Step 4: Replace the "Instância WhatsApp" section in the card detail panel**

Replace the entire whatsapp_instance display block (around lines 255–281):
```jsx
<div className="space-y-3">
  <SectionTitle>WhatsApp</SectionTitle>
  {company.whatsapp_instance ? (
    <div className="rounded-2xl border border-slate-200 p-4 dark:border-gray-700">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900 dark:text-gray-100">
            {company.whatsapp_instance.instance_name}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
            {formatState(company.whatsapp_instance.connection_state)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${company.whatsapp_instance.connected ? 'bg-emerald-500' : 'bg-red-400'}`}
          />
          <button
            type="button"
            onClick={() => deleteInstance(company.id)}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  ) : (
    <EmptyBlock text="Instância será criada automaticamente ao salvar a empresa." />
  )}
</div>
```

- [ ] **Step 5: Update the PageHeader subtitle** (no longer mentions QR code page)

Change:
```jsx
subtitle="Cadastre empresas, mantenha o admin principal e abra uma tela dedicada para QR code e conexão da instância."
```
To:
```jsx
subtitle="Cadastre empresas, gerencie admins e acompanhe o status de conexão WhatsApp de cada empresa."
```

- [ ] **Step 6: Delete CompanyInstance.jsx**

```bash
git rm resources/js/Pages/Platform/CompanyInstance.jsx
```

- [ ] **Step 7: Verify no references to removed routes remain**

```bash
grep -r "companies.instance.edit\|companies.instance.update\|companies.instance.sync\|companies.instance.refresh" resources/
```
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add resources/js/Pages/Platform/Companies.jsx
git commit -m "feat: simplify platform Companies — remove instance link, show status+delete inline, delete CompanyInstance.jsx"
```
