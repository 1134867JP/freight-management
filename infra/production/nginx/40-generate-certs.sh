#!/bin/sh
set -e

if [ "${NGINX_AUTO_SELF_SIGNED}" != "true" ]; then
    exit 0
fi

CERTS_DIR="/etc/nginx/certs"
mkdir -p "${CERTS_DIR}"

generate_cert() {
    local domain="$1"
    local cert="$2"
    local key="$3"

    if [ ! -f "${CERTS_DIR}/${cert}" ] || [ ! -f "${CERTS_DIR}/${key}" ]; then
        echo "Generating self-signed certificate for ${domain}..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${CERTS_DIR}/${key}" \
            -out "${CERTS_DIR}/${cert}" \
            -subj "/CN=${domain}" \
            -addext "subjectAltName=DNS:${domain}"
    fi
}

generate_cert "${APP_DOMAIN}" "${APP_TLS_CERT}" "${APP_TLS_KEY}"
generate_cert "${EVOLUTION_DOMAIN}" "${EVOLUTION_TLS_CERT}" "${EVOLUTION_TLS_KEY}"
