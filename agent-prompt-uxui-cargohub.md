Você está trabalhando no projeto CargoHub (freight-management). Stack: Laravel 12, Inertia.js, React 18, Tailwind CSS v3. Não instale nenhuma biblioteca nova. Não altere nenhum arquivo PHP. Não altere rotas. Ao final rode `npm run build` e confirme que não há erros.

Execute os passos abaixo na ordem exata.

---

## PASSO 1 — Criar componente Button

Crie `resources/js/Components/UI/Button.jsx`:

```jsx
import React from 'react';

const variants = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-300',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  children,
  className = '',
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
```

---

## PASSO 2 — Substituir cor primária de blue-600 para teal-700

Nos arquivos abaixo, substitua todas as ocorrências de `bg-blue-600` por `bg-teal-700` e `hover:bg-blue-700` por `hover:bg-teal-800`. Também substitua `text-blue-600` em checkboxes por `text-teal-700`.

Arquivos:
- `resources/js/Pages/Admin/Clients.jsx`
- `resources/js/Pages/Admin/DropoffAddresses.jsx`
- `resources/js/Pages/Platform/CompanyInstance.jsx`
- `resources/js/Pages/Client/MyReservations.jsx` — somente o botão "Reabrir"; mantenha `bg-red-600` no botão "Cancelar" e mantenha `text-blue-600` nos links de documento (Nota Fiscal, Anexo Admin)

---

## PASSO 3 — Padronizar espaçamento vertical para py-8

Nos arquivos abaixo, localize o `<div className="py-12">` que envolve o conteúdo principal da página e troque por `py-8`:

- `resources/js/Pages/Admin/Clients.jsx`
- `resources/js/Pages/Admin/DropoffAddresses.jsx`
- `resources/js/Pages/Admin/Freights/Index.jsx`
- `resources/js/Pages/Client/MyReservations.jsx`
- `resources/js/Pages/Client/Trucks.jsx`
- `resources/js/Pages/Dashboard.jsx`

---

## PASSO 4 — Criar ConfirmModal e substituir window.confirm

Crie `resources/js/Components/UI/ConfirmModal.jsx`:

```jsx
import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, message: '', title: '' });
  const resolveRef = useRef(null);

  const confirm = useCallback((message, title = 'Confirmar ação') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, message, title });
    });
  }, []);

  const handleConfirm = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">{state.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{state.message}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
  return ctx;
}
```

Em `resources/js/Layouts/AuthenticatedLayout.jsx`:
1. Adicione o import: `import { ConfirmProvider } from '@/Components/UI/ConfirmModal';`
2. Envolva todo o conteúdo do `return` com `<ConfirmProvider>...</ConfirmProvider>`

Nos arquivos abaixo, substitua o padrão síncrono `if (confirmAction('...')) { router... }` pelo padrão assíncrono com `useConfirm`. Para cada arquivo: adicione `import { useConfirm } from '@/Components/UI/ConfirmModal';`, declare `const confirm = useConfirm();` no corpo do componente, e converta os handlers para `async`:

- `resources/js/Pages/Admin/Clients.jsx` — função `deleteClient`
- `resources/js/Pages/Admin/DropoffAddresses.jsx` — função `deleteAddress`
- `resources/js/Pages/Client/Trucks.jsx` — função `deleteTruck`
- `resources/js/Pages/Client/MyReservations.jsx` — handlers de cancelar e reabrir reserva (inline nos `onClick`)
- `resources/js/Pages/Admin/Freights/Partials/FreightActionsAdmin.jsx` — qualquer handler que use `confirmAction`
- `resources/js/Pages/Platform/Companies.jsx` — handler de excluir empresa

Padrão de conversão:
```js
// ANTES
const deleteClient = (id) => {
  if (confirmAction('Tem certeza que deseja excluir este cliente?')) {
    router.delete(route('clients.destroy', id), { preserveScroll: true });
  }
};

// DEPOIS
const deleteClient = async (id) => {
  const ok = await confirm('Tem certeza que deseja excluir este cliente?');
  if (ok) {
    router.delete(route('clients.destroy', id), { preserveScroll: true });
  }
};
```

