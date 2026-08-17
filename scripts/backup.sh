#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${FREIGHT_APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
SHARED_DIR="${FREIGHT_SHARED_DIR:-/opt/apps/outro-site/freight-management-shared}"
BACKUP_DIR="${FREIGHT_BACKUP_DIR:-$SHARED_DIR/backups}"
RETENTION_DAYS="${FREIGHT_BACKUP_RETENTION_DAYS:-14}"
ENV_FILE="${FREIGHT_ENV_FILE:-$SHARED_DIR/.env}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

FILENAME="backup_$(date -u +%Y%m%d_%H%M%S).dump"
TEMP_FILE="$BACKUP_DIR/.${FILENAME}.tmp"
FINAL_FILE="$BACKUP_DIR/$FILENAME"

cleanup() {
  rm -f "$TEMP_FILE"
}
trap cleanup EXIT

docker compose \
  --env-file "$ENV_FILE" \
  -f "$APP_DIR/docker-compose.yml" \
  -p freight-management \
  exec -T db sh -lc 'exec pg_dump --format=custom --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  > "$TEMP_FILE"

test -s "$TEMP_FILE"
chmod 600 "$TEMP_FILE"
mv "$TEMP_FILE" "$FINAL_FILE"

find "$BACKUP_DIR" -type f -name 'backup_*.dump' -mtime "+$RETENTION_DAYS" -delete

echo "Backup concluído: $FINAL_FILE"
