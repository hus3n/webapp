#!/usr/bin/env bash

# SQLite Automated Backup Script for webapp-hafalan

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
DB_FILE="./database.sqlite"
BACKUP_FILE="${BACKUP_DIR}/database_backup_${TIMESTAMP}.sqlite"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
  echo "[$(date)] Starting database backup..."
  sqlite3 "$DB_FILE" ".backup '${BACKUP_FILE}'"
  
  if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}"
    # Keep only backups from the last 30 days
    find "$BACKUP_DIR" -type f -name "database_backup_*.sqlite" -mtime +30 -delete
  else
    echo "[$(date)] Error: Backup failed!" >&2
    exit 1
  fi
else
  echo "[$(date)] Error: Database file ${DB_FILE} not found!" >&2
  exit 1
fi
