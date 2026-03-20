# Production Stack

Estrutura de produção com:

- `Laravel` em `Nginx + PHP-FPM`
- `PostgreSQL` para a aplicação
- `Redis` para cache, fila e sessão da aplicação
- worker de fila separado
- `Evolution API` em serviço separado, com `PostgreSQL` e `Redis` próprios (opcional via profiles)
- `HTTPS` encerrado no `Nginx`
- segredos fora do repositório, via `infra/production/.env`

Os valores padrão já estão ajustados para subir primeiro em `localhost`.

## Arquivos principais

- `docker-compose.yml`
- `.env.example`
- `images/Dockerfile`
- `php/entrypoint.sh`
- `nginx/default.conf.template`

## Localhost primeiro

URLs locais padrão:

- app: `https://localhost:8443`
- redirect HTTP do app: `http://localhost:8080`
- evolution: `https://localhost:8444`
- redirect HTTP da evolution: `http://localhost:8088`

Os certificados locais são autoassinados e gerados automaticamente pelo `Nginx` quando `NGINX_AUTO_SELF_SIGNED=true`.

## Preparação

1. Copie `infra/production/.env.example` para `infra/production/.env`.
2. Preencha pelo menos:
   - `APP_KEY`
   - `DB_PASSWORD`
   - `EVOLUTION_API_KEY` (apenas se for usar a Evolution)
   - `EVOLUTION_DB_PASSWORD` (apenas se for usar a Evolution)
   - `AUTHENTICATION_API_KEY` (apenas se for usar a Evolution)
3. Em localhost, você não precisa colocar certificados manualmente.
4. Para produção real, coloque os certificados em `infra/production/certs/` e ajuste os nomes dos arquivos no `.env`.

Para gerar uma `APP_KEY` no servidor:

```powershell
php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```

## Evolution API (WhatsApp) — opcional via profiles

Os três serviços da Evolution (`evolution-api`, `evolution-postgres`, `evolution-redis`) só sobem quando o profile `evolution` está ativo. Isso é controlado pela variável `COMPOSE_PROFILES` no `.env`.

**Subir SEM a Evolution** (padrão):

```env
# .env
COMPOSE_PROFILES=
```

```bash
docker compose up -d
# Sobe: web, app-fpm, app-queue, app-postgres, app-redis
```

**Subir COM a Evolution** (WhatsApp ativo):

```env
# .env
COMPOSE_PROFILES=evolution
```

```bash
docker compose up -d
# Sobe todos os serviços, incluindo evolution-api, evolution-postgres, evolution-redis
```

Quando `COMPOSE_PROFILES=` está vazio, o job `SendWhatsAppMessageJob` detecta que a Evolution não está disponível, loga um warning e retorna sem erro — nenhuma mensagem WhatsApp é enviada, mas a fila continua funcionando normalmente.

## Redis (cache, fila e sessão)

O serviço `app-redis` sobe sempre, independente do profile da Evolution. Ele é usado pelo Laravel para:

- **Cache** (`CACHE_STORE=redis`) — substitui o driver `database`, eliminando queries de cache no Postgres
- **Fila** (`QUEUE_CONNECTION=redis`) — substitui o driver `database`, as filas passam pelo Redis
- **Sessão** (`SESSION_DRIVER=redis`) — substitui o driver `database`, as sessões ficam no Redis

As variáveis já estão configuradas no `.env.example` e são injetadas nos containers `app-fpm` e `app-queue` via `environment` no `docker-compose.yml`. A extensão PHP `redis` (phpredis) é instalada automaticamente no build da imagem.

## Subir a stack

```bash
cd infra/production
docker compose build
docker compose up -d
```

## Pós-subida

Rode as migrations do Laravel:

```bash
docker compose exec app-fpm php artisan migrate --force
```

Confirme a fila:

```bash
docker compose ps
```

Os serviços esperados (sem Evolution) são:

- `web`
- `app-fpm`
- `app-queue`
- `app-postgres`
- `app-redis`

Com `COMPOSE_PROFILES=evolution`, também sobem:

- `evolution-api`
- `evolution-postgres`
- `evolution-redis`

## Backups

O script `scripts/backup.sh` faz dump do banco `app-postgres` comprimido com gzip e apaga backups com mais de 7 dias.

**Rodar manualmente:**

```bash
./infra/production/scripts/backup.sh
```

**Agendar via cron no VPS** (diariamente às 3h):

```bash
crontab -e
```

Adicione a linha (ajuste o caminho absoluto):

```
0 3 * * * /caminho/absoluto/para/infra/production/scripts/backup.sh >> /var/log/freight-backup.log 2>&1
```

**Onde ficam os arquivos:** `infra/production/backups/`

**Retenção:** 7 dias (backups mais antigos são apagados automaticamente).

Os arquivos `.sql.gz` estão no `.gitignore` e nunca vão para o repositório.

## Observações

- o app Laravel fala com a Evolution internamente por `http://evolution-api:8080`
- externamente, a Evolution fica atrás do `Nginx` na URL configurada em `EVOLUTION_PUBLIC_URL`
- em localhost, o navegador vai mostrar aviso por ser certificado autoassinado
- não publique portas do `PostgreSQL`, `Redis` ou `Evolution API` diretamente na internet
