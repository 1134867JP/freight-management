# CargoHub — Visual Identity Lift Design Spec
**Data:** 2026-05-13
**Objetivo:** Transformar o sistema de um CRUD genérico em um produto SaaS B2B com identidade visual profissional, sem alterar rotas, lógica de negócio ou arquitetura de componentes.
**Abordagem:** Option 1 — Visual Identity Lift (estilo Stripe/Linear light)

---

## Contexto

O CargoHub já possui um design system funcional (tokens, componentes, dark mode). O problema é que a execução atual parece genérica — tipografia fraca, cor de marca usada com timidez, tabelas sem personalidade, navegação sem hierarquia clara.

Este spec define as mudanças visuais para elevar a percepção de qualidade sem tocar em lógica de negócio.

---

## Princípios do Redesign

1. **Teal como identidade** — não só em botões. Sidebar ativa, ícones de page header, zebra hover em tabelas.
2. **Hierarquia tipográfica forte** — títulos maiores, labels em uppercase tracking, valores numéricos com `font-black`.
3. **Densidade intencional** — tabelas densas são boas. O problema é a ausência de ritmo visual, não a quantidade de dados.
4. **Componentes com variantes claras** — cada componente sabe o que é: stat card, content card, action button, soft button.
5. **Sem nova biblioteca** — 100% Tailwind + React, sem instalar pacotes.

---

## Seção 1 — AuthenticatedLayout (Sidebar)

### Estrutura atual
Lista plana de links sem agrupamento. Active state com bg genérico. Logo area sem destaque.

### Mudanças

**Agrupamento de links com labels de seção:**
```
Admin sidebar:
  OPERAÇÕES
    Dashboard
    Agenda
    Fretes
    Timeslots
  GESTÃO
    Clientes
    Endereços
  SISTEMA
    Configurações

Client sidebar:
  MENU
    Dashboard
    Cotas Disponíveis
    Minhas Reservas
  VEÍCULOS
    Caminhões
    Motoristas

Platform Admin sidebar:
  PLATAFORMA
    Empresas
    WhatsApp
```

**Active state:**
- `border-l-4 border-teal-600 bg-teal-50 text-teal-700 font-semibold`
- Ícone: `text-teal-600`

**Inactive state:**
- `text-gray-600 hover:bg-gray-50 hover:text-gray-900`
- Ícone: `text-gray-400`

**Section labels:**
- `text-xs font-semibold uppercase tracking-widest text-gray-400 px-4 mb-1 mt-5`
- Primeiro grupo sem `mt-5`

**Logo area:**
- Padding: `px-4 py-5` (de `px-4 py-4`)
- Divisor: `border-b border-gray-100` mais visível
- Nome do sistema/empresa com `font-bold text-gray-900`

**Regra de não-mudança:** não alterar rotas, não remover links, não alterar lógica de `showMobileMenu`.

---

## Seção 2 — PageHeader Component

### Mudanças

**Ícone opcional:**
- `iconName` prop (string) → renderiza círculo `w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center` com SVG inline
- SVGs predefinidos para cada contexto: dashboard, timeslot, freight, client, truck, driver, calendar

**Tipografia:**
- Título: `text-2xl font-bold text-gray-900 dark:text-gray-100` (de `text-xl font-semibold`)
- Subtítulo: `text-sm text-gray-500 dark:text-gray-400 mt-0.5`

**Layout:**
```jsx
<div className="flex items-center gap-4">
  {icon && <IconCircle />}
  <div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
</div>
{actions && <div className="ml-auto flex items-center gap-3">{actions}</div>}
```

---

## Seção 3 — Tabelas

### Padrão aplicado a todas as tabelas do sistema

**Header:**
```jsx
<thead className="border-b-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
```

**Body rows:**
```jsx
// Par (índice even): bg-white
// Ímpar (índice odd): bg-gray-50/50
<tr className={`transition ${index % 2 === 1 ? 'bg-gray-50/60 dark:bg-gray-800/40' : ''} hover:bg-teal-50/20 dark:hover:bg-teal-900/10`}>
```

**Coluna primária (primeira):**
- `font-semibold text-gray-900 dark:text-gray-100`

**Colunas secundárias:**
- `text-sm text-gray-600 dark:text-gray-400`

**Coluna de ações:**
- `text-right` no `<th>` e `<td>`

**Nota:** zebra striping é feito via `index` no `.map()`, não via CSS `odd:` do Tailwind (para evitar conflito com `divide-y`).

---

## Seção 4 — Stat Cards

### Padrão unificado

