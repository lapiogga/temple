> # ⛔ 폐기된 문서 — 따라 하지 말 것
>
> 이 사이트는 **AWS EC2 에서 돌지 않는다.** Hostinger VPS 한 대에서 prod(`/var/www/temple`)와
> dev(`/home/ubuntu/temple-dev`)를 같이 띄운다. 아래 내용은 2026-07 이전 EC2 시절 기준이라
> 경로·명령이 전부 어긋나 있고, **그대로 따라 하면 운영이 죽는다.**
>
> - `§5` 가 `deploy/temple.service` 를 `/etc/systemd/system/` 에 복사하라고 안내했는데,
>   그 파일의 `WorkingDirectory` 는 없는 경로(`/home/ubuntu/projects/temple`)였다.
>   복사하면 prod 가 **다음 재시작에서 기동 실패**한다. 그래서 그 파일은 2026-07-31 에
>   삭제했다(유닛은 `bootstrap-hostinger.sh` 가 인라인으로 만든다).
> - `§9` 의 재배포 경로도 없는 디렉터리다. 재배포는 `deploy/deploy.sh` 를 체크아웃 안에서
>   실행하면 되고, 스크립트가 스스로 대상 서비스를 알아낸다.
>
> **현행 문서는 `deploy/HOSTINGER_SETUP.md` 와 `docs/10_잔여작업_로드맵.md` 다.**
> 이 파일은 EC2 시절 이력을 남겨 두려고 보관할 뿐이다.

---

# AWS EC2 셋업 & 배포 가이드 (폐기)

대상: Ubuntu EC2 (서울 리전 ap-northeast-2 권장) · 자체 PostgreSQL · Nginx · Next.js · Let's Encrypt

---

## 0. 사전 준비 (AWS 콘솔)
- **EC2 인스턴스**: Ubuntu 22.04/24.04, t3.small 이상 권장(빌드 메모리 고려). 운영/개발 인스턴스 분리 권장.
- **탄력적 IP(EIP)** 할당 → 인스턴스에 연결(재부팅해도 IP 유지).
- **보안그룹**:
  - 80(HTTP), 443(HTTPS) → 0.0.0.0/0
  - 22(SSH) → **내 IP만**
  - 5432(PostgreSQL) → **개방 금지**(로컬 전용)
- **Route 53**: 도메인 등록 후, A 레코드로 EIP 연결 (`example.kr`, `www.example.kr`).

---

## 1. 서버 기본 패키지
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

## 2. PostgreSQL (자체) 설정
```bash
sudo -u postgres psql <<'SQL'
CREATE USER temple WITH PASSWORD 'CHANGE_ME_STRONG';
CREATE DATABASE temple OWNER temple;
GRANT ALL PRIVILEGES ON DATABASE temple TO temple;
SQL
```
- 기본값(로컬 접속만 허용)을 유지합니다. `postgresql.conf` 의 `listen_addresses` 는 `localhost` 그대로 두세요.
- 보안그룹에서 5432 를 열지 않았는지 재확인.

## 3. 프로젝트 배치
```bash
mkdir -p /home/ubuntu/projects
cd /home/ubuntu/projects
# (A) 압축 전송본을 푼 경우: 이 폴더 이름이 temple 인지 확인
#     scp temple_bundle.tar.gz ubuntu@서버IP:/home/ubuntu/projects/
#     tar -xzf temple_bundle.tar.gz     # → /home/ubuntu/projects/temple
# (B) 깃 사용 시: git clone <레포> temple

cd temple
cp .env.example .env
nano .env      # DATABASE_URL 비밀번호/도메인 교체
```

`.env` 예:
```
DATABASE_URL=postgresql://temple:CHANGE_ME_STRONG@localhost:5432/temple
NEXT_PUBLIC_SITE_URL=https://example.kr
```

## 4. 의존성·DB·빌드
```bash
npm ci
npm run db:init          # db/schema.sql 적용 (psql 필요)
npm run build
```

## 5. 서비스 등록 (systemd)
```bash
sudo cp deploy/temple.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now temple
sudo systemctl status temple      # active(running) 확인
# 앱은 127.0.0.1:3000 에서 구동됨
```

## 6. Nginx 리버스 프록시
```bash
sudo cp deploy/nginx-temple.conf /etc/nginx/sites-available/temple
sudo nano /etc/nginx/sites-available/temple   # server_name 을 실제 도메인으로
sudo ln -s /etc/nginx/sites-available/temple /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 7. HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.kr -d www.example.kr
# 자동 갱신 확인
sudo systemctl status certbot.timer
```

## 8. 백업 cron
```bash
crontab -e
# 매일 04:00 DB 백업
0 4 * * * /home/ubuntu/projects/temple/deploy/backup-db.sh >> /home/ubuntu/backups/backup.log 2>&1
```
> 원격 반출은 `BACKUP_REMOTE` 환경변수 + rclone 으로 처리합니다. 설정 방법은
> `deploy/HOSTINGER_SETUP.md` §5 를 보세요. EBS 스냅샷도 주기 설정 권장.

> ⚠️ 이 문서는 EC2(kis_quant 공유 devbox) 시절 기록입니다. 2026-07-28 부로 운영은
> Hostinger VPS 로 이전됐고, 경로도 `/home/ubuntu/projects/temple` → prod `/var/www/temple` /
> dev `/home/ubuntu/temple-dev` 로 바뀌었습니다. 현행 절차는 `deploy/HOSTINGER_SETUP.md` 를 따르세요.

## 9. 재배포 (코드 수정 후)
```bash
cd /home/ubuntu/projects/temple
./deploy.sh        # git pull → npm ci → build → systemctl restart temple
```

---

## 체크리스트
- [ ] 보안그룹: 5432 외부 차단, 22 내 IP 제한
- [ ] `.env` 비밀번호 강력하게, git 에 커밋 금지(.gitignore 확인)
- [ ] `npm run db:init` 로 테이블 생성 확인
- [ ] systemd active(running), Nginx 200 응답
- [ ] certbot 인증서 발급 및 자동 갱신 타이머 활성
- [ ] 백업 cron 동작(다음날 백업 파일 확인)
- [ ] Route 53 A 레코드가 EIP 를 가리키는지

## 서버에서 개발 이어가기 (Claude Code)
`/home/ubuntu/projects/temple` 에서 Claude Code 를 실행해 다음을 이어가면 됩니다:
- 관리자(운영자) 화면: 소식·중창기·갤러리·일정 등록 (1차 필수)
- 소식/법회/중창기 페이지를 `src/lib/db.js` 쿼리로 DB 연동(현재는 page.js 상단 상수 데이터)
- 서브 페이지(사찰 소개, 중창기 상세, 소식 목록/상세)
- 2차: 회원·커뮤니티 (members/posts/comments, visibility='member' 활용)
