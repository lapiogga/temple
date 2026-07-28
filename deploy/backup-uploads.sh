#!/usr/bin/env bash
# 업로드 이미지(public/uploads) 백업 — 월 1회 전체 + 매일 증분(GNU tar --listed-incremental).
# 스크립트가 놓인 체크아웃 기준으로 동작한다(prod/dev 공용).
#
# 보관 구조:
#   /home/ubuntu/backups/uploads/current/   이번 주기(전체 1 + 증분 N) + uploads.snar + CYCLE
#   /home/ubuntu/backups/uploads/prev/      직전 주기(새 전체 백업이 '성공한 뒤에만' 교체)
#   /home/ubuntu/backups/uploads/staging/   새 전체 백업 작업공간(검증 통과 시에만 current 로 승격)
#
# 설계 원칙 — 전부 실패 재현으로 확인된 것이며, 개별로 떼어내 적용하면 안 된다:
#   1. tar 가 경고(rc=1: File removed / file changed / File shrank)로 끝나도 아카이브는 유효하다
#      → 승격한다. 아카이브만 버리고 스냅샷을 전진시키면 그 회차 변경분이 어느 백업에도 남지 않는다.
#   2. tar 가 치명적으로 실패(rc>=2)하면 스냅샷을 전진시키지 않는다. 증분 중이었다면 라이브
#      스냅샷을 폐기해 다음 실행이 전체 백업으로 자가복구된다(스냅샷 손상 시 무증상 정지 방지).
#   3. 파괴적 로테이션(prev 교체)은 새 전체 백업이 검증을 통과한 뒤에만 실행한다.
#   4. MODE 판정 기준은 '스냅샷 존재'가 아니라 '전체 아카이브 존재'다.
#      그래야 실패한 전체 백업이 다음 날 자동 재시도된다.
#
# 복원(같은 주기 안에서 전체 → 증분 순서대로):
#   cd /home/ubuntu/backups/uploads/current
#   for f in $(ls -1 uploads_*_full.tar.gz; ls -1 uploads_*_inc.tar.gz | sort); do
#     tar --listed-incremental=/dev/null -xzf "$f" -C /var/www/temple/public
#   done
#   파일명 일련번호 덕에 사전순 정렬 = 생성순이므로 sort 결과를 그대로 쓰면 된다.
#   원격에서 받아올 때는 반드시 주기별 prefix(uploads/<CYCLE>/) 단위로 받을 것.
#   전 주기 아카이브를 한 디렉터리에 섞으면 지난 주기 증분이 새 주기 전체 뒤에 적용된다.
#
# cron 등록:
#   5 19 * * *  /var/www/temple/deploy/backup-uploads.sh
set -euo pipefail
umask 077

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_PARENT="${APP_DIR}/public"
SRC_NAME="uploads"
BACKUP_ROOT="${BACKUP_ROOT:-/home/ubuntu/backups/uploads}"
CUR="${BACKUP_ROOT}/current"
PREV="${BACKUP_ROOT}/prev"
STG="${BACKUP_ROOT}/staging"

# off-VPS 반출(선택). 설정돼 있으면 실패 시 스크립트도 실패한다(조용한 no-op 금지).
#   예) BACKUP_REMOTE="r2:temple-backups"
BACKUP_REMOTE="${BACKUP_REMOTE:-}"
RCLONE="${RCLONE:-/home/ubuntu/bin/rclone}"
RCLONE_FLAGS="${RCLONE_FLAGS:---s3-no-check-bucket}"
# 원격 보관정리는 여기서 하지 않는다. 키가 삭제 권한을 가지면 랜섬웨어 벡터가 되므로
# 수명주기 규칙은 목적지(R2 등) 대시보드에 맡긴다.

# 실패 통보(선택) — healthchecks.io 류 dead-man's switch. 완주했을 때만 핑을 보낸다.
HC_URL_UPLOADS="${HC_URL_UPLOADS:-}"

