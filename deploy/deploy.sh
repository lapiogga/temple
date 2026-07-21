#!/usr/bin/env bash
# 재배포 스크립트: git pull → 의존성 → 빌드 → 재시작
set -euo pipefail
cd /home/ubuntu/projects/temple
git pull --ff-only || true
npm ci
npm run build
sudo systemctl restart temple
echo "deployed & restarted."
