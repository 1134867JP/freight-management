# WhatsApp Global Architecture Design

**Date:** 2026-05-13  
**Status:** Approved

## Context

Currently the Evolution API credentials (`base_url`, `api_key`) are configured per company by the platform admin, and only the platform admin can generate the QR code and connect the instance. This is over-engineered for a SaaS multi-tenant model where a single Evolution API server hosts all companies' instances.

The goal is to:
1. Move `base_url` and `api_key` to global `.env` config — one Evolution server for all
2. Auto-create a `WhatsAppInstance` (with `instance_name = company-slug`) when a company is created
3. Give company admins their own page to connect WhatsApp (generate QR, scan, refresh)
4. Clean up the platform side — remove per-company API config UI

## Architecture

One Evolution API server hosts multiple "instances" — each instance is one WhatsApp connection (one phone number). The `instance_name` is what differentiates companies on the same server. Global config:

```
EVOLUTION_ENABLED=true
EVOLUTION_BASE_URL=http://your-evolution-server
EVOLUTION_API_KEY=your-global-key
```

Per company: only `instance_name` (= slug) + `is_active` + `settings` (QR + connection state).

## Valid Combinations

- Instance exists + global config set + `is_active=true` → ready to send messages
- Instance exists + global config missing → page shows "Evolution não configurado"
- Instance does not exist → created automatically when company is created

---

## Backend Changes

### 1. Migration — clean up whatsapp_instances
Remove unused per-company columns:
```php
Schema::table('whatsapp_instances', function (Blueprint $table) {
    $table->dropColumn(['name', 'base_url', 'api_key']);
});
```

### 2. WhatsAppInstance model
Remove `name`, `base_url`, `api_key` from `$fillable`. Remaining fillable: `company_id`, `instance_name`, `is_default`, `is_active`, `settings`.

### 3. EvolutionInstanceManager — use global config
`request()` method: replace `$instance->base_url` and `$instance->api_key` with global config:
```php
private function request(WhatsAppInstance $instance)
{
    return $this->http
        ->baseUrl(rtrim(config('services.evolution.base_url', ''), '/'))
        ->acceptJson()->asJson()->retry(2, 400)->timeout(20)
        ->withHeaders(['apikey' => config('services.evolution.api_key', '')]);
}
```

`isReady()`: check global config instead of instance fields:
```php
public function isReady(WhatsAppInstance $instance): bool
{
    return $instance->is_active
        && filled($instance->instance_name)
        && filled(config('services.evolution.base_url'))
        && filled(config('services.evolution.api_key'));
}
```

`EvolutionApiClient` already falls back to global config — no change needed there.

### 4. PlatformCompanyController::store() — auto-create instance
After creating the company, auto-create its WhatsApp instance:
```php
WhatsAppInstance::create([
    'company_id'    => $company->id,
    'instance_name' => $company->slug,
    'is_default'    => true,
    'is_active'     => true,
]);
```

### 5. Remove from PlatformCompanyInstanceController
Delete methods `edit()`, `update()`, `sync()`, `refresh()`. Keep only `destroy()` (platform admin can reset/remove instance if needed) and the `serializeInstance()` / `persistInstanceState()` private helpers — these will be reused in `Admin\WhatsAppController`.

### 6. New Admin\WhatsAppController
File: `app/Http/Controllers/Admin/WhatsAppController.php`

```php
show()   → GET  /admin/whatsapp          → renders Admin/WhatsApp/Index with instance data
sync()   → POST /admin/whatsapp/sync     → calls EvolutionInstanceManager::sync(), persists state
refresh()→ POST /admin/whatsapp/refresh  → calls EvolutionInstanceManager::connectionState(), persists state
```

Authorization: `isCompanyAdmin()` check. Reads instance via `auth()->user()->company->whatsappInstance`.

If instance doesn't exist or Evolution not configured → return props with `configured: false`.

### 7. Routes
Remove:
```php
Route::get('/companies/{company}/instance', ...)     // platform.companies.instance.edit
Route::patch('/companies/{company}/instance', ...)   // platform.companies.instance.update
Route::post('/companies/{company}/instance/sync', ...)    // platform.companies.instance.sync
Route::post('/companies/{company}/instance/refresh', ...) // platform.companies.instance.refresh
```

Keep:
```php
Route::delete('/companies/{company}/instance', ...)  // platform.companies.instance.destroy
```

Add (admin middleware group):
```php
Route::get('/whatsapp', [WhatsAppController::class, 'show'])->name('admin.whatsapp');
Route::post('/whatsapp/sync', [WhatsAppController::class, 'sync'])->name('admin.whatsapp.sync');
Route::post('/whatsapp/refresh', [WhatsAppController::class, 'refresh'])->name('admin.whatsapp.refresh');
```

---

## Frontend Changes

### 1. CompanyInstance.jsx (platform) — simplify to status + delete
Remove: entire configuration form (`instance_label`, `instance_name`, `instance_base_url`, `instance_api_key`, `clear_instance_api_key`), "Gerar QR Code" button, "Atualizar estado" button, QR code display.

Keep: connection status summary (state, last synced) + delete button.

This page is only reachable via the delete icon on the company card — or can redirect to companies list and show status inline.

### 2. New Admin/WhatsApp/Index.jsx
File: `resources/js/Pages/Admin/WhatsApp/Index.jsx`

Shows:
- **If `configured=false`:** card with message "Evolution API não configurado no servidor. Entre em contato com o administrador da plataforma."
- **If configured:** 
  - Status badge (Conectado / Desconectado / Aguardando)
  - QR code image (when available)
  - "Gerar QR Code" button → POST `admin.whatsapp.sync`
  - "Atualizar estado" button → POST `admin.whatsapp.refresh`
  - Last synced timestamp

### 3. AuthenticatedLayout — new "Configurações" section
Add to admin menu (after "Dados" section):
```js
{
  section: 'Configurações',
  items: [
    { label: 'WhatsApp', href: route('admin.whatsapp'), active: route().current('admin.whatsapp'), icon: 'whatsapp' }
  ]
}
```

Icon `whatsapp` needs to be added to the `MenuIcon` function.

### 4. PlatformCompanyController::toPlatformPayload() — simplify whatsapp_instance
Remove `has_api_key` (no longer relevant). Keep `connection_state`, `connected`, `last_synced_at`, `instance_name`.

### 5. Companies.jsx (platform) — remove "Configurar instância" link
The platform company cards currently have a "Configurar instância" button. Since there is nothing to configure per company (connection is managed by the company admin), remove the button entirely. The connection status (`connected`, `connection_state`) can remain visible in the company card as a read-only badge.

---

## Verification

1. Create a new company → `WhatsAppInstance` record created automatically with `instance_name = slug`
2. Log in as company admin → sidebar shows "Configurações > WhatsApp"
3. Without `EVOLUTION_BASE_URL` in `.env` → page shows "não configurado" message
4. With Evolution configured → "Gerar QR Code" shows QR image
5. After scanning → "Atualizar estado" shows "Conectado"
6. Platform admin tries `GET /platform/companies/{id}/instance` → 404 (route removed)
7. Existing message sending (freight notifications) still works — `EvolutionApiClient` uses global config
