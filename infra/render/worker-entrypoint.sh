#!/bin/sh
set -e

echo "==> Aguardando banco de dados..."
until php artisan db:show --json > /dev/null 2>&1; do
  echo "    banco indisponível, tentando novamente em 2s..."
  sleep 2
done
echo "==> Banco disponível."

if [ "$APP_RUN_OPTIMIZE" = "true" ]; then
  echo "==> Otimizando..."
  php artisan optimize
fi

echo "==> Iniciando worker..."
exec "$@"