[ -d "${SRC_PARENT}/${SRC_NAME}" ] || { echo "ERROR: 업로드 디렉터리 없음: ${SRC_PARENT}/${SRC_NAME}" >&2; exit 1; }
install -d -m 700 "$BACKUP_ROOT" "$CUR"

STAMP="$(date +%Y%m%d_%H%M%S)"
DAY="$(date +%d)"

# --- MODE 판정: '전체 아카이브가 있는가' 기준 (스냅샷 존재 기준이 아님) -------------
if [ "$DAY" = "01" ] \
   || ! ls "$CUR"/uploads_*_full.tar.gz >/dev/null 2>&1 \
   || [ ! -f "$CUR/uploads.snar" ]; then
  MODE="full"
else
  MODE="inc"
fi

# --- 여유 공간 가드: 디스크를 채워 PostgreSQL 을 죽이기 전에 백업이 먼저 죽게 한다 ---
NEED="$(du -sb "${SRC_PARENT}/${SRC_NAME}" | cut -f1)"
AVAIL="$(df -B1 --output=avail "$BACKUP_ROOT" | tail -1)"
if [ "$MODE" = "full" ]; then
  # 이미지는 이미 압축된 JPEG 이라 gzip 이득이 거의 없다(실측 0.2~0.4%) → 원본 크기로 잡는다
  REQ=$((NEED * 12 / 10))
else
  # 증분은 변경분만 담지만, 최소한의 안전 여유는 확보한다
  REQ=$((1024 * 1024 * 1024))
  [ "$REQ" -lt $((NEED / 10)) ] && REQ=$((NEED / 10))
fi
[ "$AVAIL" -gt "$REQ" ] || {
  echo "ERROR: 여유공간 부족 — avail=${AVAIL}B need=${REQ}B (mode=${MODE}) — 백업 취소" >&2
  exit 1
}

# --- 작업공간 결정: 전체는 staging 에서, 증분은 current 에서 -----------------------
# 전체 백업은 current/prev 를 건드리지 않고 staging 에서 만든 뒤 검증 후에만 승격한다.
if [ "$MODE" = "full" ]; then
  rm -rf "$STG"
  install -d -m 700 "$STG"
  WORKDIR="$STG"
  SNAR_WORK="${STG}/uploads.snar"
  SNAR_LIVE=""
  CYCLE="$STAMP"
  echo "$CYCLE" > "${STG}/CYCLE"
else
  WORKDIR="$CUR"
  SNAR_LIVE="${CUR}/uploads.snar"
  SNAR_WORK="${CUR}/uploads.snar.work"
  # 스냅샷 사본에 tar 를 돌린다 → 실패 시 라이브 스냅샷이 전진하지 않는다
  cp -p "$SNAR_LIVE" "$SNAR_WORK"
  CYCLE="$(cat "${CUR}/CYCLE" 2>/dev/null || echo unknown)"
fi

# 파일명에 항상 2자리 일련번호를 넣는다. 같은 초에 두 번 실행돼도 덮어쓰지 않고,
# 사전순 정렬이 곧 생성순이 되어 복원 시 증분 적용 순서가 보장된다.
n=1
OUT="$(printf '%s/uploads_%s_%02d_%s.tar.gz' "$WORKDIR" "$STAMP" "$n" "$MODE")"
while [ -e "$OUT" ]; do
  n=$((n + 1))
  OUT="$(printf '%s/uploads_%s_%02d_%s.tar.gz' "$WORKDIR" "$STAMP" "$n" "$MODE")"
done
TMP="${OUT}.part"
ERRLOG="$(mktemp)"

cleanup() {
  rm -f "$TMP" "$ERRLOG"
  [ -n "${SNAR_WORK:-}" ] && [ -n "${SNAR_LIVE:-}" ] && rm -f "$SNAR_WORK"
  [ "$MODE" = "full" ] && rm -rf "$STG"
  return 0
}
trap cleanup EXIT

