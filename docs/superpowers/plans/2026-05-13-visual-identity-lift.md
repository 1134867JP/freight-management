# Visual Identity Lift — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar a identidade visual do CargoHub de um CRUD genérico para um produto SaaS B2B profissional, sem alterar lógica de negócio, rotas ou arquitetura de componentes.

**Architecture:** Mudanças puramente visuais em JSX/Tailwind. Nenhum arquivo PHP é tocado. Nenhuma nova biblioteca é instalada. Cada task produz um `npm run build` limpo ao final.

**Tech Stack:** React 18, Inertia.js, Tailwind CSS v3. Sem novos pacotes.

**Spec:** `docs/superpowers/specs/2026-05-13-visual-identity-lift-design.md`

---

## Descobertas Pré-Plano (leia antes de implementar)

- `StatusBadge.jsx` **já tem** `rounded-full` + `font-medium` + dot indicator → **sem mudanças**
- `AuthenticatedLayout.jsx` **já tem** `menuSections` com grupos e labels de seção → só atualizar o `SideLink` active state
- `Button.jsx` já tem `secondary: bg-white border-gray-300` → só adicionar `soft`
- `EmptyState.jsx` usa bordered box → reescrever para design centrado com ícone
- `PageHeader.jsx` usa thin line teal → trocar por circle icon + título `text-2xl`

---

## File Structure

**Modificar:**
- `resources/js/Components/UI/Button.jsx` — adicionar variante `soft`
- `resources/js/Components/UI/EmptyState.jsx` — reescrever com ícone centrado
- `resources/js/Components/UI/PageHeader.jsx` — prop `icon`, título `text-2xl`
- `resources/js/Layouts/AuthenticatedLayout.jsx` — SideLink active state light
- `resources/js/Pages/Admin/Dashboard.jsx` — stat cards + zebra
- `resources/js/Pages/Admin/Timeslots/Index.jsx` — zebra table
- `resources/js/Pages/Admin/Timeslots/Partials/TimeslotForm.jsx` — inputClass teal
- `resources/js/Pages/Admin/Freights/Index.jsx` — stat cards melhorados
- `resources/js/Pages/Admin/Clients.jsx` — zebra + EmptyState com ícone
- `resources/js/Pages/Admin/Agenda.jsx` — zebra table
- `resources/js/Pages/Client/Dashboard.jsx` — label uppercase nos stat cards
- `resources/js/Pages/Client/AvailableSlots/Partials/TimeslotCard.jsx` — selected state mais forte
- `resources/js/Pages/Client/MyReservations.jsx` — zebra table
- `resources/js/Pages/Client/Trucks.jsx` — EmptyState com ícone
- `resources/js/Pages/Client/Drivers.jsx` — EmptyState com ícone

**Verificar (podem precisar de ajuste menor):**
- `resources/js/Pages/Admin/Timeslots/Partials/TimeslotsTable.jsx` — zebra
- `resources/js/Pages/Admin/Freights/Partials/FreightsTable.jsx` — zebra
- `resources/js/Pages/Client/AvailableSlots/Partials/ReservationForm.jsx` — inputClass

---

## Task 1: Button.jsx — variante `soft`

**Files:**
- Modify: `resources/js/Components/UI/Button.jsx`

- [ ] **Step 1: Adicionar a variante `soft` em `VARIANT_CLASSES`**

Abrir `resources/js/Components/UI/Button.jsx`. Localizar o objeto `VARIANT_CLASSES` e adicionar a chave `soft` após `ghost`:

```jsx
const VARIANT_CLASSES = {
  primary:
    'bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-500 border-transparent',
  secondary:
    'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border-transparent',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-700',
  soft:
    'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 focus:ring-teal-500 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-900/50',
};
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Saída esperada: `✓ built in X.XXs` sem erros.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Components/UI/Button.jsx
git commit -m "design: add soft button variant"
```

---

## Task 2: EmptyState.jsx — design centrado com ícone

**Files:**
- Modify: `resources/js/Components/UI/EmptyState.jsx`

- [ ] **Step 1: Reescrever o componente**

Substituir o conteúdo inteiro de `resources/js/Components/UI/EmptyState.jsx` por:

