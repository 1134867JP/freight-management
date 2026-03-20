#!/bin/bash
# Backup do banco de dados da aplicação (app-postgres)
# Uso: ./backup.sh
# Agende com: crontab -e → 0 3 * * * /caminho/absoluto/infra/production/scripts/backup.sh >> /var/log/freight-backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"
BACKUP_DIR="$SCRIPT_DIR/../backups"
ENV_FILE="$SCRIPT_DIR/../.env"

# Lê variáveis do .env com fallback para o padrão
DB_USERNAME="freight_management"
DB_DATABASE="freight_management"

if [[ -f "$ENV_FILE" ]]; then
    _val=$(grep -E '^DB_USERNAME=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)
    [[ -n "$_val" ]] && DB_USERNAME="$_val"

    _val=$(grep -E '^DB_DATABASE=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)
    [[ -n "$_val" ]] && DB_DATABASE="$_val"
fi

# Cria o diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date '+%Y-%m-%d_%H-%M')
BACKUP_FILE="$BACKUP_DIR/app-postgres_${TIMESTAMP}.sql.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup do banco '$DB_DATABASE' (usuário: $DB_USERNAME)"

docker compose -f "$COMPOSE_FILE" exec -T app-postgres \
    pg_dump -U "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BACKUP_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup salvo em: $BACKUP_FILE"

# Remove backups com mais de 7 dias
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Removendo backups com mais de 7 dias..."
find "$BACKUP_DIR" -name "app-postgres_*.sql.gz" -mtime +7 -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backups existentes:"
ls -lh "$BACKUP_DIR"/app-postgres_*.sql.gz 2>/dev/null || echo "  (nenhum backup encontrado)"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup concluído."
