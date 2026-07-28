# 응선사 홈페이지 — Hostinger VPS 배포 가이드

> 결정(2026-07-28): kis_quant와 완전 분리된 독립 운영환경을 **Hostinger VPS**에 구축.
> 스택은 현재 devbox와 동일(로컬 PostgreSQL + 로컬 디스크 이미지) → **S3 리팩터 불필요**, 기존 `deploy/` 자산 재사용.

---

## 1. 사용자가 직접 할 일 — VPS 구매 (제가 대신 못 함)

Hostinger 콘솔·결제 접근이 불가하므로 아래는 사용자님이 진행하셔야 합니다.

### 구매 사양 (권장)
| 항목 | 권장값 | 이유 |
|------|--------|------|
| 상품 | **VPS — KVM2** (2 vCPU / 8GB RAM / 100GB NVMe / 8TB 대역폭) | 8GB라 빌드 OOM 없음, 100GB로 5년치 이미지(24GB)+DB 여유 |
| OS 템플릿 | **Ubuntu 24.04 (LTS, 순정)** | 앱스택 자동설치 스크립트가 이 기준 |
| 리전(로케이션) | **한국에 가장 가까운 곳**(싱가포르 있으면 싱가포르, 없으면 인도/일본 등 목록 중 최근접) | 한국 DC 없음 → 레이턴시 최소화 |
| 약정 기간 | 예산에 따라 선택 | 장기약정=월단가↓(선결제), 갱신가는 오름. 24개월이 무난 |
| 백업 | **일간 자동 백업 애드온 켜기 권장** | 단일 VPS 내구성 보완(그래도 외부백업 별도 권장) |

> 구매 후 확보되는 것: **VPS 공인 IP + root 비밀번호(또는 SSH 키)**. 이 둘이 있어야 배포합니다.

### ⚠️ 도메인
- 지금은 도메인 없이 **IP + self-signed HTTPS**로 띄웁니다(관리자/내부 검증용). 일반 방문자에겐 브라우저 경고가 뜨고 카카오맵은 IP에선 안 뜹니다.
- **도메인 확정 후** certbot 무료 인증서로 전환하면 정식 공개 상태가 됩니다(§4).
- Hostinger '첫해 무료 도메인'은 지금 바로 정하지 않으면 혜택이 사라질 수 있으니, 도메인 계획이 있으면 구매 시 함께 고려하세요.

---

## 2. 배포 실행 (구매 후) — 둘 중 하나

### 방법 A) 제가 SSH로 직접 배포 (권장)
VPS IP와 접속 수단을 주시면(이 세션에서 `!` 명령으로 SSH 키 등록 등), 제가 접속해
`deploy/bootstrap-hostinger.sh`를 실행하고 검증까지 마칩니다. **실행 직전 다시 확인받습니다.**

### 방법 B) 사용자가 스크립트 직접 실행
VPS에 root로 접속 후:
```bash
# 소스 받기
git clone https://github.com/lapiogga/temple.git
cd temple
# (선택) 카카오 키가 있으면 환경변수로 전달
export KAKAO_MAP_KEY=발급받은_JS키   # 없으면 생략(지도 OSM 폴백)
# 실행 — Node/PostgreSQL/nginx/빌드/systemd/self-signed HTTPS/방화벽 자동 구성
chmod +x deploy/bootstrap-hostinger.sh
sudo ./deploy/bootstrap-hostinger.sh
```
스크립트가 **DB 비밀번호·SESSION_SECRET을 자동 생성**해 `.env`에 기록합니다(커밋 안 됨).
끝에 접속 URL과 다음 단계가 출력됩니다.

### 배포 직후 운영자 계정 시드
```bash
sudo -u ubuntu bash -lc "cd /home/ubuntu/projects/temple && npm run db:seed -- 아이디 비밀번호 표시이름"
```

### 검증
```bash
curl -k -I https://<VPS_IP>/           # 200
systemctl status temple                 # active (running)
```
브라우저로 `https://<VPS_IP>` → 경고 통과 → 로그인 → 게시판 글쓰기·이미지 업로드·삭제 확인.

---

## 3. hPanel 방화벽
Hostinger hPanel의 VPS 방화벽에서도 **80/443/22 인바운드 허용**을 확인하세요(스크립트는 서버 내부 ufw만 엽니다).

---

## 4. 도메인 나중 연결 (정식 공개)
```bash
# 1) 등록기관/hPanel에서 도메인 A레코드 → VPS IP
# 2) nginx server_name 을 도메인으로 수정 후
sudo certbot --nginx -d 도메인 -d www.도메인      # Let's Encrypt 무료·자동갱신
# 3) NEXT_PUBLIC_SITE_URL 은 빌드타임 baked → 재빌드 필수
#    .env: NEXT_PUBLIC_SITE_URL=https://도메인
sudo -u ubuntu bash -lc "cd /home/ubuntu/projects/temple && npm run build"
sudo systemctl restart temple
# 4) 카카오 개발자콘솔에 도메인 등록(지도 자동 전환)
```

---

## 5. 백업 (내구성 보완 — 중요)
단일 VPS라 디스크 장애 시 이미지+DB 동시 유실 위험. 최소:
```bash
# DB 일 1회 pg_dump (기존 스크립트)
crontab -e →  0 4 * * *  /home/ubuntu/projects/temple/deploy/backup-db.sh
# 이미지 tar + DB덤프를 외부(S3/Backblaze B2 등)로 반출 권장(off-VPS)
```
+ Hostinger 일간백업 애드온 병행.

---

## 6. 기존 콘텐츠 마이그레이션 (게시글 ~200 + 이미지 ~2000장) — 소스 확인 후
- 이미지: `rsync`/`scp`로 `public/uploads/`에 복사(로컬 디스크 영속).
- 게시글: 원본 형식(SQL덤프/CSV/CMS export) 확인 후 1회성 이관 스크립트로 로컬 PG에 INSERT(sanitize 재적용).
- 상세는 `docs/09_독립배포_아키텍처_분석.md` §5.

---

## 재배포(코드 수정 후)
```bash
cd /home/ubuntu/projects/temple && ./deploy/deploy.sh   # git pull → npm ci → build → restart
```