```jsx
import React from 'react';

export default function EmptyState({ icon = null, title, description = null, action = null, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

**Nota:** a prop `description` já existia (usada em poucos lugares). A prop `icon` é nova e opcional — sem `icon` o componente renderiza apenas texto centrado, compatível com todas as chamadas existentes.

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sem erros. Verificar que os usos existentes de `<EmptyState title="..." />` ainda compilam.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Components/UI/EmptyState.jsx
git commit -m "design: rewrite EmptyState with centered icon layout"
```

---

## Task 3: PageHeader.jsx — ícone opcional + título maior

**Files:**
- Modify: `resources/js/Components/UI/PageHeader.jsx`

- [ ] **Step 1: Reescrever o componente**

Substituir o conteúdo inteiro de `resources/js/Components/UI/PageHeader.jsx` por:

```jsx
import React from 'react';

export default function PageHeader({ title, subtitle = null, actions = null, icon = null }) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 mb-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
            {icon}
          </div>
        ) : (
          <div className="h-9 w-1 shrink-0 rounded-full bg-teal-500" />
        )}
        <div>
          <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

**Nota:** sem `icon`, mantém a thin line teal — retrocompatível com todos os usos existentes. Com `icon` (JSX element), exibe o círculo.

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Components/UI/PageHeader.jsx
git commit -m "design: add icon prop to PageHeader, increase title to text-2xl"
```

---

## Task 4: AuthenticatedLayout.jsx — SideLink active state light

**Files:**
- Modify: `resources/js/Layouts/AuthenticatedLayout.jsx`

O objetivo é mudar o active state do `SideLink` de fundo teal escuro (branco) para fundo teal claro (texto teal), ficando mais elegante e menos pesado.

- [ ] **Step 1: Atualizar o componente `SideLink`**

Localizar o componente `SideLink` (linha ~144) e substituir por:

