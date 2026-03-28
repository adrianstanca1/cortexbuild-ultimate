#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "=== Database Backup ==="
echo "Starting backup to $BACKUP_FILE"

docker-compose exec -T db pg_dump -U postgres cortexbuild > "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    echo "File size: $(du -h $BACKUP_FILE | cut -f1)"
    
    # Keep only last 7 backups
    ls -1t "$BACKUP_DIR"/db_backup_*.sql | tail -n +8 | xargs -r rm
    echo "Old backups cleaned up (keeping last 7)"
else
    echo "ERROR: Backup failed!"
    exit 1
fi
