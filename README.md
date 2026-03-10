# Freight Management

Sistema web para agendamento e operação de fretes com dois perfis:

- `admin`: gerencia horários (timeslots), clientes, endereços e operação dos fretes.
- `client`: cadastra caminhões, reserva horários e acompanha reservas.

## Stack

- Backend: `Laravel 12` + `PHP 8.2+`
- Frontend: `Inertia.js + React 18 + Vite`
- Estilo: `Tailwind CSS`
- Banco padrão local: `SQLite`

## Pré-requisitos

- `PHP 8.2` ou superior
- `Composer`
- `Node.js 20+`
- `npm`

## Setup rápido

No diretório do projeto, rode:

```bash
composer run setup
php artisan migrate --seed
php artisan storage:link
composer run dev
```

O comando `composer run dev` sobe em paralelo:

- servidor Laravel
- worker de fila (`queue:listen`)
- visualização de logs (`pail`)
- Vite em modo de desenvolvimento

## Setup manual (se preferir)

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm run dev
php artisan serve
```

No PowerShell, troque `cp` por:

```powershell
Copy-Item .env.example .env
```

## Acesso local

- URL padrão: `http://localhost:8000` (quando usando `php artisan serve`)
- Login admin seed:
  - Email: `admin@example.com`
  - Senha: `password`

Observações:

- O cadastro público (`/register`) está desativado.
- Clientes seed são criados com senha `password`, mas com e-mails aleatórios de factory.
- Para criar um cliente com credenciais conhecidas, use a tela de clientes no admin (`/admin/clients`).

## Fluxo funcional

- `admin`
  - dashboard e agenda operacional
  - CRUD de timeslots e endereços de descarga
  - gestão de clientes
  - aprovação/rejeição e finalização de fretes
  - upload de anexos da operação
- `client`
  - dashboard com indicadores
  - visualização de horários disponíveis (públicos ou restritos)
  - criação/cancelamento de reservas
  - upload de nota fiscal (obrigatório para operação de descarga)
  - CRUD de caminhões

### Status de frete

- Operação `load` nasce como `loading`
- Operação `unload` nasce como `unloading`
- Admin finaliza como `completed`
- Cancelamento muda para `cancelled` (se ainda não concluído)

## Regras de negócio importantes

- Não permite reserva ativa duplicada da mesma placa no mesmo timeslot.
- Timeslot pode ser:
  - público (sem vínculo em `client_timeslot`)
  - restrito (visível apenas para clientes vinculados)
- Arquivos de nota fiscal e anexos ficam no disco `public`:
  - `storage/app/public/notas_fiscais`
  - `storage/app/public/attachments`

## Comandos úteis

```bash
# testes
php artisan test

# lint/format PHP
php artisan pint

# build frontend de produção
npm run build

# limpar caches
php artisan optimize:clear
```

## Estrutura de pastas (resumo)

- `app/Actions`: regras de negócio de frete e timeslot
- `app/Http/Controllers`: controladores web
- `app/Models`: entidades principais (`User`, `Freight`, `Timeslot`, `Truck`)
- `resources/js/Pages`: telas Inertia/React por módulo (`Admin`, `Client`, `Auth`)
- `routes/web.php`: rotas da aplicação
- `database/migrations` e `database/seeders`: schema e dados iniciais

## Troubleshooting

- Upload não abre no navegador:
  - confirme `php artisan storage:link`
- Testes podem falhar no estado atual com erro de índice SQLite:
  - `no such index: freights_timeslot_id_truck_plate_unique`
  - origem: migration `2026_03_06_200003_alter_unique_active_freights_on_timeslot_and_truck.php`
- As rotas usam middlewares `admin` e `client`, mas hoje os middlewares `IsAdmin` e `IsClient` não bloqueiam acesso por papel (apenas passam a requisição).

## Convenções de trabalho

- Antes de abrir PR:
  - rode `php artisan test`
  - rode `php artisan pint`
  - valide fluxo admin e client em ambiente local
