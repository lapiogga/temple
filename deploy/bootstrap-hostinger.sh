#!/usr/bin/env bash
# =============================================================================
# 응선사 홈페이지 — Hostinger VPS 자동 배포 (dev/prod 분리, Ubuntu 24.04 / KVM2)
# -----------------------------------------------------------------------------
# 단일 VPS에 개발/운영을 디렉터리·DB·포트·서비스로 분리해 구성한다.
#   운영(prod): /var/www/temple      · DB temple      · :3000 · nginx 공개 HTTPS
#   개발(dev) : ~ubuntu/temple-dev   · DB temple_dev  · :3001 · localhost 전용
# 공유: Node20 · PostgreSQL(단일 인스턴스, DB만 분리) · nginx
#
# 사용: root 로 1회 실행.  sudo ./bootstrap-hostinger.sh
# 안전: 시크릿 자동 생성 → 각 .env(600) 에만 기록(커밋 안 됨). 최대한 멱등.
# =============================================================================
set -euo pipefail

# ---------- CONFIG -----------------------------------------------------------
REPO_URL="https://github.com/lapiogga/temple.git"
PUBLIC_HOST="${PUBLIC_HOST:-$(curl -s --max-time 5 https://api.ipify.org || echo '127.0.0.1')}"
KAKAO_MAP_KEY="${KAKAO_MAP_KEY:-}"     # 없으면 지도 OSM 폴백. 도메인 확보 후 설정 권장.
# -----------------------------------------------------------------------------
APP_USER="ubuntu"
PROD_DIR="/var/www/temple"
DEV_DIR="/home/${APP_USER}/temple-dev"
DB_ROLE="temple"
PROD_DB="temple"
DEV_DB="temple_dev"
PROD_PORT=3000
DEV_PORT=3001

[ "$(id -u)" -eq 0 ] || { echo "root 로 실행하세요 (sudo)."; exit 1; }
echo "==> PUBLIC_HOST=${PUBLIC_HOST}"

echo "==> [1/8] apt 잠금 대기(자동업데이트) + 패키지 + Node20"
for i in $(seq 1 60); do fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || break; echo "  dpkg 잠금 대기..."; sleep 5; done
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx postgresql postgresql-contrib openssl ufw ca-certificates
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

echo "==> [2/8] 앱 사용자(${APP_USER})"
id -u "${APP_USER}" >/dev/null 2>&1 || { adduser --disabled-password --gecos "" "${APP_USER}"; usermod -aG sudo "${APP_USER}"; }

echo "==> [3/8] PostgreSQL 역할 + DB 2개(prod/dev 분리)"
systemctl enable --now postgresql
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_ROLE}'" | grep -q 1; then
  sudo -u postgres psql -c "ALTER USER ${DB_ROLE} WITH PASSWORD '${DB_PASS}';"
else
  sudo -u postgres psql -c "CREATE USER ${DB_ROLE} WITH PASSWORD '${DB_PASS}';"
fi
for db in "${PROD_DB}" "${DEV_DB}"; do
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE DATABASE ${db} OWNER ${DB_ROLE};"
done

echo "==> [4/8] 구 레이아웃 정리(중단된 부분배포 잔여)"
rm -rf "/home/${APP_USER}/projects/temple" 2>/dev/null || true

# 인스턴스 준비 함수: $1=dir $2=db $3=site_url
setup_instance() {
  local dir="$1" db="$2" site="$3"
  install -d -o "${APP_USER}" -g "${APP_USER}" "$(dirname "$dir")"
  if [ -d "$dir/.git" ]; then
    sudo -u "${APP_USER}" git -C "$dir" pull --ff-only
  else
    sudo -u "${APP_USER}" git clone "${REPO_URL}" "$dir"
  fi
  local secret; secret="$(openssl rand -base64 32)"
  cat > "$dir/.env" <<ENV
DATABASE_URL=postgresql://${DB_ROLE}:${DB_PASS}@localhost:5432/${db}
NEXT_PUBLIC_SITE_URL=${site}
SESSION_SECRET=${secret}
NEXT_PUBLIC_KAKAO_MAP_KEY=${KAKAO_MAP_KEY}
ENV
  chown "${APP_USER}:${APP_USER}" "$dir/.env"; chmod 600 "$dir/.env"
  install -d -o "${APP_USER}" -g "${APP_USER}" "$dir/public/uploads"
}

