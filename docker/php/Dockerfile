FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
        icu-libs \
        libpq \
        libzip \
        oniguruma \
    && apk add --no-cache --virtual .build-deps \
        icu-dev \
        libpq-dev \
        libzip-dev \
        linux-headers \
        oniguruma-dev \
        $PHPIZE_DEPS \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo_pgsql \
        zip \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY custom.ini /usr/local/etc/php/conf.d/99-cargohub.ini

WORKDIR /var/www/html

EXPOSE 9000