Após converter todos os usos, atualize `resources/js/Components/UI/confirmAction.js` para:
```js
// @deprecated — use useConfirm() de ConfirmModal.jsx
export function confirmAction(message) {
  console.warn('[deprecated] confirmAction: use useConfirm() do ConfirmModal');
  return window.confirm(message);
}
```

---

## PASSO 5 — Reescrever ModalShell

Substitua o conteúdo de `resources/js/Components/UI/ModalShell.jsx` por:

```jsx
import React, { useEffect, useRef } from 'react';

export default function ModalShell({
  show,
  title,
  onClose,
  children,
  footer = null,
  maxWidthClass = 'max-w-md',
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    const firstFocusable = panelRef.current?.querySelector(
      'input, textarea, select, button:not([disabled])'
    );
    firstFocusable?.focus();
    return () => document.removeEventListener('keydown', onEsc);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className={`w-full rounded-lg bg-white shadow-xl ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 id="modal-title" className="text-base font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
```

---

## PASSO 6 — Reescrever FlashMessages com auto-dismiss

Substitua o conteúdo de `resources/js/Components/UI/FlashMessages.jsx` por:

```jsx
import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

function Alert({ type, message }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };

  return (
    <div className={`mb-3 flex items-start justify-between gap-3 rounded border p-3 text-sm ${styles[type]}`}>
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="mt-0.5 shrink-0 opacity-60 hover:opacity-100 transition"
        aria-label="Fechar mensagem"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export default function FlashMessages({ flash = null, className = 'mb-4' }) {
  const { flash: pageFlash = {} } = usePage().props;
  const f = flash || pageFlash;

  if (!f?.success && !f?.error && !f?.info) return null;

  return (
    <div className={className}>
      {f.error && <Alert type="error" message={f.error} />}
      {f.success && <Alert type="success" message={f.success} />}
      {f.info && <Alert type="info" message={f.info} />}
    </div>
  );
}
```

---

## PASSO 7 — Centralizar StatusBadge no Agenda.jsx

Abra `resources/js/Pages/Admin/Agenda.jsx`.

1. Adicione o import: `import StatusBadge from '@/Components/UI/StatusBadge';`

2. Remova a função `statusPill` inteira.

3. Adicione no topo do componente (antes do return) as funções auxiliares:
```js
const traduzirStatusTimeslot = (s) =>
  ({ available: 'Disponível', full: 'Lotado', closed: 'Fechado' }[s] || s);

const traduzirStatusFrete = (s) =>
  ({ approved: 'Aprovado', pending: 'Pendente', completed: 'Finalizado', cancelled: 'Cancelado' }[s] || s);

const toneTimeslot = (s) =>
  ({ available: 'success', full: 'warning', closed: 'danger' }[s] || 'neutral');

const toneFrete = (s) =>
  ({ approved: 'info', pending: 'warning', completed: 'success', cancelled: 'danger' }[s] || 'neutral');
```

4. Substitua todas as chamadas `<span className={statusPill(algumStatus)}>texto</span>` por `<StatusBadge label={traduzirStatus...(algumStatus)} tone={tone...(algumStatus)} />` usando as funções corretas conforme o contexto (timeslot ou frete).

---

## PASSO 8 — Aplicar PageHeader nas páginas que ainda usam h2 direto

Em `resources/js/Pages/Admin/Dashboard.jsx`:
- Adicione `import PageHeader from '@/Components/UI/PageHeader';`
- Substitua `header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Painel do Administrador</h2>}` por `header={<PageHeader title="Painel do Administrador" subtitle="Visão geral da operação" />}`

Em `resources/js/Pages/Client/Dashboard.jsx`:
- Adicione `import PageHeader from '@/Components/UI/PageHeader';`
- Substitua `header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Painel do Cliente</h2>}` por `header={<PageHeader title="Painel do Cliente" subtitle="Suas reservas e atividades" />}`

Em `resources/js/Pages/Admin/Agenda.jsx`:
- Adicione `import PageHeader from '@/Components/UI/PageHeader';` (se já não existir)
- Substitua `header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Agenda</h2>}` por `header={<PageHeader title="Agenda" subtitle="Horários anunciados e reservas por dia" />}`

Em `resources/js/Pages/Dashboard.jsx`:
- Substitua o conteúdo inteiro por:
```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
  return (
    <AuthenticatedLayout header={<PageHeader title="Redirecionando..." />}>
      <Head title="Redirecionando" />
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">Aguarde...</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
```

---

## PASSO 9 — Compactar header da sidebar

Em `resources/js/Layouts/AuthenticatedLayout.jsx`, localize o bloco `SIDEBAR DESKTOP` e faça as substituições:

- `className="h-28 w-auto object-contain"` → `className="h-12 w-auto object-contain"`
- `className="h-14 w-auto fill-current text-gray-800"` → `className="h-8 w-auto fill-current text-gray-800"`
- No `div` do header da sidebar: `className="border-b border-gray-200 p-6"` → `className="border-b border-gray-200 p-4"`
- `<div className="mt-4">` (bloco de nome/role logo abaixo da logo) → `<div className="mt-3">`

---

## PASSO 10 — Melhorar botão de menu mobile

Em `resources/js/Layouts/AuthenticatedLayout.jsx`, localize o bloco `Top bar mobile` e substitua o botão "Menu" por:

```jsx
<button
  type="button"
  onClick={() => setShowMobileMenu((state) => !state)}
  className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
  aria-label={showMobileMenu ? 'Fechar menu' : 'Abrir menu'}
>
  {showMobileMenu ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  )}
