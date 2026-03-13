# Freight Management

Sistema web para agendamento e operação de fretes com dois perfis:

- `platform_admin`: gerencia empresas, logos e instâncias WhatsApp.
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
- Vite em modo de desenvolvimento

Se quiser rodar também o visualizador de logs `Pail`, use:

```bash
composer run dev:with-logs
```

Observação:

- no Windows, `Pail` costuma falhar porque depende da extensão `pcntl`
- por isso `composer run dev` foi mantido sem `Pail`

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
- Login super admin seed:
  - Email: `platform@example.com`
  - Senha: `password`
- Login admin seed:
  - Email: `admin@example.com`
  - Senha: `password`

Painel global:

- URL: `/platform`
- Funções: criar/editar empresa, definir logo, manter admin principal e a instância WhatsApp única de cada empresa

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
  - recebimento de notificações WhatsApp sobre ações do admin

## Integração WhatsApp (Evolution API)

O projeto agora suporta envio de mensagens via Evolution API para:

- `admin` que criou o `timeslot/cota`, quando o cliente cria, cancela, reabre reserva ou envia nota fiscal
- `client`, quando o admin cancela a reserva, inicia/finaliza a operação ou adiciona anexo

Configuração mínima no `.env`:

```bash
EVOLUTION_ENABLED=true
EVOLUTION_BASE_URL=http://localhost:8088
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=nome-da-instancia
EVOLUTION_TIMEOUT=10
```

Requisitos operacionais:

- se você usar o pack local deste repositório, ele está em `infra/evolution-api`
- a instância informada em `EVOLUTION_INSTANCE` precisa já existir e estar conectada no Evolution API
- o `queue worker` precisa estar rodando para os envios assíncronos
- os usuários devem ter `WhatsApp` preenchido com DDI e apenas números, por exemplo `5511999999999`

## Produção

Existe uma stack pronta em `infra/production` com:

- `Nginx + PHP-FPM` para o Laravel
- `PostgreSQL` para a aplicação
- worker de fila separado
- `Evolution API` isolada, com `PostgreSQL` e `Redis` próprios
- `HTTPS` terminando no `Nginx`

Os segredos não ficam no repositório: use `infra/production/.env` no servidor, a partir de `infra/production/.env.example`.

### Render

Também existe uma estrutura dedicada para Render:

- blueprint em `render.yaml`
- web service Docker em `infra/render/Dockerfile.web`
- worker Docker em `infra/render/Dockerfile.worker`

Fluxo esperado no Render:

- `1` web service com disco persistente montado em `/var/www/html/storage`
- `1` background worker para a fila
- `1` Render Postgres

Observações importantes:

- o disco persistente fica apenas no web service, porque o Render não permite compartilhar o mesmo disco entre serviços
- o pre-deploy roda `php artisan migrate --force`
- para o primeiro deploy, mantenha `EVOLUTION_ENABLED=false` e ligue a Evolution depois
- o arquivo `render.yaml` já está enxugado com um `envVarGroup` para evitar duplicação entre web e worker

Detalhes adicionais estão em `infra/render/README.md`.

Onde configurar telefone:

- `admin`: tela de perfil
- `client`: tela de clientes no admin ou tela de perfil do próprio cliente

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

## Convenções de trabalho

- Antes de abrir PR:
  - rode `php artisan test`
  - rode `php artisan pint`
  - valide fluxo admin e client em ambiente local
