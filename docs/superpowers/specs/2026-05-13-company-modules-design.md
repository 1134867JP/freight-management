# Company Modules Feature Design

**Date:** 2026-05-13  
**Status:** Approved

## Context

Not every company using the platform has the same physical infrastructure. Some companies only need simple slot-based scheduling (cotas), while others also operate with queues/operation flow (gate check-in, freight status tracking, yard management) and/or with physical docks (docas). The system must support all combinations without forcing unused modules on companies.

## Modules

| Module | Flag | What it enables |
|---|---|---|
| Queues | `uses_queues` | Gate, freight status flow (arrived→loading→completed), YardBoard, YardMap, MoveOrders |
| Docks | `uses_docks` | Doca assignment to freights and timeslots, Docas management page |

## Valid Combinations

| `uses_queues` | `uses_docks` | Description |
|---|---|---|
| false | false | **Base** — cotas only: admin creates slots with capacity, clients book |
| true | false | Cotas + full operation flow, no dock assignment |
| false | true | Cotas + dock assignment, no operation status tracking |
| true | true | Full system (current default behavior) |

Both flags default to `true` — all existing companies keep current behavior.

## Architecture

### Database
Add two boolean columns to `companies` table:
```php
$table->boolean('uses_queues')->default(true);
$table->boolean('uses_docks')->default(true);
```

### Backend
- **Company model** (`app/Models/Company.php`): add to `$fillable`, add `usesQueues()` and `usesDocks()` helpers
- **HandleInertiaRequests** (`app/Http/Middleware/HandleInertiaRequests.php`): expose `auth.company.uses_queues` and `auth.company.uses_docks` to all Inertia pages
- **Platform CompaniesController**: accept and persist the two flags when creating/updating a company
- **Timeslot validation** (`StoreTimeslotRequest`/`UpdateTimeslotRequest`): when `uses_docks=false`, never require `doca_id`; remove `por_produto_doca` modelo option

### Frontend — Admin
- **AuthenticatedLayout** sidebar: hide `Docas`, `Zonas`, `Vagas`, `Cavalos` if `!uses_docks`; hide `Portaria`, `Painel do Pátio`, `Mapa do Pátio`, `Ordens de Movimentação` if `!uses_queues`
- **Timeslot form**: hide doca_id field and `por_produto_doca` modelo option if `!uses_docks`
- **Freight management**: hide dock assignment panel if `!uses_docks`; hide operation status actions if `!uses_queues`

### Frontend — Client
- **AvailableSlots**: hide dock info if `!uses_docks`
- **MyReservations**: hide doca column and operation status if `!uses_docks`/`!uses_queues`

### Frontend — Platform Admin
- **Companies.jsx** modal form: add "Módulos" section with two toggles for `uses_queues` and `uses_docks`

## Who Configures
Only the **platform admin** can enable/disable modules per company. Company admins see the effects but cannot change the configuration.
