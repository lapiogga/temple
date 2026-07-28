#!/usr/bin/env bash
# 일 1회 pg_dump 백업. 스크립트가 놓인 체크아웃의 .env 를 읽으므로
# prod(/var/www/temple → DB temple), dev(~/temple-dev → DB temple_dev) 양쪽에서 동일하게 동작한다.
#
# cron 등록:
#   crontab -e →  0 19 * * *  /var/www/temple/deploy/backup-db.sh
set -euo pipefail
umask 077

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${APP_DIR}/.env"
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
KEEP_DAYS=14

# off-VPS 반출(선택). 설정돼 있으면 실패 시 스크립트도 실패한다(조용한 no-op 금지).
#   예) BACKUP_REMOTE="r2:temple-backups"
BACKUP_REMOTE="${BACKUP_REMOTE:-}"
RCLONE="${RCLONE:-/home/ubuntu/bin/rclone}"
RCLONE_FLAGS="${RCLONE_FLAGS:---s3-no-check-bucket}"

# 실패 통보(선택) — healthchecks.io 류 dead-man's switch. 완주했을 때만 핑을 보낸다.
HC_URL_DB="${HC_URL_DB:-}"

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
install -d -m 700 "$BACKUP_DIR"

# 여유 공간 가드 — 디스크를 채워 PostgreSQL 을 죽이기 전에 백업이 먼저 죽게 한다
AVAIL="$(df -B1 --output=avail "$BACKUP_DIR" | tail -1)"
[ "$AVAIL" -gt $((1024 * 1024 * 1024)) ] || {
  echo "ERROR: 여유공간 1GB 미만(avail=${AVAIL}B) — 덤프 취소" >&2; exit 1; }

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
gzip -t "$TMP" || { echo "ERROR: gzip 무결성 검증 실패 — 백업 취소" >&2; exit 1; }

mv "$TMP" "$OUT"
trap - EXIT

# off-VPS 반출: 설정돼 있는데 실패하면 스크립트도 실패해야 한다.
# 반드시 보관정리(아래 find)보다 앞에 둘 것 — 반출 못 한 백업을 지우지 않기 위해서다.
if [ -n "$BACKUP_REMOTE" ]; then
  [ -x "$RCLONE" ] || { echo "ERROR: BACKUP_REMOTE 설정됐으나 rclone 없음: $RCLONE" >&2; exit 1; }
  # shellcheck disable=SC2086
  "$RCLONE" copy "$OUT" "${BACKUP_REMOTE}/db/" $RCLONE_FLAGS \
    || { echo "ERROR: off-VPS 반출 실패: ${BACKUP_REMOTE}/db/" >&2; exit 1; }
  echo "off-VPS 반출 완료: ${BACKUP_REMOTE}/db/"
fi

# 오래된 백업 정리(로컬만. 원격 보관정리는 목적지 수명주기 규칙에 맡긴다)
find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "backup done: $(basename "$OUT") (${SIZE}B)"

# 완주했을 때만 핑 → 어떤 이유로든 중단되면 정해진 시각에 핑이 안 와 알림이 간다
if [ -n "$HC_URL_DB" ]; then
  curl -fsS -m 10 "$HC_URL_DB" >/dev/null || echo "WARN: healthcheck 핑 실패" >&2
fi