</button>
```

No bloco `{showMobileMenu && (...)}`, substitua o mapeamento de links existente por um que use o mesmo componente `SideLink` da sidebar desktop, mais os links de Perfil e Sair:

```jsx
{showMobileMenu && (
  <div className="mt-3 space-y-1 border-t border-gray-200 pt-3">
    {mainLinks.map((link) => (
      <SideLink key={link.label} {...link} />
    ))}
    <div className="mt-2 border-t border-gray-200 pt-2">
      <Link
        href={route('profile.edit')}
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        onClick={() => setShowMobileMenu(false)}
      >
        Perfil
      </Link>
      <Link
        href={route('logout')}
        method="post"
        as="button"
        className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
        onClick={() => setShowMobileMenu(false)}
      >
        Sair
      </Link>
    </div>
  </div>
)}
```

---

## PASSO 11 — Melhorar cards dos dashboards Admin e Client

Em `resources/js/Pages/Admin/Dashboard.jsx`, adicione o componente local `StatCard` antes do `export default`:

```jsx
function StatCard({ label, value, color }) {
  const border = {
    gray: 'border-gray-400',
    green: 'border-green-500',
    blue: 'border-blue-500',
    orange: 'border-orange-500',
    red: 'border-red-500',
  }[color] || 'border-gray-400';

  const text = {
    gray: 'text-gray-900',
    green: 'text-green-700',
    blue: 'text-blue-700',
    orange: 'text-orange-600',
    red: 'text-red-700',
  }[color] || 'text-gray-900';

  return (
    <div className={`rounded-lg border-l-4 bg-white p-5 shadow-sm ${border}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${text}`}>{value}</p>
    </div>
  );
}
```

Substitua os quatro cards de métricas do Admin por:
```jsx
<StatCard label="Horários anunciados" value={stats?.total_timeslots ?? 0} color="gray" />
<StatCard label="Disponíveis" value={stats?.available_timeslots ?? 0} color="green" />
<StatCard label="Reservados" value={stats?.reserved_timeslots ?? 0} color="blue" />
<StatCard label="Lotados" value={stats?.full_timeslots ?? 0} color="orange" />
```

Aplique o mesmo `StatCard` em `resources/js/Pages/Client/Dashboard.jsx` com os quatro cards do cliente:
```jsx
<StatCard label="Minhas solicitações" value={stats?.total_my_freights ?? 0} color="gray" />
<StatCard label="Carregando" value={stats?.loading_my_freights ?? 0} color="orange" />
<StatCard label="Descarregando" value={stats?.unloading_my_freights ?? 0} color="blue" />
<StatCard label="Concluídas" value={stats?.completed_my_freights ?? 0} color="green" />
```

Nos dois dashboards, atualize os cards de ação rápida (Links de navegação) adicionando `ring-1 ring-gray-100 hover:ring-teal-200`:
```jsx
// ANTES
className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50"

