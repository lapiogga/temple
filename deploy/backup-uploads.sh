#!/usr/bin/env bash
# 업로드 이미지(public/uploads) 백업 — 월 1회 전체 + 매일 증분(GNU tar --listed-incremental).
# 스크립트가 놓인 체크아웃 기준으로 동작한다(prod/dev 공용).
#
# 보관 구조:
#   /home/ubuntu/backups/uploads/current/   이번 주기(전체 1 + 증분 N) + uploads.snar
#   /home/ubuntu/backups/uploads/prev/      직전 주기(전체 백업 시 교체)
#   → 항상 최소 1개 주기가 온전히 남는다.
#
# 복원(같은 주기 안에서 전체 → 증분 순서대로):
#   cd /home/ubuntu/backups/uploads/current
#   for f in $(ls -1 uploads_*_full.tar.gz; ls -1 uploads_*_inc.tar.gz | sort); do
#     tar --listed-incremental=/dev/null -xzf "$f" -C /var/www/temple/public
#   done
#   파일명 일련번호 덕에 사전순 정렬 = 생성순이므로 sort 결과를 그대로 쓰면 된다.
#
# cron 등록:
#   0 19 * * *  /var/www/temple/deploy/backup-uploads.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_PARENT="${APP_DIR}/public"
SRC_NAME="uploads"
BACKUP_ROOT="${BACKUP_ROOT:-/home/ubuntu/backups/uploads}"
CUR="${BACKUP_ROOT}/current"
PREV="${BACKUP_ROOT}/prev"
SNAR="${CUR}/uploads.snar"

# off-VPS 반출(선택): rclone 설정 후 아래 환경변수를 지정하면 업로드한다.
#   예) BACKUP_REMOTE="b2:temple-backups/uploads"
BACKUP_REMOTE="${BACKUP_REMOTE:-}"

[ -d "${SRC_PARENT}/${SRC_NAME}" ] || { echo "ERROR: 업로드 디렉터리 없음: ${SRC_PARENT}/${SRC_NAME}" >&2; exit 1; }
mkdir -p "$CUR"

STAMP="$(date +%Y%m%d_%H%M%S)"
DAY="$(date +%d)"

# 매월 1일 또는 스냅샷 파일이 없으면 전체 백업(새 주기 시작)
if [ "$DAY" = "01" ] || [ ! -f "$SNAR" ]; then
  MODE="full"
  # 직전 주기를 prev 로 교체(이전 prev 는 폐기)
  if [ -n "$(ls -A "$CUR" 2>/dev/null)" ]; then
    rm -rf "$PREV"
    mv "$CUR" "$PREV"
    mkdir -p "$CUR"
  fi
  rm -f "$SNAR"
else
  MODE="inc"
fi

# 파일명에 항상 2자리 일련번호를 넣는다. 같은 초에 두 번 실행돼도 덮어쓰지 않고,
# 사전순 정렬이 곧 생성순이 되어 복원 시 증분 적용 순서가 보장된다.
# (덮어쓰면 스냅샷만 진행되고 그 사이 변경분을 담은 아카이브가 사라져 복구 불가가 된다)
n=1
OUT="$(printf '%s/uploads_%s_%02d_%s.tar.gz' "$CUR" "$STAMP" "$n" "$MODE")"
while [ -e "$OUT" ]; do
  n=$((n + 1))
  OUT="$(printf '%s/uploads_%s_%02d_%s.tar.gz' "$CUR" "$STAMP" "$n" "$MODE")"
done
TMP="${OUT}.part"
trap 'rm -f "$TMP"' EXIT

# --listed-incremental: 스냅샷 파일과 대조해 변경분만 담는다(전체 백업 시 스냅샷 신규 생성)
tar --listed-incremental="$SNAR" -czf "$TMP" -C "$SRC_PARENT" "$SRC_NAME"

mv "$TMP" "$OUT"
trap - EXIT

SIZE="$(stat -c %s "$OUT")"
FILES="$(tar tzf "$OUT" 2>/dev/null | grep -vc '/$' || true)"

# off-VPS 반출(설정된 경우에만)
if [ -n "$BACKUP_REMOTE" ] && command -v rclone >/dev/null 2>&1; then
  rclone copy "$OUT" "$BACKUP_REMOTE" && echo "off-VPS 반출 완료: $BACKUP_REMOTE"
fi

echo "uploads backup done: $(basename "$OUT") mode=${MODE} files=${FILES} size=${SIZE}B"
