# Company Modules (uses_queues / uses_docks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar flags booleanas por empresa (`uses_queues`, `uses_docks`) configuráveis pelo platform admin, fazendo o sistema funcionar para empresas que só precisam de agendamento básico de cotas, sem fila de operação ou docas.

**Architecture:** Duas colunas booleanas na tabela `companies` (default `true`, preservando comportamento atual). Flags expostas via Inertia shared data em `auth.company`. Frontend condiciona menus, campos e opções com base nessas flags. Validação backend também respeita os flags.

**Tech Stack:** Laravel 12, Inertia.js, React 18, Tailwind CSS, PostgreSQL

---

## Combinações válidas

| `uses_queues` | `uses_docks` | Comportamento |
|---|---|---|
| false | false | Só cotas: admin cria slots, cliente reserva |
| true  | false | Cotas + fluxo de operação, sem doca |
| false | true  | Cotas + atribuição de doca, sem fluxo de operação |
| true  | true  | Sistema completo (comportamento atual) |

---

## File Map

| Arquivo | Ação |
|---|---|
| `database/migrations/2026_05_13_000001_add_module_flags_to_companies_table.php` | Criar |
| `app/Models/Company.php` | Modificar: `$fillable`, `$casts`, helpers |
| `app/Http/Middleware/HandleInertiaRequests.php` | Modificar: adicionar flags ao `auth.company` |
| `app/Http/Requests/Platform/StoreCompanyRequest.php` | Modificar: adicionar regras |
| `app/Http/Requests/Platform/UpdateCompanyRequest.php` | Modificar: adicionar regras |
| `app/Http/Controllers/PlatformCompanyController.php` | Modificar: `store`, `update`, `toPlatformPayload` |
| `resources/js/Pages/Platform/Companies.jsx` | Modificar: adicionar toggles na modal |
| `resources/js/Layouts/AuthenticatedLayout.jsx` | Modificar: menu condicional |
| `app/Http/Requests/Timeslot/StoreTimeslotRequest.php` | Modificar: excluir `por_produto_doca` quando `uses_docks=false` |
| `app/Http/Requests/Timeslot/UpdateTimeslotRequest.php` | Modificar: idem |
| `app/Http/Controllers/FreightController.php` | Modificar: `docasDisponiveis` condicional |
| `resources/js/Pages/Admin/Timeslots/Partials/TimeslotForm.jsx` | Modificar: ocultar campos de doca |
| `resources/js/Pages/Admin/Freights/Index.jsx` | Modificar: ocultar AssignDoca quando `uses_docks=false` |

---

### Task 1: Migration

**Files:**
- Create: `database/migrations/2026_05_13_000001_add_module_flags_to_companies_table.php`

- [ ] **Step 1: Criar o arquivo de migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('uses_queues')->default(true)->after('settings')
                ->comment('Habilita portaria, status de operação e gestão de pátio');
            $table->boolean('uses_docks')->default(true)->after('uses_queues')
                ->comment('Habilita atribuição de docas a cotas e fretes');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['uses_queues', 'uses_docks']);
        });
    }
};
```

- [ ] **Step 2: Rodar a migration**

```bash
php artisan migrate
```

Saída esperada: `Migrating: 2026_05_13_000001_add_module_flags_to_companies_table` seguido de `Migrated`.

- [ ] **Step 3: Commit**

```bash
git add database/migrations/2026_05_13_000001_add_module_flags_to_companies_table.php
git commit -m "feat: add uses_queues and uses_docks flags to companies table"
```

---

### Task 2: Company Model

**Files:**
- Modify: `app/Models/Company.php`

- [ ] **Step 1: Atualizar o model**

Substituir o bloco `$fillable` e `$casts`, e adicionar os dois helpers após `getLogoUrlAttribute`:

```php
protected $fillable = [
    'name',
    'slug',
    'is_active',
    'logo_path',
    'settings',
    'uses_queues',
    'uses_docks',
];

protected $casts = [
    'is_active' => 'boolean',
    'settings' => 'array',
    'uses_queues' => 'boolean',
    'uses_docks' => 'boolean',
];

public function usesQueues(): bool
{
    return $this->uses_queues ?? true;
}

