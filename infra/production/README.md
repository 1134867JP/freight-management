# Production Stack

Estrutura de produção com:

- `Laravel` em `Nginx + PHP-FPM`
- `PostgreSQL` para a aplicação
- worker de fila separado
- `Evolution API` em serviço separado, com `PostgreSQL` e `Redis` próprios
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
   - `EVOLUTION_API_KEY`
   - `EVOLUTION_DB_PASSWORD`
   - `AUTHENTICATION_API_KEY`
3. Em localhost, você não precisa colocar certificados manualmente.
4. Para produção real, coloque os certificados em `infra/production/certs/` e ajuste os nomes dos arquivos no `.env`.

Para gerar uma `APP_KEY` no servidor:

```powershell
php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
```

## Subir a stack

```powershell
Set-Location infra/production
docker compose build
docker compose up -d
```

## Pós-subida

Rode as migrations do Laravel:

```powershell
docker compose exec app-fpm php artisan migrate --force
```

Confirme a fila:

```powershell
docker compose ps
```

Os serviços esperados são:

- `web`
- `app-fpm`
- `app-queue`
- `app-postgres`
- `evolution-api`
- `evolution-postgres`
- `evolution-redis`

## Observações

- o app Laravel fala com a Evolution internamente por `http://evolution-api:8080`
- externamente, a Evolution fica atrás do `Nginx` na URL configurada em `EVOLUTION_PUBLIC_URL`
- em localhost, o navegador vai mostrar aviso por ser certificado autoassinado
- não publique portas do `PostgreSQL`, `Redis` ou `Evolution API` diretamente na internet