```jsx
const SideLink = ({ href, active, label, icon }) => (
  <Link
    href={href}
    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
      active
        ? 'border-l-4 border-teal-600 bg-teal-50 pl-2.5 font-semibold text-teal-700 dark:border-teal-500 dark:bg-teal-900/30 dark:text-teal-400'
        : 'border-l-4 border-transparent font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
    }`}
  >
    {icon && (
      <MenuIcon
        name={icon}
        className={`h-4 w-4 shrink-0 ${active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`}
      />
    )}
    <span>{label}</span>
  </Link>
);
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Layouts/AuthenticatedLayout.jsx
git commit -m "design: update SideLink active state to light teal style"
```

---

## Task 5: Admin/Clients.jsx — zebra table + EmptyState com ícone

**Files:**
- Modify: `resources/js/Pages/Admin/Clients.jsx`

- [ ] **Step 1: Adicionar zebra striping nas linhas da tabela**

Localizar o `.map()` sobre `clientsList` no `<tbody>`. Alterar de:

```jsx
{clientsList.map((client) => (
  <tr key={client.id} className="transition hover:bg-gray-50/70 dark:hover:bg-gray-700/40">
```

Para (adicionar `index` e zebra):

```jsx
{clientsList.map((client, index) => (
  <tr
    key={client.id}
    className={`transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
      index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
    }`}
  >
```

- [ ] **Step 2: Atualizar o EmptyState com ícone de usuários**

Localizar onde `EmptyState` é renderizado na página. Atualizar para passar um ícone:

```jsx
<EmptyState
  icon={
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 19.5a5 5 0 0 1 10 0M13 19.5a4 4 0 0 1 8 0" />
    </svg>
  }
  title="Nenhum cliente cadastrado ainda."
  description="Clique em 'Novo Cliente' para adicionar o primeiro."
/>
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Admin/Clients.jsx
git commit -m "design: add zebra striping and icon empty state to Clients"
```

---

## Task 6: Admin/Agenda.jsx — zebra table

**Files:**
- Modify: `resources/js/Pages/Admin/Agenda.jsx`

- [ ] **Step 1: Ler o arquivo e localizar o tbody map**

```bash
# Localizar onde o map de linhas ocorre
grep -n "\.map(" resources/js/Pages/Admin/Agenda.jsx
```

- [ ] **Step 2: Adicionar zebra striping**

Localizar o `.map()` principal sobre os dados do tbody. Adicionar `index` como segundo parâmetro e aplicar:

```jsx
{dados.map((item, index) => (
  <tr
    key={item.id}
    className={`transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
      index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
    }`}
  >
```

Substituir `dados` pelo nome real do array usado no arquivo.

- [ ] **Step 3: Atualizar header da tabela** (se ainda usa `hover:bg-gray-50`)

Trocar qualquer `hover:bg-gray-50` nas linhas do tbody por `hover:bg-teal-50/20 dark:hover:bg-teal-900/10`.

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Admin/Agenda.jsx
git commit -m "design: add zebra striping to Agenda table"
```

---

## Task 7: Admin/Timeslots/Index.jsx + TimeslotsTable — zebra

**Files:**
- Modify: `resources/js/Pages/Admin/Timeslots/Index.jsx`
- Verify/Modify: `resources/js/Pages/Admin/Timeslots/Partials/TimeslotsTable.jsx`

- [ ] **Step 1: Ler TimeslotsTable.jsx**

Abrir `resources/js/Pages/Admin/Timeslots/Partials/TimeslotsTable.jsx` e localizar o `.map()` das linhas.

- [ ] **Step 2: Adicionar zebra no TimeslotsTable**

Localizar o map de linhas e adicionar `index`:

```jsx
{timeslots.map((slot, index) => (
  <tr
    key={slot.id}
    className={`transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
      index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
    }`}
  >
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Admin/Timeslots/Partials/TimeslotsTable.jsx
git commit -m "design: add zebra striping to TimeslotsTable"
```

---

## Task 8: Admin/Freights — zebra na FreightsTable

**Files:**
- Verify/Modify: `resources/js/Pages/Admin/Freights/Partials/FreightsTable.jsx`

- [ ] **Step 1: Ler FreightsTable.jsx**

Abrir `resources/js/Pages/Admin/Freights/Partials/FreightsTable.jsx` e localizar o `.map()` das linhas.

- [ ] **Step 2: Adicionar zebra**

```jsx
{freights.map((freight, index) => (
  <tr
    key={freight.id}
    className={`transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
      index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
    }`}
  >
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Admin/Freights/Partials/FreightsTable.jsx
git commit -m "design: add zebra striping to FreightsTable"
```

---

## Task 9: Client/Trucks.jsx — EmptyState com ícone de caminhão

**Files:**
- Modify: `resources/js/Pages/Client/Trucks.jsx`

- [ ] **Step 1: Atualizar EmptyState com ícone de caminhão**

Localizar onde `EmptyState` é usado dentro do `div.p-8`. Substituir por:

```jsx
<EmptyState
  icon={
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h10v7H3V7Zm10 2h3l3 3v2h-6V9Zm-6 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  }
  title="Nenhum caminhão cadastrado ainda."
  description="Adicione um caminhão para começar a fazer reservas."
/>
```

- [ ] **Step 2: Adicionar zebra striping na tabela**

Localizar o `.map()` sobre `trucksList` no tbody. Adicionar `index`:

```jsx
{trucksList.map((truck, index) => (
  <tr
    key={truck.id}
    className={`transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
      index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
    }`}
  >
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Client/Trucks.jsx
git commit -m "design: add icon empty state and zebra to Trucks"
```

---

## Task 10: Client/Drivers.jsx — EmptyState com ícone de motorista

**Files:**
- Modify: `resources/js/Pages/Client/Drivers.jsx`

- [ ] **Step 1: Atualizar EmptyState com ícone de motorista**

```jsx
<EmptyState
  icon={
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  }
  title="Nenhum motorista cadastrado ainda."
  description="Cadastre motoristas para vinculá-los às suas reservas."
/>
```

- [ ] **Step 2: Adicionar zebra striping**

```jsx
{driversList.map((driver, index) => (
  <tr
    key={driver.id}
    className={`transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
      index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
    }`}
  >
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Client/Drivers.jsx
git commit -m "design: add icon empty state and zebra to Drivers"
```

---

## Task 11: Client/MyReservations.jsx — zebra table

**Files:**
- Modify: `resources/js/Pages/Client/MyReservations.jsx`

- [ ] **Step 1: Adicionar zebra striping**

Localizar o `.map()` sobre `freights` no tbody. Adicionar `index`:

```jsx
{freights.map((freight, index) => (
  <tr
    key={freight.id}
    className={`align-top transition hover:bg-teal-50/20 dark:hover:bg-teal-900/10 ${
      index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''
    }`}
  >
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Client/MyReservations.jsx
git commit -m "design: add zebra striping to MyReservations table"
```

---

## Task 12: TimeslotForm.jsx — inputClass teal focus

**Files:**
- Modify: `resources/js/Pages/Admin/Timeslots/Partials/TimeslotForm.jsx`

- [ ] **Step 1: Verificar se o arquivo usa inputClass ou FormField**

Abrir `resources/js/Pages/Admin/Timeslots/Partials/TimeslotForm.jsx`. Se usa `FormField`, pular para Step 3. Se usa `inputClass` inline, continuar.

- [ ] **Step 2: Atualizar inputClass (se presente)**

Localizar qualquer `inputClass` ou string de classes com `focus:border-blue-500` e substituir pelo padrão teal:

```js
const inputClass = 'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Admin/Timeslots/Partials/TimeslotForm.jsx
git commit -m "design: update input focus ring to teal in TimeslotForm"
```

---

## Task 13: Admin/Dashboard.jsx — stat cards com labels uppercase

**Files:**
- Modify: `resources/js/Pages/Admin/Dashboard.jsx`

- [ ] **Step 1: Ler o arquivo e localizar o StatCard local**

Abrir `resources/js/Pages/Admin/Dashboard.jsx`. Localizar a função `StatCard` definida localmente no arquivo.

- [ ] **Step 2: Atualizar o StatCard**

Substituir o `StatCard` local por:

```jsx
function StatCard({ label, value, color, accent, icon, iconBg }) {
  return (
    <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm dark:bg-gray-800 ${accent || 'border-gray-300'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
          <p className={`mt-2 text-3xl font-black ${color || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
        </div>
        {icon && iconBg && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar se os usos de StatCard no Dashboard têm as props corretas**

Verificar que os `<StatCard>` no `return` do componente passam `color` e `accent` como strings (não objeto). Se ainda usam `color="gray"` (string de mapeamento antigo), atualizar para as props diretas:

```jsx
<StatCard
  label="Horários anunciados"
  value={stats?.total_timeslots ?? 0}
  color="text-gray-900 dark:text-gray-100"
  accent="border-gray-300 dark:border-gray-600"
/>
<StatCard
  label="Disponíveis"
  value={stats?.available_timeslots ?? 0}
  color="text-emerald-700 dark:text-emerald-400"
  accent="border-emerald-400 dark:border-emerald-600"
/>
<StatCard
  label="Reservados"
  value={stats?.reserved_timeslots ?? 0}
  color="text-sky-700 dark:text-sky-400"
  accent="border-sky-400 dark:border-sky-600"
/>
<StatCard
  label="Lotados"
  value={stats?.full_timeslots ?? 0}
  color="text-amber-700 dark:text-amber-400"
  accent="border-amber-400 dark:border-amber-600"
/>
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add resources/js/Pages/Admin/Dashboard.jsx
git commit -m "design: update Admin Dashboard stat cards with labels uppercase and font-black values"
```

---

## Task 14: Client/Dashboard.jsx — labels uppercase nos stat cards

**Files:**
- Modify: `resources/js/Pages/Client/Dashboard.jsx`

- [ ] **Step 1: Atualizar o StatCard do Client Dashboard**

Abrir `resources/js/Pages/Client/Dashboard.jsx`. Localizar o `StatCard` local e atualizar o label para usar `uppercase tracking-wide`:

```jsx
function StatCard({ label, value, color, accent, icon, iconBg }) {
  return (
    <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm dark:bg-gray-800 ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
          <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}
```

A principal mudança é:
- `text-xs font-medium` → `text-xs font-semibold uppercase tracking-wide`
- `text-3xl font-bold` → `text-3xl font-black`
- `rounded-lg` → `rounded-xl`

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add resources/js/Pages/Client/Dashboard.jsx
git commit -m "design: update Client Dashboard stat cards with uppercase labels and font-black"
```

---

## Task 15: Client/AvailableSlots/Partials/TimeslotCard.jsx — selected state mais forte

**Files:**
- Modify: `resources/js/Pages/Client/AvailableSlots/Partials/TimeslotCard.jsx`

- [ ] **Step 1: Fortalecer o selected state do card**

Localizar o `className` do elemento `<article>`:

```jsx
// DE:
selected ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-400'
         : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'

// PARA:
selected ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100 dark:bg-teal-900/20 dark:border-teal-400 dark:shadow-none'
         : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 hover:shadow-sm dark:hover:border-teal-700'
```

- [ ] **Step 2: Adicionar um indicador visual no header do card quando selected**

Localizar o `<div className="mb-3 flex items-start justify-between gap-3">` e adicionar um badge de "Selecionado" quando `selected`:

```jsx
<div className="mb-3 flex items-start justify-between gap-3">
  <div>
    {/* conteúdo existente de data/hora */}
  </div>
  <div className="flex flex-col items-end gap-1">
    {selected && (
      <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-semibold text-white">
        ✓ Selecionado
      </span>
    )}
    {/* badges existentes de operation_type e modelo */}
  </div>
</div>
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Client/AvailableSlots/Partials/TimeslotCard.jsx
git commit -m "design: strengthen TimeslotCard selected state with shadow and badge"
```

---

## Task 16: ReservationForm.jsx — inputClass teal

**Files:**
- Modify: `resources/js/Pages/Client/AvailableSlots/Partials/ReservationForm.jsx`

- [ ] **Step 1: Ler o arquivo e verificar se usa inputClass**

Abrir o arquivo e verificar se existe `inputClass` ou `focus:border-blue-500` no código.

- [ ] **Step 2: Substituir se necessário**

Se existir `focus:border-blue-500` ou `focus:ring-blue-`:

Substituir por: `focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none`

Ou se houver uma constante `inputClass`, substituí-la por:

```js
const inputClass = 'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

- [ ] **Step 4: Commit (se houve mudança)**

```bash
git add resources/js/Pages/Client/AvailableSlots/Partials/ReservationForm.jsx
git commit -m "design: update input focus ring to teal in ReservationForm"
```

---

## Task 17: Verificação Final

- [ ] **Step 1: Build final limpo**

```bash
npm run build
```

Esperado: `✓ built in X.XXs` sem nenhum erro ou warning de JSX.

- [ ] **Step 2: Commit de fechamento (se necessário)**

Se houver arquivos não commitados:

```bash
git status
git add -A
git commit -m "design: complete visual identity lift - phase 1 foundation + all pages"
```

- [ ] **Step 3: Checklist visual (verificar no browser)**

Navegar pelas páginas e confirmar:
- [ ] Sidebar: active state mostra fundo teal claro + borda esquerda grossa + texto teal
- [ ] PageHeader: título maior (`text-2xl`) em todas as páginas
- [ ] Tabelas: linhas alternadas com fundo levemente cinza, hover teal sutil
- [ ] EmptyState: ícone centralizado em círculo cinza (em Trucks e Drivers)
- [ ] Stat cards: números com `font-black`, labels em uppercase
- [ ] Botão soft (se usado): fundo teal claro, texto teal, borda teal

---

## Ordem de Execução Recomendada

Execute as tasks nesta ordem — cada uma produz um build limpo:

```
Task 1  → Button (soft variant)
Task 2  → EmptyState (icon)
Task 3  → PageHeader (icon + 2xl)
Task 4  → AuthenticatedLayout (SideLink)
Task 5  → Admin/Clients
Task 6  → Admin/Agenda
Task 7  → Admin/Timeslots (TimeslotsTable)
Task 8  → Admin/Freights (FreightsTable)
Task 9  → Client/Trucks
Task 10 → Client/Drivers
Task 11 → Client/MyReservations
Task 12 → Admin/TimeslotForm
Task 13 → Admin/Dashboard
Task 14 → Client/Dashboard
Task 15 → TimeslotCard
Task 16 → ReservationForm
Task 17 → Verificação Final
```
