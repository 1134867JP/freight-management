FROM php:8.3-cli-alpine AS php-deps

RUN apk add --no-cache git unzip icu-dev libzip-dev oniguruma-dev postgresql-dev \
    && docker-php-ext-install bcmath pdo_pgsql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

COPY . .

RUN composer dump-autoload --optimize --no-dev

FROM node:20-alpine AS frontend-build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY resources ./resources
COPY public ./public
COPY vite.config.js postcss.config.js tailwind.config.js eslint.config.js jsconfig.json ./

RUN npm run build

FROM php:8.3-fpm-alpine AS php-fpm

RUN apk add --no-cache bash fcgi icu-dev libzip-dev oniguruma-dev postgresql-client \
    && docker-php-ext-install bcmath pdo_pgsql zip opcache \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

RUN apk add --no-cache autoconf g++ make \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del autoconf g++ make

WORKDIR /var/www/html

COPY . .
COPY --from=php-deps /app/vendor ./vendor
COPY --from=frontend-build /app/public/build ./public/build
COPY infra/production/php/php.ini $PHP_INI_DIR/conf.d/99-app.ini
COPY infra/production/php/www.conf /usr/local/etc/php-fpm.d/zz-app.conf
COPY infra/production/php/entrypoint.sh /usr/local/bin/app-entrypoint

RUN chmod +x /usr/local/bin/app-entrypoint \
    && rm -rf node_modules \
    && mkdir -p storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

ENTRYPOINT ["/usr/local/bin/app-entrypoint"]
CMD ["php-fpm", "-F"]

FROM nginx:1.27-alpine AS nginx

WORKDIR /var/www/html

RUN apk add --no-cache openssl

COPY public ./public
COPY --from=frontend-build /app/public/build ./public/build
COPY infra/production/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY infra/production/nginx/40-generate-certs.sh /docker-entrypoint.d/40-generate-certs.sh

RUN mkdir -p /var/www/html/storage/app/public \
    && ln -s /var/www/html/storage/app/public /var/www/html/public/storage \
    && chmod +x /docker-entrypoint.d/40-generate-certs.sh
