#!/usr/bin/env bash
# 응선사 홈페이지 — off-VPS 백업(R2) 경로 점검
#
# 언제 돌리나
#   - R2 토큰을 교체한 직후 (교체가 성공했는지 확인)
#   - 서버를 재구축했거나 rclone 설정을 옮긴 뒤
#   - 주기적 점검 (백업이 조용히 멈추지 않았는지)
#
# 무엇을 보나
#   1) rclone·설정 존재        2) 원격 쓰기·읽기 왕복(내용 일치)
#   3) bucket lock 이 살아있는지  ← 삭제가 "성공하면" 실패로 친다
#   4) 원격 백업 신선도         ← 조용히 멈춘 백업을 잡는 유일한 신호
#
# 사용: ./verify-backup-remote.sh [BACKUP_REMOTE]
#       BACKUP_REMOTE 미지정 시 환경변수 → crontab 순으로 찾는다.
set -uo pipefail

RCLONE="${RCLONE:-/home/ubuntu/bin/rclone}"
RCLONE_FLAGS="${RCLONE_FLAGS:---s3-no-check-bucket}"
STALE_HOURS="${STALE_HOURS:-48}"   # 이보다 오래된 최신 백업 = 이상

REMOTE="${1:-${BACKUP_REMOTE:-}}"
[ -n "$REMOTE" ] || REMOTE="$(crontab -l 2>/dev/null | sed -n 's/^BACKUP_REMOTE=//p' | tail -1)"

fail=0
ok()   { echo "  OK   $*"; }
bad()  { echo "  실패 $*"; fail=1; }
warn() { echo "  주의 $*"; }

echo "== off-VPS 백업 경로 점검 =="
echo "목적지: ${REMOTE:-(없음)}"

# 1) 전제조건 ---------------------------------------------------------------
if [ -z "$REMOTE" ]; then
  bad "BACKUP_REMOTE 를 찾을 수 없다 — 인자·환경변수·crontab 어디에도 없다."
  echo "     => 반출이 아예 꺼져 있다. crontab 에 BACKUP_REMOTE 를 넣어야 한다."
  exit 1
fi
[ -x "$RCLONE" ] && ok "rclone: $($RCLONE version 2>/dev/null | head -1)" \
                 || { bad "rclone 없음: $RCLONE"; exit 1; }

CONF="${RCLONE_CONFIG:-$HOME/.config/rclone/rclone.conf}"
if [ -f "$CONF" ]; then
  PERM="$(stat -c %a "$CONF")"
  [ "$PERM" = "600" ] && ok "설정 퍼미션 600" || warn "설정 퍼미션이 $PERM 다 (600 권장): $CONF"
else
  bad "rclone 설정 없음: $CONF"; exit 1
fi

# 2) 쓰기·읽기 왕복 ---------------------------------------------------------
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PROBE="probe_${STAMP}.txt"
echo "r2-verify-${STAMP}" > "${TMP}/${PROBE}"

if "$RCLONE" copy "${TMP}/${PROBE}" "${REMOTE}/_probe/" $RCLONE_FLAGS >/dev/null 2>&1; then
  ok "원격 쓰기"
else
  bad "원격 쓰기 실패 — 키 만료·권한·네트워크를 의심하라"; exit 1
fi

if "$RCLONE" copy "${REMOTE}/_probe/${PROBE}" "${TMP}/back/" $RCLONE_FLAGS >/dev/null 2>&1 \
   && cmp -s "${TMP}/${PROBE}" "${TMP}/back/${PROBE}"; then
  ok "원격 읽기 + 내용 일치"
else
  bad "되받기 실패 또는 내용 불일치"
fi

# 3) bucket lock — 지워지면 안 된다 -----------------------------------------
# 삭제가 성공한다는 것은 락이 없다는 뜻이고, 키가 유출되면 원격 백업이 통째로
# 파괴될 수 있다는 뜻이다. 그래서 여기서는 "삭제 성공"이 실패다.
"$RCLONE" delete "${REMOTE}/_probe/${PROBE}" $RCLONE_FLAGS >/dev/null 2>&1
if "$RCLONE" lsf "${REMOTE}/_probe/${PROBE}" $RCLONE_FLAGS 2>/dev/null | grep -q .; then
  ok "bucket lock 작동 — 삭제가 차단됐다"
else
  bad "bucket lock 이 없다: 방금 올린 객체가 지워졌다."
  echo "     => R2 대시보드 > 버킷 > Settings > Bucket lock rules 에서 보존 규칙을 걸어라."
  echo "        이게 없으면 VPS 가 털렸을 때 원격 백업까지 함께 파괴된다."
fi

# 4) 신선도 — 조용히 멈춘 백업 잡기 -----------------------------------------
NOW=$(date -u +%s)
check_fresh() {                       # $1=prefix  $2=사람이 읽는 이름
  local newest
  newest="$("$RCLONE" lsf "${REMOTE}/$1" --format tp --files-only -R $RCLONE_FLAGS 2>/dev/null \
            | sort | tail -1)"
  if [ -z "$newest" ]; then
    bad "$2: 원격에 백업이 하나도 없다"
    return
  fi
  local when age_h
  when="${newest%%;*}"
  age_h=$(( (NOW - $(date -u -d "$when" +%s)) / 3600 ))
  if [ "$age_h" -le "$STALE_HOURS" ]; then
    ok "$2 최신본 ${age_h}시간 전 (${newest##*;})"
  else
    bad "$2 최신본이 ${age_h}시간 전이다 — 백업이 멈췄을 수 있다 (${newest##*;})"
  fi
}
check_fresh db     "DB"
check_fresh uploads "이미지"

# 이미지는 전체 아카이브가 있어야 복원이 성립한다. 증분만 있으면 복구 불가다.
CYCLES="$("$RCLONE" lsf "${REMOTE}/uploads/" --dirs-only $RCLONE_FLAGS 2>/dev/null)"
for c in $CYCLES; do
  if "$RCLONE" lsf "${REMOTE}/uploads/${c}" $RCLONE_FLAGS 2>/dev/null | grep -q '_full\.tar\.gz$'; then
    ok "주기 ${c%/} — 전체 아카이브 있음"
  else
    bad "주기 ${c%/} — 전체 아카이브가 없다. 증분만으로는 복원되지 않는다"
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "결과: 정상"
else
  echo "결과: 문제 발견 — 위의 '실패' 항목을 조치하라"
fi
exit "$fail"