// DEPOIS
className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:bg-gray-50 hover:ring-teal-200"
```

---

## PASSO 12 — Corrigir roundness excessivo no CompanyInstance

Em `resources/js/Pages/Platform/CompanyInstance.jsx`, substitua todas as ocorrências:
- `rounded-3xl` → `rounded-xl`
- `rounded-2xl` → `rounded-lg`

---

## PASSO 13 — Padronizar tabela MyReservations

Em `resources/js/Pages/Client/MyReservations.jsx`:

1. Substitua o wrapper da tabela:
```jsx
// ANTES
<div className="overflow-x-auto rounded-lg bg-white p-4 shadow sm:p-8">

// DEPOIS
<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
```

2. Substitua o `<thead>`:
```jsx
<thead className="bg-gray-50">
  <tr>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Horário</th>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Caminhão / Placa</th>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Operação</th>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Pesos</th>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Anexos</th>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Observações</th>
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Ações</th>
  </tr>
</thead>
```

3. Em cada `<tr>` do `<tbody>`:
```jsx
// ANTES
<tr key={freight.id} className="align-top hover:bg-gray-50">
  <td className="py-2">

// DEPOIS
<tr key={freight.id} className="align-top transition hover:bg-gray-50/70">
  <td className="px-4 py-4 align-top text-sm">
```
Aplique `px-4 py-4 align-top text-sm` em todos os `<td>` da linha.

4. Substitua a tradução hardcoded de `operation_type`:
```jsx
// ANTES
{freight.operation_type === 'load' ? 'Carga' : 'Descarga'}

// DEPOIS — adicione o import no topo do arquivo se ainda não existir:
import { translateOperationType } from '@/Features/Freight/utils/freightPresentation';
// e use:
{translateOperationType(freight.operation_type)}
```

---

## PASSO 14 — Migrar botões de submit dos modais para o componente Button

Nos arquivos abaixo, localize os botões dentro dos `ModalShell` e substitua pelas chamadas ao componente `Button`. Adicione o import `import Button from '@/Components/UI/Button';` em cada arquivo.

Em `resources/js/Pages/Admin/Clients.jsx` — botões do modal de criar/editar cliente:
```jsx
// ANTES
<button type="button" onClick={resetForm} className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">Cancelar</button>
<button type="submit" disabled={processing} className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">{isEditing ? 'Atualizar' : 'Criar'}</button>

// DEPOIS
<Button variant="secondary" onClick={resetForm} className="flex-1">Cancelar</Button>
<Button type="submit" disabled={processing} className="flex-1">{isEditing ? 'Atualizar' : 'Criar'}</Button>
```

Em `resources/js/Pages/Admin/DropoffAddresses.jsx` — mesma substituição nos botões do modal.

Em `resources/js/Pages/Platform/Companies.jsx` — substitua o botão de submit do formulário de empresa por `<Button type="submit" disabled={processing}>` com variante `primary`.

---

## PASSO 15 — Build final

Execute:
```
npm run build
```

Confirme que não há erros de compilação. Se houver erros de import ou de JSX, corrija antes de finalizar.
