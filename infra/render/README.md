# Render

Infra dedicada para subir a aplicação no Render sem depender do `docker-compose` local.

## Arquivos

- `Dockerfile.web`: imagem do serviço HTTP com `nginx + php-fpm`
- `Dockerfile.worker`: imagem do worker de fila
- `web-entrypoint.sh`: bootstrap do serviço web
- `worker-entrypoint.sh`: bootstrap do worker
- `nginx.default.conf.template`: `nginx` com porta dinâmica do Render
- `supervisord.web.conf`: sobe `php-fpm` e `nginx` no mesmo container

## Serviços esperados

- `freight-management-db`: Render Postgres
- `freight-management-web`: Web Service com disco persistente em `/var/www/html/storage`
- `freight-management-worker`: Background Worker para `queue:work`

## Passo a passo

1. Faça commit dos arquivos de deploy:
   - `render.yaml`
   - `infra/render/Dockerfile.web`
   - `infra/render/Dockerfile.worker`
2. Envie para o GitHub/GitLab conectado ao Render.
3. No Render, clique em `New > Blueprint`.
4. Selecione o repositório e confirme os três recursos:
   - `freight-management-db`
   - `freight-management-web`
   - `freight-management-worker`
5. Preencha os valores solicitados pelo blueprint:
   - `APP_KEY` no web
   - `APP_KEY` no worker
   - `APP_URL` no web
6. Gere a chave do Laravel localmente:

```bash
php artisan key:generate --show
```

7. Use a URL pública do serviço web em `APP_URL`, por exemplo:

```text
https://freight-management-web.onrender.com
```

8. Faça o primeiro deploy com `EVOLUTION_ENABLED=false`.
9. Depois que o deploy terminar:
   - confirme o healthcheck em `/up`
   - acesse a aplicação
   - rode o seeder se precisar criar os usuários padrão

```bash
php artisan db:seed
```

## Observações

- O disco persistente fica apenas no `web`, porque o Render não permite compartilhar o mesmo disco entre múltiplos serviços.
- O worker atual não precisa do disco para o job de WhatsApp, então ele pode rodar como serviço stateless.
- O blueprint fica no arquivo raiz `render.yaml`.
- O `preDeployCommand` roda `php artisan migrate --force`, mas não monta o disco persistente nessa etapa.