```jsx
function StatCard({ label, value, color, accent, icon, iconBg }) {
  return (
    <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm dark:bg-gray-800 ${accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</p>
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

**Mapeamento semântico de cores:**
- Total/neutro: `border-gray-300`, `text-gray-900`, `bg-gray-100 text-gray-500`
- Sucesso/disponível: `border-emerald-400`, `text-emerald-700`, `bg-emerald-50 text-emerald-600`
- Info/reservado: `border-sky-400`, `text-sky-700`, `bg-sky-50 text-sky-600`
- Aviso/pendente: `border-amber-400`, `text-amber-700`, `bg-amber-50 text-amber-600`
- Perigo/cancelado: `border-red-400`, `text-red-700`, `bg-red-50 text-red-600`
- Marca/teal: `border-teal-400`, `text-teal-700`, `bg-teal-50 text-teal-600`

---

## Seção 5 — Button Component

### Variantes

```
primary:   bg-teal-700 text-white hover:bg-teal-800
secondary: bg-white border border-gray-200 text-gray-700 hover:bg-gray-50
soft:      bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100   ← NOVA
danger:    bg-red-600 text-white hover:bg-red-700
ghost:     bg-transparent text-gray-600 hover:bg-gray-100
```

### Tamanhos

```
sm:  px-3 py-1.5 text-xs rounded-md
md:  px-4 py-2 text-sm rounded-lg     ← default
lg:  px-5 py-2.5 text-base rounded-lg
```

### Com ícone
- Sempre `gap-1.5` entre ícone e label
- Ícone: `h-4 w-4` para md, `h-3.5 w-3.5` para sm

---

## Seção 6 — StatusBadge

### Mudanças

- Shape: `rounded-full` (de `rounded`)
- Peso: `font-medium` (de `font-bold uppercase`)
- Não usar mais `uppercase tracking-wide` no badge — fica mais elegante
- Tamanho fixo: `px-2.5 py-0.5 text-xs`
- Dark mode em todos os tones: já existente, manter

---

## Seção 7 — EmptyState Component

### Mudanças

**Atual:** somente `<p>` com texto.

**Novo:**
```jsx
function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

**Ícones por contexto** (SVG inline, `h-8 w-8`):
- Fretes/reservas: caminhão
- Timeslots: calendário
- Clientes: pessoas
- Caminhões: caminhão com placa
- Motoristas: pessoa com círculo
- Genérico: caixa/inbox

---

## Seção 8 — Inputs & Formulários

**Border padrão:** `border-gray-200` (de `border-gray-300`) — mais suave

**Focus ring:**
```
focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none
```

**inputClass padrão unificado** (substituir em todos os arquivos):
```js
const inputClass = 'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100';
```

**Label:** `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5`

**Hint text:** `mt-1.5 text-xs text-gray-400 dark:text-gray-500`

**Erro:** `mt-1.5 text-xs text-red-600 dark:text-red-400`

---

## Páginas a Modificar

### Fundação (bloqueante — implementar primeiro)
| Arquivo | Mudanças |
|---------|----------|
| `AuthenticatedLayout.jsx` | Sidebar agrupada, active state teal, logo area |
| `Components/UI/PageHeader.jsx` | Ícone opcional, título 2xl |
| `Components/UI/EmptyState.jsx` | Ícone + subtítulo + action |
| `Components/UI/Button.jsx` | Variante `soft` |
| `Components/UI/StatusBadge.jsx` | `rounded-full`, `font-medium` |

### Admin
| Arquivo | Mudanças |
|---------|----------|
| `Admin/Dashboard.jsx` | Stat cards com ícone + zebra table |
| `Admin/Timeslots/Index.jsx` | Zebra table, inputs teal focus |
| `Admin/Freights/Index.jsx` | Zebra table, stat cards |
| `Admin/Clients.jsx` | Zebra table, empty state com ícone |
| `Admin/Agenda.jsx` | Labels de seção, table |

### Client
| Arquivo | Mudanças |
|---------|----------|
| `Client/Dashboard.jsx` | Labels uppercase nos stat cards |
| `Client/AvailableSlots/Index.jsx` | Layout ajustado |
| `Client/AvailableSlots/Partials/TimeslotCard.jsx` | Hover teal, selected state mais forte |
| `Client/MyReservations.jsx` | Zebra table |
| `Client/Trucks.jsx` | Empty state com ícone, zebra, inputClass teal |
| `Client/Drivers.jsx` | Empty state com ícone, zebra, inputClass teal |

### Formulários (inputClass unificado)
Substituir `inputClass` em todos os arquivos que têm formulários inline:
- `Client/Trucks.jsx`, `Client/Drivers.jsx`
- `Admin/Clients.jsx`, `Admin/DropoffAddresses.jsx`
- `Admin/Timeslots/Partials/TimeslotForm.jsx`
- `Client/AvailableSlots/Partials/ReservationForm.jsx`
- `Client/AvailableSlots/Partials/TruckQuickCreateModal.jsx`

---

## Restrições

- Não instalar nenhuma biblioteca nova
- Não alterar nenhum arquivo PHP
- Não alterar rotas
- Não remover funcionalidades
- Manter todos os dark mode variants
- Build deve passar sem erros ao final de cada fase

---

## Ordem de Implementação

**Fase 1 — Fundação** (componentes compartilhados)
1. `Button.jsx` — variante soft
2. `StatusBadge.jsx` — rounded-full, font-medium
3. `EmptyState.jsx` — ícone + subtítulo
4. `PageHeader.jsx` — ícone opcional, título 2xl
5. `AuthenticatedLayout.jsx` — sidebar agrupada

**Fase 2 — Admin Pages**
6. `Admin/Dashboard.jsx`
7. `Admin/Timeslots/Index.jsx`
8. `Admin/Freights/Index.jsx`
9. `Admin/Clients.jsx`
10. `Admin/Agenda.jsx`

**Fase 3 — Client Pages**
11. `Client/Dashboard.jsx`
12. `Client/AvailableSlots/Partials/TimeslotCard.jsx`
13. `Client/MyReservations.jsx`
14. `Client/Trucks.jsx`
15. `Client/Drivers.jsx`

**Ao final de cada fase:** `npm run build` deve passar sem erros.
