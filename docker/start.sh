#!/usr/bin/env sh
set -e

cd /var/www/html

if [ ! -f .env ]; then
  cp .env.example .env
fi

echo "Aguardando Postgres..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-outro_user}" >/dev/null 2>&1; do
  sleep 2
done

if [ ! -d vendor ]; then
  echo "Instalando dependências PHP..."
  composer install --no-interaction --prefer-dist
fi

if [ ! -f package-lock.json ] && [ ! -d node_modules ]; then
  echo "Instalando dependências Node..."
  npm install
elif [ ! -d node_modules ]; then
  echo "Instalando dependências Node via lockfile..."
  npm ci
fi

if ! grep -q "^APP_KEY=base64:" .env; then
  php artisan key:generate --force
fi

if [ ! -f public/build/manifest.json ]; then
  echo "Gerando build de frontend..."
  npm run build
fi

php artisan migrate --force
php artisan storage:link || true

echo "Aplicação iniciada em http://localhost:8000"
exec php artisan serve --host=0.0.0.0 --port=8000
