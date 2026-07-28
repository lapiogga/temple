#!/usr/bin/env bash
# 일 1회 pg_dump 백업. 스크립트가 놓인 체크아웃의 .env 를 읽으므로
# prod(/var/www/temple → DB temple), dev(~/temple-dev → DB temple_dev) 양쪽에서 동일하게 동작한다.
#
# cron 등록:
#   crontab -e →  0 4 * * *  /var/www/temple/deploy/backup-db.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${APP_DIR}/.env"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
KEEP_DAYS=14

[ -r "$ENV_FILE" ] || { echo "ERROR: .env 를 읽을 수 없음: $ENV_FILE" >&2; exit 1; }

# DATABASE_URL=postgresql://user:pass@host:port/dbname 파싱
DB_URL="$(grep -m1 '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2-)"
[ -n "$DB_URL" ] || { echo "ERROR: DATABASE_URL 미설정" >&2; exit 1; }

if [[ "$DB_URL" =~ ^postgres(ql)?://([^:]+):([^@]+)@([^:/]+):([0-9]+)/(.+)$ ]]; then
  DB_USER="${BASH_REMATCH[2]}"; DB_PASS="${BASH_REMATCH[3]}"
  DB_HOST="${BASH_REMATCH[4]}"; DB_PORT="${BASH_REMATCH[5]}"; DB_NAME="${BASH_REMATCH[6]}"
else
  echo "ERROR: DATABASE_URL 형식을 해석할 수 없음" >&2; exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
OUT="${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz"
TMP="${OUT}.part"

# 비밀번호는 PGPASSWORD 로 전달(명령줄 인자와 달리 ps 에 노출되지 않음)
# .part 로 받은 뒤 성공했을 때만 최종 이름으로 이동 → 빈/깨진 파일이 백업으로 남지 않음
export PGPASSWORD="$DB_PASS"
trap 'rm -f "$TMP"' EXIT
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$TMP"

# 최소 크기 검증(빈 덤프 방지)
SIZE="$(stat -c %s "$TMP")"
[ "$SIZE" -gt 1000 ] || { echo "ERROR: 덤프가 비정상적으로 작음(${SIZE}B) — 백업 취소" >&2; exit 1; }

mv "$TMP" "$OUT"
trap - EXIT

# 오래된 백업 정리
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "backup done: $(basename "$OUT") (${SIZE}B)"