# --- tar 실행: 종료코드를 직접 받아 경고(1)와 치명적 실패(>=2)를 구분한다 -----------
set +e
tar --listed-incremental="$SNAR_WORK" -czf "$TMP" -C "$SRC_PARENT" "$SRC_NAME" 2>"$ERRLOG"
rc=$?
set -e

if [ "$rc" -ge 2 ]; then
  echo "ERROR: tar rc=${rc} — 이번 회차 폐기, 스냅샷 미전진" >&2
  sed 's/^/  tar: /' "$ERRLOG" >&2
  # 증분 중이었다면 스냅샷이 손상됐을 수 있다 → 폐기해 다음 실행이 전체 백업으로 자가복구
  if [ -n "$SNAR_LIVE" ]; then
    rm -f "$SNAR_LIVE"
    echo "  라이브 스냅샷 폐기 — 다음 실행은 전체 백업으로 복구됩니다" >&2
  fi
  exit "$rc"
fi

if [ "$rc" -eq 1 ]; then
  # 백업 중 파일이 삭제/변경/축소된 경우. 아카이브 자체는 유효하므로 승격하되 흔적을 남긴다.
  echo "WARN: tar 경고 종료(rc=1) — 아카이브는 유효하므로 승격합니다" >&2
  sed 's/^/  tar: /' "$ERRLOG" >&2
fi

# --- 검증 후 승격 -----------------------------------------------------------------
tar tzf "$TMP" >/dev/null 2>&1 || { echo "ERROR: 아카이브 검증 실패 — 폐기" >&2; exit 1; }
mv "$TMP" "$OUT"

if [ "$MODE" = "full" ]; then
  # 여기서 처음으로 파괴적 회전이 일어난다 — 새 전체 백업이 검증을 통과한 이후다
  rm -rf "$PREV"
  [ -d "$CUR" ] && mv "$CUR" "$PREV"
  mv "$STG" "$CUR"
  OUT="${CUR}/$(basename "$OUT")"
  STG=""   # 승격 완료 → cleanup 이 지우지 않도록
else
  # 아카이브와 스냅샷을 함께 승격한다(둘 중 하나만 반영되는 상태를 만들지 않는다)
  mv "$SNAR_WORK" "$SNAR_LIVE"
fi
trap - EXIT
rm -f "$ERRLOG"

SIZE="$(stat -c %s "$OUT")"
FILES="$(tar tzf "$OUT" 2>/dev/null | grep -vc '/$' || true)"

# --- off-VPS 반출: 설정돼 있는데 실패하면 스크립트도 실패해야 한다 -------------------
if [ -n "$BACKUP_REMOTE" ]; then
  [ -x "$RCLONE" ] || { echo "ERROR: BACKUP_REMOTE 설정됐으나 rclone 없음: $RCLONE" >&2; exit 1; }
  # shellcheck disable=SC2086
  "$RCLONE" copy "$OUT" "${BACKUP_REMOTE}/uploads/${CYCLE}/" $RCLONE_FLAGS \
    || { echo "ERROR: off-VPS 반출 실패: ${BACKUP_REMOTE}/uploads/${CYCLE}/" >&2; exit 1; }
  echo "off-VPS 반출 완료: ${BACKUP_REMOTE}/uploads/${CYCLE}/"
fi

echo "uploads backup done: $(basename "$OUT") mode=${MODE} cycle=${CYCLE} files=${FILES} size=${SIZE}B"

# 완주했을 때만 핑 → 어떤 이유로든 중단되면 정해진 시각에 핑이 안 와 알림이 간다
if [ -n "$HC_URL_UPLOADS" ]; then
  curl -fsS -m 10 "$HC_URL_UPLOADS" >/dev/null || echo "WARN: healthcheck 핑 실패" >&2
fi
