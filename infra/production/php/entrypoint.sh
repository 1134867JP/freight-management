#!/bin/sh
set -e

# Aguarda o banco ficar pronto antes de qualquer coisa
if [ "${WAIT_FOR_DB}" = "true" ]; then
  echo "Aguardando banco de dados..."
  until php artisan db:monitor --databases=pgsql 2>/dev/null; do
    echo "Banco ainda não disponível, aguardando 2s..."
    sleep 2
  done
  echo "Banco disponível."
fi

# Otimizações do Laravel (config, route, view cache)
if [ "${APP_RUN_OPTIMIZE}" = "true" ]; then
  php artisan package:discover --ansi
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

# Migrations e link do storage apenas no FPM (não no queue worker)
if [ "$1" = "php-fpm" ]; then
  php artisan migrate --force
  php artisan storage:link --force
fi

exec "$@"