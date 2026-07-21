#!/usr/bin/env bash
# 일 1회 pg_dump 백업. cron 등록:
#   crontab -e →  0 4 * * *  /home/ubuntu/projects/temple/deploy/backup-db.sh
set -euo pipefail

DB_NAME="temple"
BACKUP_DIR="/home/ubuntu/backups"
KEEP_DAYS=14
STAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"
pg_dump "$DB_NAME" | gzip > "$BACKUP_DIR/temple_${STAMP}.sql.gz"

# (선택) S3 업로드 — aws-cli 설치 및 버킷 준비 후 주석 해제
# aws s3 cp "$BACKUP_DIR/temple_${STAMP}.sql.gz" "s3://YOUR-BUCKET/db-backups/"

# 오래된 백업 정리
find "$BACKUP_DIR" -name 'temple_*.sql.gz' -mtime +$KEEP_DAYS -delete
echo "backup done: temple_${STAMP}.sql.gz"
