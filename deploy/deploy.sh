#!/usr/bin/env bash
# 재배포: git pull → (필요할 때만) 의존성 → (prod 만) 빌드 → 재시작
#
# ── 왜 다시 썼나 ────────────────────────────────────────────────
# 예전 판은 둘째 줄이 `cd /home/ubuntu/projects/temple` 이었다. EC2 시절 경로라 지금은
# 없는 디렉터리이고, `set -euo pipefail` 이라 거기서 즉사했다. 즉 이 스크립트는
# Hostinger 로 옮긴 뒤 한 번도 성공한 적이 없다 — 재배포 표준 경로가 없어서
# 2026-07-29 수정을 손으로 때웠고 prod 가 뒤처졌던 것도 그래서다.
#
# 그렇다고 경로를 /var/www/temple 로 바꿔 박으면 더 나쁘다. dev 체크아웃에서
# 실행해도 prod 를 재시작하는 함정이 생긴다. 그래서 대상을 두 단계로 정한다.
#   1) 이 스크립트가 놓인 체크아웃(ROOT)을 기준으로 삼는다.
#   2) 그 ROOT 를 WorkingDirectory 로 갖는 systemd 유닛을 살아 있는 시스템에서 찾는다.
# 대응하는 유닛이 없으면 아무것도 하지 않고 멈춘다. 추측해서 남의 서비스를 만지지 않는다.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── 소유자 확인 ────────────────────────────────────────────────
# root 로 git pull·npm 을 돌리면 .git 객체와 .next 가 root 소유로 생긴다. 서비스는
# User=ubuntu 로 돌므로 이후 쓰기가 막히고, 다음 배포 때 ubuntu 로 도는 git 이
# "dubious ownership" 으로 거부한다(2026-07-31 에 실제로 겪었다).
OWNER="$(stat -c '%U' "$ROOT")"
if [ "$(id -un)" != "$OWNER" ]; then
  echo "이 체크아웃의 소유자는 '$OWNER' 인데 지금 '$(id -un)' 로 실행 중이다." >&2
  echo "소유자로 실행할 것:  runuser -u $OWNER -- $0" >&2
  exit 1
fi

# ── 대상 서비스 역산 ───────────────────────────────────────────
SERVICE=""
while read -r unit; do
  [ -n "$unit" ] || continue
  wd="$(systemctl show "$unit" -p WorkingDirectory --value 2>/dev/null || true)"
  if [ "$wd" = "$ROOT" ]; then SERVICE="$unit"; break; fi
done < <(systemctl list-unit-files --no-legend 'temple*.service' 2>/dev/null | awk '{print $1}')

if [ -z "$SERVICE" ]; then
  echo "이 체크아웃($ROOT)을 WorkingDirectory 로 갖는 temple*.service 가 없다." >&2
  echo "운영 서버의 prod/dev 체크아웃에서 실행할 것." >&2
  exit 1
fi

# next dev 는 .next 를 계속 물고 있어 빌드 대상이 아니다. 같은 디렉터리에서 build 를
# 돌리면 돌아가는 dev 서버와 .next 를 두고 충돌한다. 무엇을 실행하는 유닛인지로 가른다.
EXEC="$(systemctl show "$SERVICE" -p ExecStart --value 2>/dev/null || true)"
case "$EXEC" in
  *"next dev"*) NEEDS_BUILD=0 ;;
  *)            NEEDS_BUILD=1 ;;
esac

echo "체크아웃:    $ROOT"
echo "대상 서비스: $SERVICE (빌드 $([ "$NEEDS_BUILD" = 1 ] && echo 필요 || echo 불필요))"

# ── 받기 ───────────────────────────────────────────────────────
BEFORE="$(git rev-parse HEAD)"
git pull --ff-only
AFTER="$(git rev-parse HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "받을 것이 없다($BEFORE). 그래도 빌드·재시작은 진행한다 — 이전 배포가 중간에"
  echo "멈춰 소스와 빌드가 어긋나 있을 수 있다."
fi

# ── 의존성 ─────────────────────────────────────────────────────
#
# npm ci 는 node_modules 를 통째로 지우고 다시 깐다. 돌아가는 서버 밑에서 매번 할 일이
# 아니라 필요할 때만 돌린다. 그런데 "필요한가" 를 판정하는 방법을 처음에 잘못 골랐다.
#
# 예전 판은 '이번 pull 에서 잠금 파일이 바뀌었는가' 만 봤다. 그러면 누가 먼저 pull 해 둔
# 뒤에 이 스크립트를 돌릴 때 BEFORE == AFTER 가 되어 건너뛴다. 2026-07-31 배포에서 실제로
# 그랬다 — sharp 가 새로 들어온 배포였는데 npm ci 를 건너뛸 뻔했고 손으로 넣어야 했다.
#
# git 이력이 아니라 **지금 깔려 있는 것**을 봐야 한다. npm ls 는 package.json/잠금이
# 요구하는 트리와 실제 node_modules 가 맞는지 npm 자신의 기준으로 확인한다
# (격리 사본에서 sharp 하나를 지우고 재 보니 종료코드가 0 → 1 로 바뀌었다).
#
# 두 신호를 OR 로 묶는다. 불필요하게 한 번 더 도는 비용은 십여 초지만, 안 돌았을 때는
# 빌드가 옛 모듈로 돌거나 실패한다. 비대칭이 크므로 도는 쪽으로 기운다.
NEED_INSTALL=0
if [ ! -d node_modules ]; then
  NEED_INSTALL=1; WHY="node_modules 없음"
elif ! npm ls --silent >/dev/null 2>&1; then
  NEED_INSTALL=1; WHY="설치된 트리가 잠금과 어긋남(npm ls)"
elif [ "$BEFORE" != "$AFTER" ] && \
     ! git diff --quiet "$BEFORE" "$AFTER" -- package.json package-lock.json; then
  NEED_INSTALL=1; WHY="이번 pull 에 의존성 변경"
fi

if [ "$NEED_INSTALL" = 1 ]; then
  echo "의존성 설치 필요($WHY) → npm ci"
  npm ci
else
  echo "의존성 이상 없음 → npm ci 건너뜀"
fi

# ── 빌드 ───────────────────────────────────────────────────────
if [ "$NEEDS_BUILD" = 1 ]; then
  npm run build
fi

# ── 재시작 ─────────────────────────────────────────────────────
# 이 환경의 sudo 는 비밀번호를 요구한다. TTY 가 없는 곳(에이전트 셸·cron)에서는
# 조용히 실패하므로, 되는지 먼저 보고 안 되면 명령을 알려 주고 실패로 끝낸다.
# 여기서 성공한 척 끝내면 빌드는 새것인데 서버는 옛것인 상태가 남는다 — 그 상태는
# 정적 청크 이름이 어긋나 화면 일부가 404 가 된다(2026-07-31 에 /events 가 그랬다).
if sudo -n systemctl restart "$SERVICE" 2>/dev/null; then
  echo "재시작 완료: $SERVICE"
  systemctl is-active "$SERVICE"
else
  echo >&2
  echo "빌드까지 끝났으나 재시작을 하지 못했다(sudo 가 비밀번호를 요구한다)." >&2
  echo "실제 터미널에서 아래를 실행할 것:" >&2
  echo "    sudo systemctl restart $SERVICE" >&2
  echo >&2
  echo "이 상태를 방치하면 새 빌드와 옛 서버가 어긋나 정적 자산 일부가 404 가 된다." >&2
  exit 2
fi
