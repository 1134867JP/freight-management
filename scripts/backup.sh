#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$BACKUP_DIR"

FILENAME="backup_$(date +%Y%m%d_%H%M%S).sql.gz"
docker compose -f "$SCRIPT_DIR/../docker-compose.yml" exec -T db \
  pg_dump -U freight_user freight_db | gzip > "$BACKUP_DIR/$FILENAME"

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup concluído: $BACKUP_DIR/$FILENAME"