echo "==> [5/8] 운영(prod) 구성: ${PROD_DIR} (빌드+DB초기화)"
install -d -o "${APP_USER}" -g "${APP_USER}" /var/www
setup_instance "${PROD_DIR}" "${PROD_DB}" "https://${PUBLIC_HOST}"
sudo -u "${APP_USER}" bash -lc "cd '${PROD_DIR}' && npm ci && npm run build && set -a && . ./.env && set +a && npm run db:init"

echo "==> [6/8] 개발(dev) 구성: ${DEV_DIR} (deps+DB초기화, next dev 는 실행시 컴파일)"
setup_instance "${DEV_DIR}" "${DEV_DB}" "http://localhost:${DEV_PORT}"
sudo -u "${APP_USER}" bash -lc "cd '${DEV_DIR}' && npm ci && set -a && . ./.env && set +a && npm run db:init"

echo "==> [7/8] systemd 서비스 2종"
cat > /etc/systemd/system/temple.service <<UNIT
[Unit]
Description=Temple Website (PROD :${PROD_PORT})
After=network.target postgresql.service
[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${PROD_DIR}
Environment=NODE_ENV=production
EnvironmentFile=${PROD_DIR}/.env
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/systemd/system/temple-dev.service <<UNIT
[Unit]
Description=Temple Website (DEV localhost:${DEV_PORT})
After=network.target postgresql.service
[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${DEV_DIR}
EnvironmentFile=${DEV_DIR}/.env
ExecStart=/usr/bin/npx next dev -H 127.0.0.1 -p ${DEV_PORT}
Restart=on-failure
RestartSec=5
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now temple
systemctl enable --now temple-dev
sleep 3
systemctl --no-pager is-active temple temple-dev || true

echo "==> [8/8] nginx(공개 HTTPS self-signed, prod만) + rate-limit + 방화벽"
[ -f /etc/ssl/certs/temple-selfsigned.crt ] || openssl req -x509 -nodes -days 90 -newkey rsa:2048 \
  -keyout /etc/ssl/private/temple-selfsigned.key \
  -out    /etc/ssl/certs/temple-selfsigned.crt -subj "/CN=${PUBLIC_HOST}"
cat > /etc/nginx/conf.d/temple-limit.conf <<'LIM'
limit_req_zone $binary_remote_addr zone=temple_login:10m rate=5r/m;
LIM
cp "${PROD_DIR}/deploy/nginx-temple.conf" /etc/nginx/sites-available/temple
ln -sf /etc/nginx/sites-available/temple /etc/nginx/sites-enabled/temple
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ufw allow 22/tcp || true; ufw allow 80/tcp || true; ufw allow 443/tcp || true
yes | ufw enable || true    # dev :3001 은 개방하지 않음(localhost 전용)

echo ""
echo "============================================================"
echo " 완료 (dev/prod 분리)"
echo "  운영: https://${PUBLIC_HOST}   (self-signed 경고 정상)"
echo "  개발: http://127.0.0.1:${DEV_PORT}  (SSH 터널로만: ssh -L ${DEV_PORT}:127.0.0.1:${DEV_PORT} root@${PUBLIC_HOST})"
echo ""
echo "  DB: role=${DB_ROLE}  prod=${PROD_DB}  dev=${DEV_DB}  (같은 PG, DB만 분리)"
echo "  .env: ${PROD_DIR}/.env , ${DEV_DIR}/.env (시크릿, 커밋 금지)"
echo ""
echo " 다음:"
echo "  1) 운영자 시드(prod/dev 각각):"
echo "     sudo -u ${APP_USER} bash -lc \"cd ${PROD_DIR} && npm run db:seed -- <아이디> <비번> <표시이름>\""
echo "     sudo -u ${APP_USER} bash -lc \"cd ${DEV_DIR}  && npm run db:seed -- <아이디> <비번> <표시이름>\""
echo "  2) Hostinger hPanel 방화벽에서 80/443/22 허용 확인"
echo "  3) 도메인 확보 후: A레코드→${PUBLIC_HOST}, certbot --nginx, .env SITE_URL 교체 후 prod 재빌드"
echo "  4) 재배포(운영): cd ${PROD_DIR} && git pull && npm ci && npm run build && sudo systemctl restart temple"
echo "============================================================"