public function usesDocks(): bool
{
    return $this->uses_docks ?? true;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/Models/Company.php
git commit -m "feat: add module flag fields and helpers to Company model"
```

---

### Task 3: Inertia Shared Data

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`

- [ ] **Step 1: Expor flags no auth.company**

No método `share()`, localizar o bloco que constrói `$company` e substituir por:

```php
$company = [
    'id'          => $user->company?->id,
    'name'        => $user->company?->name,
    'slug'        => $user->company?->slug,
    'logo_url'    => $user->company?->logo_url,
    'uses_queues' => $user->company?->uses_queues ?? true,
    'uses_docks'  => $user->company?->uses_docks ?? true,
];
```

- [ ] **Step 2: Commit**

```bash
git add app/Http/Middleware/HandleInertiaRequests.php
git commit -m "feat: expose company module flags in Inertia shared data"
```

---

### Task 4: Platform Form Requests

**Files:**
- Modify: `app/Http/Requests/Platform/StoreCompanyRequest.php`
- Modify: `app/Http/Requests/Platform/UpdateCompanyRequest.php`

- [ ] **Step 1: Adicionar regras em StoreCompanyRequest**

No método `rules()`, adicionar após `'remove_logo'`:
```php
'uses_queues' => ['required', 'boolean'],
'uses_docks'  => ['required', 'boolean'],
```

No método `prepareForValidation()`, adicionar após `'remove_logo'`:
```php
'uses_queues' => $this->boolean('uses_queues'),
'uses_docks'  => $this->boolean('uses_docks'),
```

O `prepareForValidation` completo ficará:
```php
protected function prepareForValidation(): void
{
    $this->merge([
        'company_is_active' => $this->boolean('company_is_active'),
        'remove_logo'       => $this->boolean('remove_logo'),
        'uses_queues'       => $this->boolean('uses_queues'),
        'uses_docks'        => $this->boolean('uses_docks'),
        'admin_whatsapp_phone' => $this->exists('admin_whatsapp_phone')
            ? WhatsAppPhone::normalize($this->input('admin_whatsapp_phone'))
            : null,
    ]);
}
```

- [ ] **Step 2: Aplicar as mesmas mudanças em UpdateCompanyRequest**

Idêntico ao passo anterior — adicionar `uses_queues` e `uses_docks` em `rules()` e `prepareForValidation()`.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Requests/Platform/StoreCompanyRequest.php \
        app/Http/Requests/Platform/UpdateCompanyRequest.php
git commit -m "feat: accept uses_queues and uses_docks in platform company requests"
```

---

### Task 5: PlatformCompanyController

**Files:**
- Modify: `app/Http/Controllers/PlatformCompanyController.php`

- [ ] **Step 1: Persistir flags em store()**

No método `store()`, substituir `Company::create([...])` por:

```php
$company = Company::create([
    'name'        => $validated['company_name'],
    'slug'        => $slug,
    'is_active'   => $validated['company_is_active'],
    'uses_queues' => $validated['uses_queues'],
    'uses_docks'  => $validated['uses_docks'],
]);
```

- [ ] **Step 2: Persistir flags em update()**

No método `update()`, substituir `$company->update([...])` por:

```php
$company->update([
    'name'        => $validated['company_name'],
    'slug'        => $slug,
    'is_active'   => $validated['company_is_active'],
    'uses_queues' => $validated['uses_queues'],
    'uses_docks'  => $validated['uses_docks'],
]);
```

- [ ] **Step 3: Retornar flags em toPlatformPayload()**

No método `toPlatformPayload()`, adicionar após `'is_active'`:

```php
'is_active'   => $company->is_active,
'uses_queues' => $company->uses_queues,
'uses_docks'  => $company->uses_docks,
```

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/PlatformCompanyController.php
git commit -m "feat: persist and expose company module flags in platform controller"
```

---

### Task 6: Companies.jsx — Toggles de Módulos

**Files:**
- Modify: `resources/js/Pages/Platform/Companies.jsx`

- [ ] **Step 1: Adicionar flags em initialFormData()**

Substituir `initialFormData()` por:

```js
function initialFormData() {
  return {
    company_name: '',
    company_slug: '',
    company_is_active: true,
    uses_queues: true,
    uses_docks: true,
    logo: null,
    remove_logo: false,
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_whatsapp_phone: '',
  };
}
```

- [ ] **Step 2: Preencher flags em openEdit()**

No bloco `applyFormData({...})` dentro de `openEdit`, adicionar após `company_is_active`:

```js
uses_queues: Boolean(company.uses_queues ?? true),
uses_docks:  Boolean(company.uses_docks ?? true),
```

- [ ] **Step 3: Adicionar seção Módulos no formulário**

No JSX do formulário modal, localizar onde `company_is_active` é renderizado (procure por `company_is_active` no JSX). Após esse campo, adicionar:

```jsx
{/* Módulos */}
<div>
  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-gray-300">Módulos</p>
  <div className="space-y-2">
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={data.uses_queues}
        onChange={(e) => setData('uses_queues', e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
      <span className="text-sm text-slate-700 dark:text-gray-300">
        Filas / Operação
        <span className="ml-1 text-xs text-slate-400">(portaria, status de frete, pátio)</span>
      </span>
    </label>
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={data.uses_docks}
        onChange={(e) => setData('uses_docks', e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
      <span className="text-sm text-slate-700 dark:text-gray-300">
        Docas
        <span className="ml-1 text-xs text-slate-400">(atribuição de doca a cotas e fretes)</span>
      </span>
    </label>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Platform/Companies.jsx
git commit -m "feat: add module toggles to platform company form"
```

---

### Task 7: AuthenticatedLayout — Menu Condicional

**Files:**
- Modify: `resources/js/Layouts/AuthenticatedLayout.jsx`

- [ ] **Step 1: Extrair flags de auth.company**

Após a linha `const logoUrl = company?.logo_url || '/storage/logo.png';`, adicionar:

```js
const usesQueues = company?.uses_queues ?? true;
const usesDocks  = company?.uses_docks  ?? true;
```

- [ ] **Step 2: Substituir o bloco isAdmin do menuSections**

Localizar o `if (isAdmin) { return [...] }` e substituir completamente por:

```js
if (isAdmin) {
  const yardStructureChildren = [
    ...(usesDocks  ? [{ label: 'Docas',             href: route('docas.index'),       active: route().current('docas.*')       }] : []),
    ...(usesQueues ? [{ label: 'Zonas do Pátio',    href: route('yard-zones.index'),  active: route().current('yard-zones.*')  }] : []),
    ...(usesQueues ? [{ label: 'Vagas do Pátio',    href: route('yard-spots.index'),  active: route().current('yard-spots.*')  }] : []),
    ...(usesQueues ? [{ label: 'Cavalos Mecânicos', href: route('yard-trucks.index'), active: route().current('yard-trucks.*') }] : []),
  ];

  const cadastrosItems = [
    { label: 'Clientes',  href: route('clients.index'),            active: route().current('clients.*'),           icon: 'users'    },
    { label: 'Endereços', href: route('dropoff-addresses.index'),  active: route().current('dropoff-addresses.*'), icon: 'location' },
    { label: 'Produtos',  href: route('produtos.index'),           active: route().current('produtos.*'),          icon: 'box'      },
    ...(yardStructureChildren.length > 0 ? [{
      label: 'Estrutura do Pátio',
      icon: 'zones',
      group: 'yard-structure',
      active: route().current('docas.*') || route().current('yard-zones.*') || route().current('yard-spots.*') || route().current('yard-trucks.*'),
      children: yardStructureChildren,
    }] : []),
  ];

  return [
    {
      section: 'Operação',
      items: [
        { label: 'Painel',   href: route('admin.dashboard'),       active: route().current('admin.dashboard'), icon: 'dashboard' },
        ...(usesQueues ? [{ label: 'Portaria', href: route('admin.gate'), active: route().current('admin.gate'), icon: 'gate' }] : []),
        { label: 'Fretes',   href: route('freights.approvalList'), active: route().current('freights.*'),      icon: 'freight'   },
      ],
    },
    ...(usesQueues ? [{
      section: 'Pátio',
      items: [
        { label: 'Painel do Pátio',        href: route('admin.yard-board'),  active: route().current('admin.yard-board'),   icon: 'yardboard' },
        { label: 'Mapa do Pátio',          href: route('admin.yard-map'),    active: route().current('admin.yard-map'),     icon: 'map'       },
        { label: 'Ordens de Movimentação', href: route('admin.move-orders'), active: route().current('admin.move-orders*'), icon: 'moveorder' },
        { label: 'KPIs',                   href: route('admin.kpi'),         active: route().current('admin.kpi'),          icon: 'kpi'       },
      ],
    }] : []),
    {
      section: 'Agendamento',
      items: [
        { label: 'Cotas',  href: route('timeslots.index'), active: route().current('timeslots.*'),  icon: 'calendar' },
        { label: 'Agenda', href: route('admin.agenda'),    active: route().current('admin.agenda'), icon: 'schedule' },
      ],
    },
    { section: 'Cadastros', items: cadastrosItems },
    {
      section: 'Dados',
      items: [{
        label: 'Relatórios',
        icon: 'chart',
        group: 'reports-admin',
        active: route().current('reports.admin.*'),
        children: [
          { label: 'Cotas',  href: route('reports.admin.timeslots'), active: route().current('reports.admin.timeslots') },
          { label: 'Fretes', href: route('reports.admin.freights'),  active: route().current('reports.admin.freights')  },
        ],
      }],
    },
  ];
}
```

- [ ] **Step 3: Commit**

```bash
git add resources/js/Layouts/AuthenticatedLayout.jsx
git commit -m "feat: conditional sidebar menu based on company module flags"
```

---

### Task 8: Timeslot Requests — Validação Condicional de Doca

**Files:**
- Modify: `app/Http/Requests/Timeslot/StoreTimeslotRequest.php`
- Modify: `app/Http/Requests/Timeslot/UpdateTimeslotRequest.php`

- [ ] **Step 1: Atualizar StoreTimeslotRequest::rules()**

Substituir o método `rules()` completo por:

```php
public function rules(): array
{
    $idCompany  = $this->user()?->company_id;
    $usesDocks  = $this->user()?->company?->uses_docks ?? true;

    return [
        'start_time'         => 'required|date',
        'end_time'           => 'required|date|after:start_time',
        'operation_type'     => 'required|in:load,unload,both',
        'capacity'           => 'required|integer|min:1',
        'description'        => 'nullable|string|max:255',
        'status'             => 'required|in:available,full,closed',
        'modelo'             => ['required', Rule::in($usesDocks
            ? ['aberta', 'por_produto', 'por_produto_doca']
            : ['aberta', 'por_produto'])],
        'produto_id'         => ['nullable', Rule::exists('produtos', 'id')->where('company_id', $idCompany)],
        'doca_id'            => ['nullable', Rule::exists('docas', 'id')->where('company_id', $idCompany)],
        'dropoff_address_id' => ['nullable', Rule::exists('dropoff_addresses', 'id')->where('company_id', $idCompany)],
        'client_ids'         => 'nullable|array',
        'client_ids.*'       => [Rule::exists('users', 'id')
            ->where('company_id', $idCompany)
            ->where('role', User::ROLE_CLIENT)],
    ];
}
```

O método `withValidator` permanece igual — se `modelo` for bloqueado pela regra acima, a checagem de `doca_id` nunca será atingida.

- [ ] **Step 2: Aplicar a mesma mudança em UpdateTimeslotRequest::rules()**

O arquivo `UpdateTimeslotRequest.php` tem o mesmo `rules()` com `'modelo' => 'required|in:aberta,por_produto,por_produto_doca'`. Aplicar a mesma substituição:

```php
public function rules(): array
{
    $idCompany = $this->user()?->company_id;
    $usesDocks = $this->user()?->company?->uses_docks ?? true;

    return [
        'start_time'         => 'required|date',
        'end_time'           => 'required|date|after:start_time',
        'operation_type'     => 'required|in:load,unload,both',
        'capacity'           => 'required|integer|min:1',
        'description'        => 'nullable|string|max:255',
        'status'             => 'required|in:available,full,closed',
        'modelo'             => ['required', Rule::in($usesDocks
            ? ['aberta', 'por_produto', 'por_produto_doca']
            : ['aberta', 'por_produto'])],
        'produto_id'         => ['nullable', Rule::exists('produtos', 'id')->where('company_id', $idCompany)],
        'doca_id'            => ['nullable', Rule::exists('docas', 'id')->where('company_id', $idCompany)],
        'dropoff_address_id' => ['nullable', Rule::exists('dropoff_addresses', 'id')->where('company_id', $idCompany)],
        'client_ids'         => 'nullable|array',
        'client_ids.*'       => [Rule::exists('users', 'id')
            ->where('company_id', $idCompany)
            ->where('role', User::ROLE_CLIENT)],
    ];
}
```

Verificar se `UpdateTimeslotRequest` também tem um `withValidator` — se sim, mantê-lo igual.

- [ ] **Step 3: Commit**

```bash
git add app/Http/Requests/Timeslot/StoreTimeslotRequest.php \
        app/Http/Requests/Timeslot/UpdateTimeslotRequest.php
git commit -m "feat: exclude por_produto_doca modelo when company uses_docks=false"
```

---

### Task 9: TimeslotForm.jsx — Ocultar Campos de Doca

**Files:**
- Modify: `resources/js/Pages/Admin/Timeslots/Partials/TimeslotForm.jsx`

- [ ] **Step 1: Importar usePage e ler flag**

Adicionar `usePage` ao import do React/Inertia na linha 1:

```js
import React, { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import AddressModal from './AddressModal';
import FormField from '@/Components/UI/FormField';
import { useClientValidation } from '@/hooks/useClientValidation';
```

Dentro do componente, logo após a declaração das variáveis `arrDocas` (linha ~12), adicionar:

```js
const usesDocks = usePage().props.auth?.company?.uses_docks ?? true;
```

- [ ] **Step 2: Atualizar blTemDoca**

Substituir a linha 15:
```js
const blTemDoca = form.data.modelo === 'por_produto_doca';
```
por:
```js
const blTemDoca = form.data.modelo === 'por_produto_doca' && usesDocks;
```

- [ ] **Step 3: Ocultar opção por_produto_doca no select**

No JSX do select de modelo (linha ~160-163), substituir:
```jsx
<option value="aberta">Cota Aberta</option>
<option value="por_produto">Por Produto</option>
<option value="por_produto_doca">Por Produto + Doca</option>
```
por:
```jsx
<option value="aberta">Cota Aberta</option>
<option value="por_produto">Por Produto</option>
{usesDocks && <option value="por_produto_doca">Por Produto + Doca</option>}
```

O campo de doca (linha ~189 — `{blTemDoca && (...)}`) já fica oculto automaticamente porque `blTemDoca` depende de `usesDocks`.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Admin/Timeslots/Partials/TimeslotForm.jsx
git commit -m "feat: hide dock fields in timeslot form when company uses_docks=false"
```

---

### Task 10: FreightController + Freights/Index — Dock Assignment Condicional

**Files:**
- Modify: `app/Http/Controllers/FreightController.php`
- Modify: `resources/js/Pages/Admin/Freights/Index.jsx`

- [ ] **Step 1: Tornar docasDisponiveis condicional no controller**

No método `approvalList()` em `FreightController.php`, localizar:
```php
$docasDisponiveis = Doca::available()->orderBy('nome')->get(['id', 'nome', 'codigo']);
```

Substituir por:
```php
$company = auth()->user()->company;
$docasDisponiveis = $company->usesDocks()
    ? Doca::available()->orderBy('nome')->get(['id', 'nome', 'codigo'])
    : collect();
```

Assegurar que `use App\Models\Doca;` está nos imports do controller (já está no arquivo atual).

- [ ] **Step 2: Ocultar AssignDocaModal quando uses_docks=false**

No arquivo `resources/js/Pages/Admin/Freights/Index.jsx`, linha 12:
```js
export default function Index({ freights, docasDisponiveis }) {
```

Adicionar dentro do componente, logo após as declarações de estado:
```js
const { auth } = usePage().props;
const usesDocks = auth.company?.uses_docks ?? true;
```

Adicionar `usePage` ao import do Inertia (linha ~1):
```js
import { Head, Link, router, usePage } from '@inertiajs/react';
```

Localizar onde o botão/ícone "Atribuir Doca" é renderizado (onde `onOpenAssignDocaModal` é chamado, linha ~300) e envolver com:
```jsx
{usesDocks && (
  <button ... onClick={() => setAssignDocaModal({ open: true, freight: objFreight })}>
    Atribuir Doca
  </button>
)}
```

Localizar onde `<AssignDocaModal ...>` é renderizado (linha ~331) e envolver com:
```jsx
{usesDocks && (
  <AssignDocaModal
    open={assignDocaModal.open}
    freight={assignDocaModal.freight}
    docasDisponiveis={docasDisponiveis}
    onClose={() => setAssignDocaModal({ open: false, freight: null })}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/Http/Controllers/FreightController.php \
        resources/js/Pages/Admin/Freights/Index.jsx
git commit -m "feat: conditional dock assignment in freight management"
```

---

## Verificação End-to-End

1. **Rodar migration:** `php artisan migrate` — confirmar que colunas existem em `companies`
2. **Testar como platform admin:**
   - Criar uma empresa nova com `uses_queues=false, uses_docks=false`
   - Editar uma empresa existente e desabilitar `uses_docks`
3. **Logar como admin da empresa com ambos desabilitados:**
   - Sidebar deve ter apenas: Painel, Fretes, Cotas, Agenda, Clientes, Endereços, Produtos, Relatórios
   - Criar timeslot → opções de modelo: apenas "Cota Aberta" e "Por Produto" (sem "Por Produto + Doca")
4. **Logar como admin com só uses_docks=false:**
   - Sidebar sem Docas em "Estrutura do Pátio", mas Pátio/Portaria aparecem
   - Fretes não mostram botão "Atribuir Doca"
5. **Logar como admin com só uses_queues=false:**
   - Sem Portaria, sem seção Pátio inteira
   - Docas aparecem normalmente em Estrutura do Pátio
   - Timeslot com "Por Produto + Doca" ainda disponível
6. **Empresa com tudo habilitado (existente):** nenhuma mudança de comportamento
