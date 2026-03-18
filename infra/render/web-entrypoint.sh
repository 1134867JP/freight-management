#!/bin/sh
set -e

echo "==> Entrypoint iniciado"
echo "==> PORT=$PORT"
echo "==> DB_URL=$DB_URL"

echo "==> Aguardando banco de dados..."
until php artisan db:show --json > /dev/null 2>&1; do
  echo "    banco indisponível, tentando novamente em 2s..."
  sleep 2
done
echo "==> Banco disponível."

echo "==> Rodando migrations..."
php artisan migrate --force

echo "==> Verificando seeder..."
USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null | tail -1)
if [ "$USER_COUNT" = "0" ]; then
  echo "==> Rodando seeder..."
  php artisan db:seed --force
else
  echo "==> Seeder ignorado, já existem usuários."
fi

echo "==> Criando symlink storage..."
php artisan storage:link --force 2>/dev/null || true

if [ "$APP_RUN_OPTIMIZE" = "true" ]; then
  echo "==> Otimizando..."
  php artisan optimize
fi

echo "==> Processando configuração do nginx..."
cp /etc/nginx/http.d/default.conf.template /etc/nginx/http.d/default.conf

echo "==> Iniciando servidor..."
exec "$@"